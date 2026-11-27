<?php

declare(strict_types=1);

namespace App\Deployment;

use Illuminate\Support\Facades\DB;
use RuntimeException;

final class SecurityCatalog
{
    public static function contract(): array
    {
        $index = json_decode(file_get_contents(database_path('deployment/security-contract.json')), true, 128, JSON_THROW_ON_ERROR);
        if (($index['format'] ?? null) !== 3) {
            throw new RuntimeException('Unsupported canonical policy format.');
        }
        $contract = [];
        foreach ($index['sections'] as $section) {
            $rows = [];
            foreach ($section['parts'] as $part) {
                if (! preg_match('/^security-contract\/[a-z_]+-[0-9]+\.json$/D', $part['file'])) {
                    throw new RuntimeException('Canonical policy path drift.');
                }
                $bytes = file_get_contents(database_path('deployment/'.$part['file']));
                if (! hash_equals($part['sha256'], hash('sha256', $bytes))) {
                    throw new RuntimeException('Canonical policy section digest mismatch.');
                }
                array_push($rows, ...json_decode($bytes, true, 128, JSON_THROW_ON_ERROR));
            }
            if (count($rows) !== $section['rows']) {
                throw new RuntimeException('Canonical policy section inventory mismatch.');
            }
            $contract[$section['name']] = $rows;
        }

        $version = (string) DB::selectOne("SELECT current_setting('server_version_num') AS version")->version;
        if (! array_key_exists($version, $index['runtime_profiles'] ?? [])) {
            throw new RuntimeException('Unqualified PostgreSQL catalog version.');
        }
        foreach ($index['runtime_profiles'][$version] as $part) {
            if (! preg_match('/^security-contract\/[a-z_]+-[0-9]+\.json$/D', $part['file'])) {
                throw new RuntimeException('Canonical runtime profile path drift.');
            }
            $bytes = file_get_contents(database_path('deployment/'.$part['file']));
            if (! hash_equals($part['sha256'], hash('sha256', $bytes))) {
                throw new RuntimeException('Canonical runtime profile digest mismatch.');
            }
            array_push($contract['system_routine_security'], ...json_decode($bytes, true, 128, JSON_THROW_ON_ERROR));
        }
        usort($contract['system_routine_security'], static fn ($a, $b) => strcmp(json_encode($a), json_encode($b)));

        return $contract;
    }

    public const ROLES = ['kirion_g1b_app', 'kirion_g1b_custody', 'kirion_g1b_migrator', 'kirion_g1b_owner', 'kirion_g1b_repair', 'n03_command', 'n03_reader', 'n03_reconcile', 'n03_stage'];

    private const SCHEMAS = "n.nspname !~ '^pg_' AND n.nspname NOT IN ('information_schema')";

