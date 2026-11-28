<?php

declare(strict_types=1);

namespace App\Deployment;

use Illuminate\Support\Facades\DB;
use RuntimeException;

final class PersistentSecurity
{
    public function authority(array $target): array
    {
        $sets = [];
        foreach (['legacy_owner_roles', 'retired_runtime_roles'] as $field) {
            $names = $target[$field] ?? null;
            if (! is_array($names) || ! array_is_list($names) || count(array_unique($names)) !== count($names)) {
                throw new RuntimeException('Retirement identity sets must be explicit unique lists.');
            }
            sort($names);
            $sets[$field] = [];
            foreach ($names as $name) {
                if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9_]{2,62}$/D', $name)) {
                    throw new RuntimeException('Invalid retirement identity.');
                }
                $role = DB::selectOne('SELECT oid::text AS oid,rolname AS name FROM pg_roles WHERE rolname=?', [$name]);
                if (! $role) {
                    throw new RuntimeException('Retirement identity no longer exists.');
                }
                $sets[$field][] = (array) $role;
            }
        }
        if (array_intersect($target['legacy_owner_roles'], $target['retired_runtime_roles'])) {
            throw new RuntimeException('Owner/runtime classification is not disjoint.');
        }
        $identity = DB::selectOne('SELECT current_database() AS database, (SELECT oid::text FROM pg_database WHERE datname=current_database()) AS database_oid,
            (SELECT system_identifier::text FROM pg_control_system()) AS cluster,session_user AS bootstrap_role,
            (SELECT oid::text FROM pg_roles WHERE rolname=session_user) AS bootstrap_oid');

        return ['target' => (array) $identity, 'host' => $target['host'], 'port' => (string) $target['port'], 'retirement' => $sets];
    }

    public function preflight(array $target, bool $installed): array
    {
        $owners = $target['legacy_owner_roles'] ?? null;
        $runtime = $target['retired_runtime_roles'] ?? null;
        if (! is_array($owners) || ! is_array($runtime) || array_intersect($owners, $runtime)) {
            throw new RuntimeException('Legacy ownership and runtime must be separately classified.');
        }
        $legacy = array_merge($owners, $runtime);
        foreach ($legacy as $role) {
            if (! is_string($role) || ! preg_match('/^[a-z][a-z0-9_]{2,62}$/D', $role)
                || in_array($role, SecurityCatalog::ROLES, true) || $role === $target['bootstrap_role']
                || ! DB::selectOne('SELECT EXISTS(SELECT 1 FROM pg_roles WHERE rolname=? AND NOT rolsuper AND NOT rolcreatedb AND NOT rolcreaterole AND NOT rolreplication AND NOT rolbypassrls) AS safe', [$role])->safe) {
                throw new RuntimeException('Unsafe or ambiguous legacy role classification.');
            }
        }
        if ($installed) {
            app(SecurityCatalog::class)->verify($target['bootstrap_role']);
            $this->verifyRetired($legacy);

            return $legacy;
        }
        if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='deployment_control') OR EXISTS(SELECT 1 FROM pg_default_acl) AS unsafe")->unsafe) {
            throw new RuntimeException('Unregistered control schema or default privilege drift.');
        }
        $expected = SecurityCatalog::contract();
        $actual = app(SecurityCatalog::class)->snapshot($target['bootstrap_role']);
        foreach (['system_language_security', 'system_extension_security', 'system_schema_security', 'system_column_acl', 'system_type_security', 'system_routine_security', 'system_relation_security', 'system_rewrite_security'] as $family) {
            if ($actual[$family] !== $expected[$family]) {
                throw new RuntimeException('Unsupported stock system-catalog deviation.');
            }
        }
        $allowed = array_merge(['@bootstrap', 'PUBLIC', 'pg_database_owner'], $owners, $runtime);
        foreach (['schemas', 'relations', 'columns', 'routines', 'types', 'constraints', 'triggers'] as $section) {
            $known = array_column($expected[$section], null, 'name');
            foreach ($actual[$section] as $row) {
                if (! isset($known[$row['name']]) || (isset($row['owner']) && ! in_array($row['owner'], array_merge(['@bootstrap', 'pg_database_owner'], $owners), true))) {
                    throw new RuntimeException('Unknown object or unclassified target owner.');
                }
                if ($section === 'routines' && ($row['definition'] !== $known[$row['name']]['definition'] || $row['prosecdef'] !== $known[$row['name']]['prosecdef'])) {
                    throw new RuntimeException('Legacy executable routine drift.');
                }
                foreach ($row['acl'] ?? [] as $grant) {
                    if (! in_array($grant[0], $allowed, true) || ! in_array($grant[1], $allowed, true)) {
                        throw new RuntimeException('Unclassified target grant or grantor.');
                    }
                }
            }
        }
        foreach ($actual['database'] as $row) {
            if (! in_array($row['owner'], array_merge(['@bootstrap'], $owners), true)) {
                throw new RuntimeException('Database owner is outside authorized target topology.');
            }
            foreach ($row['acl'] as $grant) {
                if (! in_array($grant[0], $allowed, true) || ! in_array($grant[1], $allowed, true)) {
                    throw new RuntimeException('Unclassified database grant.');
                }
            }
        }
        // Runtime identities never acquire ownership, including views, routines and partitions.
        foreach ($runtime as $role) {
            if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_shdepend WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND refobjid=(SELECT oid FROM pg_roles WHERE rolname=?) AND deptype='o') AS owns", [$role])->owns) {
                throw new RuntimeException('Runtime/owner classification conflicts with actual ownership.');
            }
        }

        return $legacy;
    }

    public function clearLegacyGrants(array $legacy): void
    {
        // Only known canonical objects have passed inventory checks. Unknown grantees already refused.
        $roles = implode(',', array_merge(['PUBLIC'], $legacy));
        DB::unprepared('REVOKE ALL ON ALL TABLES IN SCHEMA public FROM '.$roles.';
            REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM '.$roles.';
            REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM '.$roles.';
            REVOKE ALL ON SCHEMA public FROM '.$roles);
    }

    public function finalize(array $legacy): void
    {
        DB::unprepared(file_get_contents(database_path('deployment/finalize.sql')));
        // Database and public-schema implicit ownership must not remain with a legacy role.
        $bootstrap = DB::selectOne('SELECT current_user AS role')->role;
        DB::unprepared('ALTER DATABASE "'.str_replace('"', '""', DB::connection()->getDatabaseName()).'" OWNER TO "'.str_replace('"', '""', $bootstrap).'";
            ALTER SCHEMA public OWNER TO kirion_g1b_owner');
        DB::unprepared('GRANT ALL ON ALL TABLES IN SCHEMA public,legacy_custody TO kirion_g1b_owner;
            GRANT ALL ON ALL SEQUENCES IN SCHEMA public,legacy_custody TO kirion_g1b_owner;
            GRANT ALL ON ALL ROUTINES IN SCHEMA public,legacy_custody TO kirion_g1b_owner;
            GRANT ALL ON SCHEMA public,legacy_custody TO kirion_g1b_owner');
        $roles = implode(',', array_merge(['PUBLIC'], $legacy));
        DB::unprepared('REVOKE ALL ON DATABASE "'.str_replace('"', '""', DB::connection()->getDatabaseName()).'" FROM '.$roles);
        // Known target owners can own non-trigger routines, views and partitioned relations too.
        foreach (DB::select("SELECT p.oid::regprocedure::text AS signature FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','legacy_custody')") as $routine) {
            DB::unprepared('ALTER ROUTINE '.$routine->signature.' OWNER TO kirion_g1b_owner');
        }
        foreach ($legacy as $role) {
            DB::unprepared('REVOKE ALL ON ALL TABLES IN SCHEMA public,legacy_custody FROM '.$role.';
                REVOKE ALL ON ALL SEQUENCES IN SCHEMA public,legacy_custody FROM '.$role.';
                REVOKE ALL ON ALL ROUTINES IN SCHEMA public,legacy_custody FROM '.$role.';
                REVOKE ALL ON SCHEMA public,legacy_custody FROM '.$role);
        }
        $this->verifyRetired($legacy);
    }

    public function verifyRetired(array $legacy): void
    {
        foreach ($legacy as $role) {
            // PG16 NOINHERIT is not a SET ROLE boundary. Check every assumable identity explicitly.
            $reachable = DB::select("SELECT rolname,rolsuper FROM pg_roles WHERE oid=(SELECT oid FROM pg_roles WHERE rolname=?) OR pg_has_role(?,oid,'SET')", [$role, $role]);
            foreach ($reachable as $identity) {
                if ($identity->rolsuper || DB::selectOne("SELECT has_database_privilege(?,current_database(),'CONNECT,CREATE,TEMPORARY')
                    OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN ('public','legacy_custody','deployment_control') AND has_schema_privilege(?,oid,'USAGE,CREATE'))
                    OR EXISTS(SELECT 1 FROM pg_shdepend WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND refobjid=(SELECT oid FROM pg_roles WHERE rolname=?) AND deptype='o') AS authority", [$identity->rolname, $identity->rolname, $identity->rolname])->authority) {
                    throw new RuntimeException('Legacy effective or assumable target authority remains.');
                }
                foreach (DB::select("SELECT c.oid,c.relkind FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','legacy_custody','deployment_control') AND c.relkind IN ('r','p','v','m','f','S')") as $object) {
                    $query = $object->relkind === 'S' ? 'SELECT has_sequence_privilege(?,?::oid,\'USAGE,SELECT,UPDATE\') AS authority'
                        : 'SELECT has_table_privilege(?,?::oid,\'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER\') OR has_any_column_privilege(?,?::oid,\'SELECT,INSERT,UPDATE,REFERENCES\') AS authority';
                    $bindings = [$identity->rolname, $object->oid];
                    if ($object->relkind !== 'S') {
                        array_push($bindings, $identity->rolname, $object->oid);
                    }
                    if (DB::selectOne($query, $bindings)->authority) {
                        throw new RuntimeException('Legacy relation, sequence or column authority remains.');
                    }
                }
                if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('public','legacy_custody','deployment_control') AND has_function_privilege(?,p.oid,'EXECUTE')) AS authority", [$identity->rolname])->authority) {
                    throw new RuntimeException('Legacy routine authority remains.');
                }
            }
        }
    }
}
