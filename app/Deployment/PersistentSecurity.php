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

        return ['target' => (array) $identity, 'host' => $target['host'], 'port' => (string) $target['port'], 'retirement' => $sets,
            'restrictive_routine_default_owners' => $this->restrictiveDefaultIdentities($target)];
    }

    private function restrictiveDefaultIdentities(array $target): array
    {
        $names = $target['restrictive_routine_default_owners'] ?? [];
        if (! is_array($names) || ! array_is_list($names) || count(array_unique($names, SORT_REGULAR)) !== count($names)) {
            throw new RuntimeException('Restrictive routine defaults require an explicit unique identity list.');
        }
        $out = [];
        foreach ($names as $name) {
            if (! is_string($name) || ! preg_match('/^[a-z][a-z0-9_]{2,62}$/D', $name)
                || ! in_array($name, array_merge([$target['bootstrap_role']], $target['legacy_owner_roles']), true)
                || in_array($name, array_merge(SecurityCatalog::ROLES, $target['retired_runtime_roles']), true)) {
                throw new RuntimeException('Unclassified restrictive routine default owner.');
            }
            $role = DB::selectOne('SELECT oid::text AS oid,rolname AS name FROM pg_roles WHERE rolname=?', [$name]);
            if (! $role) {
                throw new RuntimeException('Restrictive routine default identity no longer exists.');
            }
            $out[] = (array) $role;
        }
        usort($out, static fn ($a, $b) => strcmp($a['name'], $b['name']));

        return $out;
    }

    /** Source-defined self-only EXECUTE rows; never derive an expected ACL from target ACLs. */
    public function restrictiveDefaults(array $target, bool $postflight = false): array
    {
        $rows = [];
        foreach ($this->restrictiveDefaultIdentities($target) as $role) {
            if ($postflight && $role['name'] === $target['bootstrap_role']) {
                continue; // The unchanged canonical postflight already requires the bootstrap row.
            }
            $owner = $role['name'] === $target['bootstrap_role'] ? '@bootstrap' : $role['name'];
            $rows[] = ['owner' => $owner, 'schema' => '*', 'defaclobjtype' => 'f', 'acl' => [[$owner, $owner, 'EXECUTE', false]]];
        }
        usort($rows, static fn ($a, $b) => strcmp(json_encode($a), json_encode($b)));

        return $rows;
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
            app(SecurityCatalog::class)->verify($target['bootstrap_role'], $this->restrictiveDefaults($target, true));
            $this->verifyRetired($legacy, $target);

            return $legacy;
        }
        if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_namespace WHERE nspname='deployment_control') AS unsafe")->unsafe) {
            throw new RuntimeException('Unregistered control schema.');
        }
        $expected = SecurityCatalog::contract();
        $actual = app(SecurityCatalog::class)->snapshot($target['bootstrap_role']);
        if ($actual['defaults'] !== $this->restrictiveDefaults($target)) {
            throw new RuntimeException('Unregistered restrictive default privilege profile mismatch.');
        }
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

    public function finalize(array $legacy, array $target): void
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
        $this->verifyRetired($legacy, $target);
    }

    public function verifyRetired(array $legacy, array $target): void
    {
        $retainedDefaults = [];
        foreach ($this->restrictiveDefaultIdentities($target) as $identity) {
            if ($identity['name'] === $target['bootstrap_role']) {
                continue;
            }
            $row = DB::selectOne("SELECT oid::text AS oid FROM pg_default_acl WHERE defaclrole=?::oid AND defaclnamespace=0 AND defaclobjtype='f'
                AND defaclacl=ARRAY[makeaclitem(?::oid,?::oid,'EXECUTE',false)]", [$identity['oid'], $identity['oid'], $identity['oid']]);
            if (! $row) {
                throw new RuntimeException('Retained restrictive routine default profile changed.');
            }
            $retainedDefaults[] = $row->oid;
        }
        foreach ($legacy as $role) {
            // PG16 NOINHERIT is not a SET ROLE boundary. Check every assumable identity explicitly.
            $reachable = DB::select("SELECT rolname,rolsuper FROM pg_roles WHERE oid=(SELECT oid FROM pg_roles WHERE rolname=?) OR pg_has_role(?,oid,'SET')", [$role, $role]);
            foreach ($reachable as $identity) {
                if ($identity->rolsuper || DB::selectOne("SELECT has_database_privilege(?,current_database(),'CONNECT,CREATE,TEMPORARY')
                    OR EXISTS(SELECT 1 FROM pg_namespace WHERE nspname IN ('public','legacy_custody','deployment_control') AND has_schema_privilege(?,oid,'USAGE,CREATE'))
                    OR EXISTS(SELECT 1 FROM pg_shdepend WHERE dbid=(SELECT oid FROM pg_database WHERE datname=current_database()) AND refobjid=(SELECT oid FROM pg_roles WHERE rolname=?) AND deptype='o'
                        AND NOT (classid='pg_default_acl'::regclass AND objid=ANY(?::oid[]))) AS authority", [$identity->rolname, $identity->rolname, $identity->rolname, '{'.implode(',', $retainedDefaults).'}'])->authority) {
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