    public function snapshot(string $bootstrap): array
    {
        // ACL entries include grantor, grantee, privilege AND grant option, including PUBLIC/defaults.
        $acl = static fn (string $expression): string => "(SELECT coalesce(jsonb_agg(jsonb_build_array(pg_get_userbyid(a.grantor),CASE WHEN a.grantee=0 THEN 'PUBLIC' ELSE pg_get_userbyid(a.grantee) END,a.privilege_type,a.is_grantable) ORDER BY a.grantor::regrole::text,a.grantee::regrole::text,a.privilege_type), '[]'::jsonb) FROM aclexplode(NULLIF($expression,'{}'::aclitem[])) a)";
        $queries = [
            'system_schema_security' => 'SELECT n.nspname AS name,pg_get_userbyid(n.nspowner) AS owner,'.$acl("coalesce(n.nspacl,acldefault('n',n.nspowner))")." AS acl FROM pg_namespace n WHERE n.nspname IN ('pg_catalog','information_schema')",
            'system_column_acl' => 'SELECT n.nspname||\'.\'||c.relname||\'.\'||a.attname AS name,'.$acl('a.attacl')." AS acl FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('pg_catalog','information_schema') AND a.attnum>0 AND NOT a.attisdropped AND a.attacl IS NOT NULL",
            'system_type_security' => 'SELECT n.nspname||\'.\'||t.typname AS name,pg_get_userbyid(t.typowner) AS owner,'.$acl("coalesce(t.typacl,acldefault('T',t.typowner))")." AS acl FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname IN ('pg_catalog','information_schema')",
            'system_routine_security' => 'SELECT p.oid::regprocedure::text AS name,pg_get_userbyid(p.proowner) AS owner,p.prosrc,p.probin,p.prosecdef,p.proleakproof,p.proconfig,'.$acl("coalesce(p.proacl,acldefault('f',p.proowner))")." AS acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname IN ('pg_catalog','information_schema')",
            'system_relation_security' => 'SELECT n.nspname||\'.\'||c.relname AS name,pg_get_userbyid(c.relowner) AS owner,c.relrowsecurity,c.relforcerowsecurity,'.$acl("coalesce(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::\"char\" ELSE 'r'::\"char\" END,c.relowner))")." AS acl FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('pg_catalog','information_schema')",
            'database' => 'SELECT pg_get_userbyid(d.datdba) AS owner, '.$acl("coalesce(d.datacl,acldefault('d',d.datdba))").' AS acl FROM pg_database d WHERE datname=current_database()',
            'schemas' => 'SELECT n.nspname AS name,pg_get_userbyid(n.nspowner) AS owner,'.$acl("coalesce(n.nspacl,acldefault('n',n.nspowner))").' AS acl FROM pg_namespace n WHERE '.self::SCHEMAS.' ORDER BY name',
            'relations' => 'SELECT n.nspname||\'.\'||c.relname AS name,c.relkind,c.relpersistence,pg_get_userbyid(c.relowner) AS owner,c.relrowsecurity,c.relforcerowsecurity,c.reloptions,'.$acl("coalesce(c.relacl,acldefault(CASE WHEN c.relkind='S' THEN 'S'::\"char\" ELSE 'r'::\"char\" END,c.relowner))")." AS acl,
                CASE WHEN c.relkind IN ('v','m') THEN pg_get_viewdef(c.oid,true) WHEN c.relkind IN ('i','I') THEN pg_get_indexdef(c.oid) END AS definition
                FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS.' ORDER BY name',
            'columns' => 'SELECT n.nspname||\'.\'||c.relname||\'.\'||a.attname AS name,format_type(a.atttypid,a.atttypmod) AS type,a.attnotnull,a.attidentity,a.attgenerated,pg_get_expr(d.adbin,d.adrelid) AS default_expression,'.$acl("coalesce(a.attacl,'{}'::aclitem[])").' AS acl FROM pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace LEFT JOIN pg_attrdef d ON d.adrelid=c.oid AND d.adnum=a.attnum WHERE '.self::SCHEMAS.' AND a.attnum>0 AND NOT a.attisdropped ORDER BY name',
            'routines' => 'SELECT p.oid::regprocedure::text AS name,pg_get_userbyid(p.proowner) AS owner,p.prosecdef,p.proleakproof,p.proconfig,p.provolatile,p.proparallel,pg_get_functiondef(p.oid) AS definition,'.$acl("coalesce(p.proacl,acldefault('f',p.proowner))").' AS acl FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE '.self::SCHEMAS.' ORDER BY name',
            'types' => 'SELECT n.nspname||\'.\'||t.typname AS name,t.typtype,pg_get_userbyid(t.typowner) AS owner,'.$acl("coalesce(t.typacl,acldefault('T',t.typowner))").' AS acl FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE '.self::SCHEMAS.' ORDER BY name',
            'constraints' => "SELECT n.nspname||'.'||c.relname||'.'||k.conname AS name,k.convalidated,pg_get_constraintdef(k.oid,true) AS definition FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS.' ORDER BY name',
            'triggers' => "SELECT n.nspname||'.'||c.relname||'.'||t.tgname AS name,t.tgenabled,pg_get_triggerdef(t.oid,true) AS definition FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS.' AND NOT t.tgisinternal ORDER BY name',
            // RI trigger names contain installation-specific OIDs; bind their semantic identity instead.
            'internal_triggers' => "SELECT n.nspname||'.'||c.relname AS relation,k.conrelid::regclass::text AS constraint_relation,k.conname,t.tgtype,p.oid::regprocedure::text AS function,t.tgenabled,t.tgdeferrable,t.tginitdeferred
                FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_constraint k ON k.oid=t.tgconstraint JOIN pg_proc p ON p.oid=t.tgfoid WHERE ".self::SCHEMAS.' AND t.tgisinternal',
            'defaults' => "SELECT pg_get_userbyid(d.defaclrole) AS owner,coalesce(n.nspname,'*') AS schema,d.defaclobjtype,".$acl('d.defaclacl').' AS acl FROM pg_default_acl d LEFT JOIN pg_namespace n ON n.oid=d.defaclnamespace ORDER BY owner,schema,defaclobjtype',
            'policies' => 'SELECT * FROM pg_policies ORDER BY schemaname,tablename,policyname',
            'dependencies' => "SELECT pg_describe_object(d.classid,d.objid,d.objsubid) AS object,pg_describe_object(d.refclassid,d.refobjid,d.refobjsubid) AS reference,d.deptype
                FROM pg_depend d WHERE
                (d.classid='pg_class'::regclass AND d.objid IN (SELECT c.oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS."))
                OR (d.classid='pg_proc'::regclass AND d.objid IN (SELECT p.oid FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE ".self::SCHEMAS."))
                OR (d.classid='pg_type'::regclass AND d.objid IN (SELECT t.oid FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE ".self::SCHEMAS."))
                OR (d.classid='pg_constraint'::regclass AND d.objid IN (SELECT k.oid FROM pg_constraint k JOIN pg_class c ON c.oid=k.conrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS."))
                OR (d.classid='pg_trigger'::regclass AND d.objid IN (SELECT t.oid FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS." AND NOT t.tgisinternal))
                OR (d.classid='pg_attrdef'::regclass AND d.objid IN (SELECT a.oid FROM pg_attrdef a JOIN pg_class c ON c.oid=a.adrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE ".self::SCHEMAS.'))',
        ];
        $out = [];
        foreach ($queries as $name => $query) {
            $out[$name] = array_map(static function ($row): array {
                $row = (array) $row;
                foreach (['acl'] as $field) {
                    if (isset($row[$field])) {
                        $row[$field] = json_decode($row[$field], true, 64, JSON_THROW_ON_ERROR);
                        // OID allocation differs across fresh/legacy clusters; normalize sort by names.
                        usort($row[$field], static fn ($a, $b) => strcmp(json_encode($a), json_encode($b)));
                    }
                }

                return $row;
            }, DB::select($query));
        }
        $roleSql = implode(',', array_map(static fn ($r) => "'".$r."'", self::ROLES));
        $out['roles'] = DB::select("SELECT rolname,rolsuper,rolinherit,rolcreaterole,rolcreatedb,rolcanlogin,rolreplication,rolbypassrls,rolconnlimit,rolvaliduntil::text,
            CASE WHEN rolcanlogin THEN rolpassword LIKE 'SCRAM-SHA-256$%' ELSE rolpassword IS NULL END AS credential_boundary
            FROM pg_authid WHERE rolname IN ($roleSql) ORDER BY rolname");
        $out['memberships'] = DB::select("SELECT r.rolname AS role,m.rolname AS member,pg_get_userbyid(a.grantor) AS grantor,a.admin_option,a.inherit_option,a.set_option FROM pg_auth_members a JOIN pg_roles r ON r.oid=a.roleid JOIN pg_roles m ON m.oid=a.member WHERE r.rolname IN ($roleSql) OR m.rolname IN ($roleSql) ORDER BY role,member");
        $out['startup_settings'] = DB::select("SELECT CASE WHEN s.setdatabase=0 THEN '*' WHEN d.datname=current_database() THEN '@database' ELSE d.datname END AS database,CASE WHEN s.setrole=0 THEN 'PUBLIC' ELSE r.rolname END AS role,s.setconfig
            FROM pg_db_role_setting s LEFT JOIN pg_database d ON d.oid=s.setdatabase LEFT JOIN pg_roles r ON r.oid=s.setrole
            WHERE r.rolname IN ($roleSql) OR d.datname=current_database()");
        // Exhaustive effective access, including grants inherited through PUBLIC and SET ROLE topology.
        $out['effective_relations'] = DB::select("SELECT r.rolname,n.nspname||'.'||c.relname AS name,
            CASE WHEN c.relkind='S' THEN ARRAY(SELECT has_sequence_privilege(r.oid,c.oid,p) FROM unnest(ARRAY['USAGE','SELECT','UPDATE','USAGE WITH GRANT OPTION','SELECT WITH GRANT OPTION','UPDATE WITH GRANT OPTION']) p)
            ELSE ARRAY(SELECT has_table_privilege(r.oid,c.oid,p) FROM unnest(ARRAY['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','SELECT WITH GRANT OPTION','INSERT WITH GRANT OPTION','UPDATE WITH GRANT OPTION','DELETE WITH GRANT OPTION','TRUNCATE WITH GRANT OPTION','REFERENCES WITH GRANT OPTION','TRIGGER WITH GRANT OPTION']) p) END AS rights
            FROM pg_roles r CROSS JOIN pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE r.rolname IN ($roleSql) AND ".self::SCHEMAS." AND c.relkind IN ('r','p','v','m','S','f') ORDER BY rolname,name");
        $out['effective_columns'] = DB::select("SELECT r.rolname,n.nspname||'.'||c.relname||'.'||a.attname AS name,
            ARRAY(SELECT has_column_privilege(r.oid,c.oid,a.attnum,p) FROM unnest(ARRAY['SELECT','INSERT','UPDATE','REFERENCES','SELECT WITH GRANT OPTION','INSERT WITH GRANT OPTION','UPDATE WITH GRANT OPTION','REFERENCES WITH GRANT OPTION']) p) AS rights
            FROM pg_roles r CROSS JOIN pg_attribute a JOIN pg_class c ON c.oid=a.attrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE r.rolname IN ($roleSql) AND ".self::SCHEMAS." AND c.relkind IN ('r','p','v','m','f') AND a.attnum>0 AND NOT a.attisdropped ORDER BY rolname,name");
        $out['effective_routines'] = DB::select("SELECT r.rolname,p.oid::regprocedure::text AS name,has_function_privilege(r.oid,p.oid,'EXECUTE') AS execute,has_function_privilege(r.oid,p.oid,'EXECUTE WITH GRANT OPTION') AS grantable FROM pg_roles r CROSS JOIN pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE r.rolname IN ($roleSql) AND ".self::SCHEMAS.' ORDER BY rolname,name');
        $out['effective_schemas'] = DB::select("SELECT r.rolname,n.nspname AS name,ARRAY(SELECT has_schema_privilege(r.oid,n.oid,p) FROM unnest(ARRAY['USAGE','CREATE','USAGE WITH GRANT OPTION','CREATE WITH GRANT OPTION']) p) AS rights FROM pg_roles r CROSS JOIN pg_namespace n WHERE r.rolname IN ($roleSql) AND ".self::SCHEMAS.' ORDER BY rolname,name');
        $out['effective_database'] = DB::select("SELECT r.rolname,ARRAY(SELECT has_database_privilege(r.oid,current_database(),p) FROM unnest(ARRAY['CONNECT','CREATE','TEMPORARY','CONNECT WITH GRANT OPTION','CREATE WITH GRANT OPTION','TEMPORARY WITH GRANT OPTION']) p) AS rights FROM pg_roles r WHERE rolname IN ($roleSql) ORDER BY rolname");
        $out['effective_types'] = DB::select("SELECT r.rolname,n.nspname||'.'||t.typname AS name,has_type_privilege(r.oid,t.oid,'USAGE') AS usage,has_type_privilege(r.oid,t.oid,'USAGE WITH GRANT OPTION') AS grantable FROM pg_roles r CROSS JOIN pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace WHERE r.rolname IN ($roleSql) AND ".self::SCHEMAS);
        // Only the verified offline administrator identity varies between installations.
        $out = json_decode(str_replace(json_encode($bootstrap), '"@bootstrap"', json_encode($out, JSON_THROW_ON_ERROR)), true, 128, JSON_THROW_ON_ERROR);
        foreach ($out as &$rows) {
            foreach ($rows as &$row) {
                if (isset($row['acl'])) {
                    usort($row['acl'], static fn ($a, $b) => strcmp(json_encode($a), json_encode($b)));
                }
            }
            unset($row);
            usort($rows, static fn ($a, $b) => strcmp(json_encode($a), json_encode($b)));
        }

        return $out;
    }

    public function verify(string $bootstrap): void
    {
        app(SupportedPg16::class)->verify();
        $expected = self::contract();
        $actual = $this->snapshot($bootstrap);
        foreach ($expected as $section => $value) {
            if (! array_key_exists($section, $actual) || $actual[$section] !== $value) {
                throw new RuntimeException('Persistent security contract drift: '.$section);
            }
        }
        if (array_keys($actual) !== array_keys($expected)) {
            throw new RuntimeException('Persistent security contract inventory drift.');
        }
    }
}
