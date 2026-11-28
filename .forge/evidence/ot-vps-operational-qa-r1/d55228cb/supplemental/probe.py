"""External evidence-only supplemental N79-01 qualification probe for frozen PR82.

Stored outside the authenticated deployment package and candidate tree.
Exercises the unchanged frozen package/launcher across 16 scenario cells per platform:
  modes:      fresh, upgrade (54-migration legacy baseline + preserved admin/MFA/employee)
  phases:     initial, registered
  injections: system_view_security_options, system_view_definition,
              system_rewrite_rule, default_database_tablespace

Uses direct independent SQL observations (never relying solely on installer output)
and emits redacted digest/boolean receipts with zero raw secrets or verifiers.
"""
import argparse
import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile

EXPECTED_SOURCE_SHA = 'd55228cba9fca025a5b8bcf9494df5da879b7995'
EXPECTED_TREE_SHA = '703f093c6be9d9ff16be4dd14c960d6ab6726a0b'
TRUSTED_BOOT = (
    "import hashlib,sys; p=sys.argv[1]; b=open(p,'rb').read(); "
    "assert hashlib.sha256(b).hexdigest()==sys.argv[2]; "
    "sys.argv=[p]+sys.argv[3:]; exec(compile(b,p,'exec'),{'__name__':'__main__','__file__':p})"
)

OBSERVATION_QUERIES = {
    'tables_reloptions': (
        "SELECT coalesce(c.reloptions::text,'<null>') "
        "FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace "
        "WHERE n.nspname='information_schema' AND c.relname='tables'"
    ),
    'applicable_roles_viewdef': (
        "SET search_path = pg_catalog; "
        "SELECT pg_get_viewdef('information_schema.applicable_roles'::regclass, true)"
    ),
    'system_rules': (
        "SET search_path = pg_catalog; "
        "SELECT coalesce(jsonb_agg(jsonb_build_object("
        "'name', n.nspname||'.'||c.relname||'.'||r.rulename, "
        "'ev_type', r.ev_type, 'ev_enabled', r.ev_enabled, 'is_instead', r.is_instead, "
        "'definition', pg_get_ruledef(r.oid, true)) "
        "ORDER BY n.nspname, c.relname, r.rulename), '[]'::jsonb)::text "
        "FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class "
        "JOIN pg_namespace n ON n.oid=c.relnamespace "
        "WHERE n.nspname IN ('pg_catalog','information_schema')"
    ),
    'qa_sys_rule_present': (
        "SELECT count(*) FROM pg_rewrite r JOIN pg_class c ON c.oid=r.ev_class "
        "JOIN pg_namespace n ON n.oid=c.relnamespace "
        "WHERE n.nspname='information_schema' AND c.relname='tables' AND r.rulename='qa_sys_rule'"
    ),
    'target_database_tablespace': (
        "SELECT t.spcname FROM pg_database d JOIN pg_tablespace t ON t.oid=d.dattablespace "
        "WHERE d.datname=current_database()"
    ),
    'raw_reltablespace_nonzero_count': "SELECT count(*) FROM pg_class WHERE reltablespace<>0",
    'filtered_custom_reltablespace_count': (
        "SELECT count(*) FROM pg_class c JOIN pg_tablespace t ON t.oid=c.reltablespace "
        "WHERE t.spcname NOT IN ('pg_default','pg_global')"
    ),
    'unrelated_unused_tablespace_present': "SELECT count(*) FROM pg_tablespace WHERE spcname='qa_unused_ts'",
    'migrations_table_present': "SELECT to_regclass('public.migrations') IS NOT NULL",
    'migrations_ordered': (
        "SELECT coalesce(jsonb_agg(jsonb_build_object('id',id,'migration',migration,'batch',batch) "
        "ORDER BY id), '[]'::jsonb)::text FROM public.migrations"
    ),
    'roles_state': (
        "SELECT coalesce(jsonb_agg(jsonb_build_object("
        "'rolname',rolname,'rolsuper',rolsuper,'rolinherit',rolinherit,'rolcreaterole',rolcreaterole,"
        "'rolcreatedb',rolcreatedb,'rolcanlogin',rolcanlogin,'rolreplication',rolreplication,"
        "'rolbypassrls',rolbypassrls,'rolconnlimit',rolconnlimit,"
        "'has_password',rolpassword IS NOT NULL,'is_scram',coalesce(rolpassword LIKE 'SCRAM-SHA-256$%',false)"
        ") ORDER BY rolname), '[]'::jsonb)::text "
        "FROM pg_authid WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%' "
        "OR rolname IN ('legacy_owner','legacy_runtime')"
    ),
    'memberships_state': (
        "SELECT coalesce(jsonb_agg(jsonb_build_object("
        "'role',r.rolname,'member',m.rolname,'grantor',pg_get_userbyid(a.grantor),"
        "'admin_option',a.admin_option,'inherit_option',a.inherit_option,'set_option',a.set_option"
        ") ORDER BY r.rolname, m.rolname, pg_get_userbyid(a.grantor)), '[]'::jsonb)::text "
        "FROM pg_auth_members a JOIN pg_roles r ON r.oid=a.roleid JOIN pg_roles m ON m.oid=a.member "
        "WHERE r.rolname LIKE 'kirion_g1b_%' OR m.rolname LIKE 'kirion_g1b_%' "
        "OR r.rolname LIKE 'n03_%' OR m.rolname LIKE 'n03_%' "
        "OR r.rolname IN ('legacy_owner','legacy_runtime') OR m.rolname IN ('legacy_owner','legacy_runtime')"
    ),
    'effective_authority': (
        "SELECT coalesce(jsonb_agg(jsonb_build_object("
        "'role',r.rolname,"
        "'db_connect',has_database_privilege(r.oid,current_database(),'CONNECT'),"
        "'db_create',has_database_privilege(r.oid,current_database(),'CREATE'),"
        "'db_temp',has_database_privilege(r.oid,current_database(),'TEMPORARY'),"
        "'pub_usage',has_schema_privilege(r.oid,'public','USAGE'),"
        "'pub_create',has_schema_privilege(r.oid,'public','CREATE')"
        ") ORDER BY r.rolname), '[]'::jsonb)::text "
        "FROM pg_roles r WHERE r.rolname LIKE 'kirion_g1b_%' OR r.rolname LIKE 'n03_%' "
        "OR r.rolname IN ('legacy_owner','legacy_runtime')"
    ),
    'registry_schema_present': "SELECT to_regnamespace('deployment_control') IS NOT NULL",
    'registry_table_present': "SELECT to_regclass('deployment_control.installations') IS NOT NULL",
    'registry_rows': (
        "SELECT coalesce(jsonb_agg(to_jsonb(i) ORDER BY singleton), '[]'::jsonb)::text "
        "FROM deployment_control.installations i"
    ),
    'admin_tables_present': (
        "SELECT jsonb_build_object("
        "'users', to_regclass('public.users') IS NOT NULL, "
        "'employees', to_regclass('public.employees') IS NOT NULL, "
        "'departments', to_regclass('public.departments') IS NOT NULL)::text"
    ),
    'unrelated_service': (
        "SELECT row_to_json(d) FROM pg_database d WHERE datname='unrelated_service'; "
        "SELECT row_to_json(r) FROM pg_roles r WHERE rolname IN ('legacy_owner','legacy_runtime') ORDER BY rolname; "
        "SELECT relacl::text,relowner::regrole FROM pg_class WHERE relname='unrelated_marker';"
    ),
}

EXPECTED_DIAGNOSTICS = {
    ('initial', 'system_view_security_options'): 'Unsupported stock system-catalog deviation.',
    ('initial', 'system_view_definition'): 'Unsupported stock system-catalog deviation.',
    ('initial', 'system_rewrite_rule'): 'Unsupported stock system-catalog deviation.',
    ('initial', 'default_database_tablespace'): 'Unsupported ONE TALIBON PG16 object family: user_tablespaces',
    ('registered', 'system_view_security_options'): 'Persistent security contract drift: system_relation_security',
    ('registered', 'system_view_definition'): 'Persistent security contract drift: system_relation_security',
    ('registered', 'system_rewrite_rule'): 'Persistent security contract drift: system_rewrite_security',
    ('registered', 'default_database_tablespace'): 'Unsupported ONE TALIBON PG16 object family: user_tablespaces',
}


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def run_cmd(argv, cwd, env, inp=None, allowed=(0,), timeout=240, private_values=()):
    if Path(str(argv[0])).stem == 'pg_ctl':
        with tempfile.TemporaryFile(mode='w+t', encoding='utf8') as log:
            res = subprocess.run([str(v) for v in argv], cwd=cwd, env=env, text=True,
                                 stdout=log, stderr=subprocess.STDOUT, timeout=90)
            log.seek(0)
            res.stdout, res.stderr = log.read(), ''
    else:
        res = subprocess.run([str(v) for v in argv], cwd=cwd, env=env, text=True,
                             input=inp, capture_output=True, timeout=timeout)
    if res.returncode not in allowed:
        msg = (res.stdout + res.stderr)[-3000:]
        for s in private_values:
            msg = msg.replace(s, '<redacted>')
        raise RuntimeError(f"Command failed (rc={res.returncode}): {msg}")
    return res


def sanitize(text: str, private_values) -> str:
    for s in private_values:
        text = text.replace(s, '<redacted>')
    return text


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--source', type=Path, required=True)
    ap.add_argument('--pg-bin', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--platform', choices=['windows', 'linux'], required=True)
    args = ap.parse_args()

    source = args.source.resolve()
    args.output.mkdir(parents=True, exist_ok=True)
    php = shutil.which('php')
    assert php, 'php executable not found'

    source_sha_before = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
    tree_sha_before = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=source, text=True).strip()
    assert source_sha_before == EXPECTED_SOURCE_SHA, f'Unexpected source SHA: {source_sha_before}'
    assert tree_sha_before == EXPECTED_TREE_SHA, f'Unexpected tree SHA: {tree_sha_before}'

    private_values = []
    build_parent = Path(tempfile.mkdtemp(prefix='ot-r4-supp-pkg-'))
    if os.name == 'nt':
        actor = run_cmd(['whoami'], source, os.environ).stdout.strip()
        run_cmd(['icacls', build_parent, '/inheritance:r', '/grant:r', actor + ':(OI)(CI)F'], source, os.environ)
    else:
        build_parent.chmod(0o700)
    build = build_parent / 'build'
    build_receipt = json.loads(
        run_cmd([sys.executable, source / 'scripts/deployment/build-package.py', '--output', build],
                source, os.environ, timeout=1200).stdout
    )
    assert build_receipt['source_sha'] == EXPECTED_SOURCE_SHA
    assert build_receipt['tree_sha'] == EXPECTED_TREE_SHA
    package = build / 'package'
    launcher = build / 'verified-install.py'
    manifest_digest = build_receipt['package_manifest_sha256']

    builtin = {x.lower() for x in json.loads(run_cmd([php, '-n', '-r', 'echo json_encode(get_loaded_extensions());'], package, os.environ).stdout)}
    extension_dir = Path(run_cmd([php, '-r', "echo ini_get('extension_dir');"], package, os.environ).stdout.strip())
    if not extension_dir.is_absolute():
        extension_dir = Path(php).parent / extension_dir
    provisioning_ini = build / 'provision.ini'
    ini_lines = ['display_errors=stderr', 'log_errors=On', 'error_log="php://stderr"', 'memory_limit=512M']
    for name in ['PDO', 'bcmath', 'ctype', 'curl', 'dom', 'fileinfo', 'intl', 'mbstring', 'openssl',
                 'pdo_pgsql', 'pgsql', 'session', 'tokenizer', 'xml', 'xmlreader', 'xmlwriter', 'zip']:
        if name.lower() not in builtin:
            library = extension_dir / (('php_' + name.lower() + '.dll') if os.name == 'nt' else name.lower() + '.so')
            if not library.is_file():
                raise RuntimeError('Missing stock PHP extension: ' + name)
            ini_lines.append('extension="' + library.as_posix() + '"')
    provisioning_ini.write_text('\n'.join(ini_lines) + '\n', encoding='utf-8')
    provisioning_ini.chmod(0o600)
    php_digest = hashlib.sha256(Path(php).read_bytes()).hexdigest()
    ini_digest = hashlib.sha256(provisioning_ini.read_bytes()).hexdigest()

    receipt = {
        'probe_sha256': hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        'platform': args.platform,
        'source_sha': source_sha_before,
        'tree_sha': tree_sha_before,
        'package_manifest_sha256': manifest_digest,
        'launcher_sha256': build_receipt['launcher_sha256'],
        'server_version_num': None,
        'queries': OBSERVATION_QUERIES,
        'cells': [],
        'all_passed': False,
    }

    for mode in ['fresh', 'upgrade']:
        env = {k: v for k, v in os.environ.items()
               if not k.startswith(('PG', 'DB_', 'APP_', 'N03_', 'LEGACY_CUSTODY_', 'KIRION_'))}
        root = Path(tempfile.mkdtemp(prefix='ot-r4-supp-' + mode + '-'))
        if os.name == 'nt':
            actor = run_cmd(['whoami'], package, env).stdout.strip()
            run_cmd(['icacls', root, '/inheritance:r', '/grant:r', actor + ':(OI)(CI)F'], package, env)
        else:
            root.chmod(0o700)
        bootstrap = secrets.token_hex(32)
        key = 'base64:' + base64.b64encode(secrets.token_bytes(32)).decode()
        private_values.extend([bootstrap, key])
        pwfile = root / 'password'
        pwfile.write_text(bootstrap)
        pwfile.chmod(0o600)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0))
            port = sock.getsockname()[1]
        data = root / 'data'
        started = False
        try:
            run_cmd([args.pg_bin / 'initdb', '-D', data, '-U', 'postgres', '--auth=scram-sha-256',
                     '--pwfile=' + str(pwfile), '--encoding=UTF8', '--no-locale'], package, env, private_values=private_values)
            pwfile.unlink()
            openssl = shutil.which('openssl') or ('C:/Program Files/Git/usr/bin/openssl.exe' if os.name == 'nt' else 'openssl')
            run_cmd([openssl, 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
                     '-subj', '/CN=127.0.0.1', '-addext', 'subjectAltName=IP:127.0.0.1',
                     '-keyout', root / 'server.key', '-out', root / 'server.crt'], package, env)
            (root / 'server.key').chmod(0o600)
            with (data / 'postgresql.conf').open('a') as cfg:
                cfg.write(
                    "\nssl=on\n"
                    f"ssl_cert_file='{(root / 'server.crt').as_posix()}'\n"
                    f"ssl_key_file='{(root / 'server.key').as_posix()}'\n"
                    "log_min_error_statement='panic'\n"
                    "log_parameter_max_length=0\n"
                    "log_parameter_max_length_on_error=0\n"
                )
            options = f'-h 127.0.0.1 -p {port}'
            if os.name != 'nt':
                options += f' -k {root}'
            run_cmd([args.pg_bin / 'pg_ctl', '-D', data, '-l', root / 'postgres.log', '-o', options, '-w', 'start'],
                    package, env, private_values=private_values)
            started = True

            db = 'ot_supp_' + mode
            env.update(
                PGHOST='127.0.0.1', PGPORT=str(port), PGUSER='postgres', PGPASSWORD=bootstrap, PGDATABASE='postgres',
                APP_ENV='staging', APP_DEBUG='false', APP_KEY=key, APP_URL='https://rehearsal.invalid',
                DB_CONNECTION='pgsql', DB_HOST='127.0.0.1', DB_PORT=str(port), DB_DATABASE=db,
                DB_USERNAME='postgres', DB_PASSWORD=bootstrap, CACHE_STORE='array', SESSION_DRIVER='array',
                LOG_CHANNEL='stderr', PGSSLMODE='verify-full', PGSSLROOTCERT=(root / 'server.crt').as_posix(),
                DB_SSLMODE='verify-full', DB_SSLROOTCERT=(root / 'server.crt').as_posix(),
                PGREQUIREAUTH='scram-sha-256', PGGSSENCMODE='disable',
            )
            admin_env = dict(env, PGDATABASE='postgres')

            def sql(q, e=None):
                return run_cmd([args.pg_bin / 'psql', '-X', '-q', '-v', 'ON_ERROR_STOP=1', '-At'],
                               package, e or env, inp=q, private_values=private_values).stdout.strip()

            sql('CREATE DATABASE ' + db, admin_env)
            env['PGDATABASE'] = db
            receipt['server_version_num'] = sql("SELECT current_setting('server_version_num')")
            ts_unused, ts_target = root / 'ts_unused', root / 'ts_target'
            ts_unused.mkdir()
            ts_target.mkdir()
            sql(f"CREATE TABLESPACE qa_unused_ts LOCATION '{ts_unused.as_posix()}'", admin_env)
            sql(f"CREATE TABLESPACE qa_target_ts LOCATION '{ts_target.as_posix()}'", admin_env)

            all_paths = sorted((source / 'database/migrations').glob('*.php'))
            other_env = None
            if mode == 'upgrade':
                baseline = [p for p in all_paths
                            if p.stem <= '2026_11_20_000200_enforce_iam_identity_integrity' and 'legacy_custody' not in p.name]
                run_cmd([php, 'artisan', 'migrate', '--force', '--no-interaction'] +
                        ['--path=database/migrations/' + p.name for p in baseline], package, env, private_values=private_values)
                seed = (
                    "<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; "
                    "$a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); "
                    "$d=Illuminate\\Support\\Facades\\DB::table('departments')->insertGetId(['code'=>'SYNTH_QA','name'=>'Synthetic QA Office','is_active'=>true,'created_at'=>now(),'updated_at'=>now()]); "
                    "$user=new App\\Models\\User; $user->forceFill(['name'=>'Synthetic Preserved Administrator','username'=>'synthetic_preserved_admin','email'=>'admin@rehearsal.invalid',"
                    "'password'=>Illuminate\\Support\\Facades\\Hash::make('synthetic-local-only-credential'),'role'=>'system_admin','is_active'=>true,'account_status'=>'active',"
                    "'mfa_secret'=>'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP','mfa_confirmed_at'=>now(),'mfa_recovery_codes'=>[Illuminate\\Support\\Facades\\Hash::make('synthetic-recovery')],"
                    "'created_at'=>now(),'updated_at'=>now()])->save(); "
                    "Illuminate\\Support\\Facades\\DB::table('employees')->insert(['employee_number'=>'SYNTH_ADMIN','user_id'=>$user->id,'department_id'=>$d,'position_title'=>'Synthetic evaluator','employment_status'=>'active','created_at'=>now(),'updated_at'=>now()]); "
                    "echo 'SYNTH_SEEDED';"
                )
                assert run_cmd([php], package, env, inp=seed, private_values=private_values).stdout.strip() == 'SYNTH_SEEDED'
                sql("CREATE ROLE legacy_owner NOLOGIN; CREATE ROLE legacy_runtime LOGIN NOINHERIT; "
                    f"CREATE DATABASE unrelated_service OWNER legacy_owner; ALTER DATABASE {db} OWNER TO legacy_owner; "
                    "ALTER SCHEMA public OWNER TO legacy_owner;")
                sql("DO $o$ DECLARE x record; BEGIN FOR x IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP "
                    "EXECUTE format('ALTER TABLE public.%I OWNER TO legacy_owner',x.tablename); END LOOP; END $o$; "
                    "GRANT USAGE,CREATE ON SCHEMA public TO legacy_runtime; "
                    "GRANT ALL ON ALL TABLES IN SCHEMA public TO legacy_runtime; "
                    "GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO legacy_runtime;")
                other_env = dict(env, PGDATABASE='unrelated_service')
                sql('CREATE TABLE unrelated_marker(id int PRIMARY KEY); ALTER TABLE unrelated_marker OWNER TO legacy_owner; '
                    'GRANT SELECT ON unrelated_marker TO legacy_runtime;', other_env)

            ledger = sql('SELECT migration FROM migrations ORDER BY migration').splitlines() if mode == 'upgrade' else []
            target = dict(
                database=db, host='127.0.0.1', port=str(port),
                system_identifier=sql('SELECT system_identifier FROM pg_control_system()'),
                bootstrap_role='postgres', source_sha=EXPECTED_SOURCE_SHA,
                app_key_sha256=hashlib.sha256(key.encode()).hexdigest(),
                expected_migrations=ledger,
                retired_runtime_roles=['legacy_runtime'] if mode == 'upgrade' else [],
                legacy_owner_roles=['legacy_owner'] if mode == 'upgrade' else [],
                package_sha256=manifest_digest, tree_sha=EXPECTED_TREE_SHA,
                previous_installation=None,
            )
            roles = ['kirion_g1b_migrator', 'kirion_g1b_app', 'kirion_g1b_custody',
                     'n03_stage', 'n03_command', 'n03_reconcile', 'n03_reader']
            credentials = {r: secrets.token_hex(32) for r in roles}
            private_values.extend(credentials.values())
            manifest_file, credentials_file = root / 'target.json', root / 'credentials.json'
            credentials_file.write_text(json.dumps(credentials))
            credentials_file.chmod(0o600)

            def invoke_installer(manifest, expected_rc):
                manifest_file.write_text(json.dumps(manifest))
                manifest_file.chmod(0o600)
                argv = [
                    sys.executable, '-I', '-S', '-c', TRUSTED_BOOT, str(launcher), build_receipt['launcher_sha256'],
                    '--package', str(package), '--manifest', str(build / 'package-manifest.json'), '--sha256', manifest_digest,
                    '--target', str(manifest_file), '--credentials', str(credentials_file),
                    '--php', php, '--ini', str(provisioning_ini), '--php-sha256', php_digest, '--ini-sha256', ini_digest,
                ]
                return run_cmd(argv, package, env, allowed=(expected_rc,), private_values=private_values)

            def observe(check_admin_auth: bool):
                # Direct independent SQL state capture (no raw secrets/verifiers emitted).
                tables_opt = sql(OBSERVATION_QUERIES['tables_reloptions'])
                viewdef = sql(OBSERVATION_QUERIES['applicable_roles_viewdef'])
                sys_rules_json = sql(OBSERVATION_QUERIES['system_rules'])
                sys_rules = json.loads(sys_rules_json)
                qa_rule_count = int(sql(OBSERVATION_QUERIES['qa_sys_rule_present']))
                target_ts = sql(OBSERVATION_QUERIES['target_database_tablespace'])
                raw_ts_nonzero = int(sql(OBSERVATION_QUERIES['raw_reltablespace_nonzero_count']))
                filtered_ts_custom = int(sql(OBSERVATION_QUERIES['filtered_custom_reltablespace_count']))
                unused_ts_present = int(sql(OBSERVATION_QUERIES['unrelated_unused_tablespace_present'])) == 1

                mig_present = sql(OBSERVATION_QUERIES['migrations_table_present']) == 't'
                if mig_present:
                    mig_json = sql(OBSERVATION_QUERIES['migrations_ordered'])
                    mig_rows = json.loads(mig_json)
                    mig_count = len(mig_rows)
                    mig_digest = sha256_text(mig_json)
                else:
                    mig_count = 0
                    mig_digest = sha256_text('ABSENT')

                roles_json = sql(OBSERVATION_QUERIES['roles_state'])
                memberships_json = sql(OBSERVATION_QUERIES['memberships_state'])
                eff_auth_json = sql(OBSERVATION_QUERIES['effective_authority'])

                reg_schema = sql(OBSERVATION_QUERIES['registry_schema_present']) == 't'
                reg_table = sql(OBSERVATION_QUERIES['registry_table_present']) == 't'
                if reg_table:
                    reg_json = sql(OBSERVATION_QUERIES['registry_rows'])
                    reg_count = len(json.loads(reg_json))
                    reg_digest = sha256_text(reg_json)
                else:
                    reg_count = 0
                    reg_digest = sha256_text('ABSENT')

                admin_tables = json.loads(sql(OBSERVATION_QUERIES['admin_tables_present']))
                admin_state = {'tables_present': admin_tables}
                for tbl in ['users', 'employees', 'departments']:
                    if admin_tables[tbl]:
                        cnt = int(sql(f'SELECT count(*) FROM public.{tbl}'))
                        dg = sha256_text(sql(f"SELECT coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'') FROM public.{tbl} t"))
                        admin_state[tbl + '_count'] = cnt
                        admin_state[tbl + '_digest'] = dg
                    else:
                        admin_state[tbl + '_count'] = None
                        admin_state[tbl + '_digest'] = sha256_text('ABSENT')
                if check_admin_auth:
                    auth_code = (
                        "<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; "
                        "$a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); "
                        "$u=App\\Models\\User::where('username','synthetic_preserved_admin')->firstOrFail(); "
                        "$g=new PragmaRX\\Google2FA\\Google2FA; "
                        "echo (Illuminate\\Support\\Facades\\Hash::check('synthetic-local-only-credential',$u->password) "
                        "&& $u->mfa_secret==='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP' "
                        "&& $g->verifyKey($u->mfa_secret,$g->getCurrentOtp($u->mfa_secret))) ? 'VERIFIED' : 'FAILED';"
                    )
                    admin_state['password_and_mfa_totp_verified'] = (
                        run_cmd([php], package, env, inp=auth_code, private_values=private_values).stdout.strip() == 'VERIFIED'
                    )
                else:
                    admin_state['password_and_mfa_totp_verified'] = None

                unrelated_digest = sha256_text(sql(OBSERVATION_QUERIES['unrelated_service'], other_env)) if other_env else None

                return {
                    'injected_drift_state': {
                        'tables_reloptions': tables_opt,
                        'applicable_roles_viewdef_sha256': sha256_text(viewdef),
                        'system_rules_count': len(sys_rules),
                        'qa_sys_rule_present': qa_rule_count == 1,
                        'system_rules_digest': sha256_text(sys_rules_json),
                        'target_database_tablespace': target_ts,
                        'raw_reltablespace_nonzero_count': raw_ts_nonzero,
                        'filtered_custom_reltablespace_count': filtered_ts_custom,
                        'unrelated_unused_tablespace_present': unused_ts_present,
                    },
                    'migration_ledger': {
                        'table_present': mig_present,
                        'row_count': mig_count,
                        'ordered_digest': mig_digest,
                    },
                    'roles_and_memberships': {
                        'roles_count': len(json.loads(roles_json)),
                        'roles_digest': sha256_text(roles_json),
                        'memberships_digest': sha256_text(memberships_json),
                        'effective_authority_digest': sha256_text(eff_auth_json),
                    },
                    'registry_state': {
                        'schema_present': reg_schema,
                        'table_present': reg_table,
                        'row_count': reg_count,
                        'rows_digest': reg_digest,
                    },
                    'preserved_admin_state': admin_state,
                    'unrelated_service_digest': unrelated_digest,
                }

            orig_view_def = sql("SELECT pg_get_viewdef('information_schema.applicable_roles', true)")
            injections = [
                (
                    'system_view_security_options',
                    'ALTER VIEW information_schema.tables SET (security_invoker=true, security_barrier=true)',
                    'ALTER VIEW information_schema.tables RESET (security_invoker, security_barrier)',
                    env,
                ),
                (
                    'system_view_definition',
                    "CREATE OR REPLACE VIEW information_schema.applicable_roles AS "
                    "SELECT NULL::information_schema.sql_identifier AS grantee, "
                    "NULL::information_schema.sql_identifier AS role_name, "
                    "NULL::information_schema.yes_or_no AS is_grantable WHERE false",
                    'CREATE OR REPLACE VIEW information_schema.applicable_roles AS ' + orig_view_def,
                    env,
                ),
                (
                    'system_rewrite_rule',
                    'CREATE RULE qa_sys_rule AS ON INSERT TO information_schema.tables DO INSTEAD NOTHING',
                    'DROP RULE qa_sys_rule ON information_schema.tables',
                    env,
                ),
                (
                    'default_database_tablespace',
                    f'ALTER DATABASE {db} SET TABLESPACE qa_target_ts',
                    f'ALTER DATABASE {db} SET TABLESPACE pg_default',
                    admin_env,
                ),
            ]

            for phase in ['initial', 'registered']:
                if phase == 'registered':
                    installed_out = invoke_installer(target, 0).stdout
                    assert '"status":"INSTALLED"' in installed_out, f'Baseline {mode} install failed'
                    target['expected_migrations'] = sql('SELECT migration FROM migrations ORDER BY migration').splitlines()
                    target['previous_installation'] = json.loads(sql('SELECT row_to_json(i) FROM deployment_control.installations i'))

                check_auth = (mode == 'upgrade')
                for case_name, chg_sql, undo_sql, q_env in injections:
                    clean_before = observe(check_auth)
                    sql(chg_sql, q_env)
                    injected_pre = observe(check_auth)
                    res = invoke_installer(target, 1)
                    post_refusal = observe(check_auth)
                    sql(undo_sql, q_env)
                    restored = observe(check_auth)

                    combined_out = sanitize(res.stdout + '\n' + res.stderr, private_values)
                    expected_diag = EXPECTED_DIAGNOSTICS[(phase, case_name)]
                    diag_matched = expected_diag in combined_out
                    phase_preflight = 'Phase: preflight;' in combined_out
                    matched_lines = [ln.strip() for ln in combined_out.splitlines()
                                     if expected_diag in ln or 'Phase:' in ln]

                    injection_applied = injected_pre['injected_drift_state'] != clean_before['injected_drift_state']
                    unchanged = {
                        'injected_drift_state': post_refusal['injected_drift_state'] == injected_pre['injected_drift_state'],
                        'migration_ledger': post_refusal['migration_ledger'] == injected_pre['migration_ledger'],
                        'roles_and_memberships': post_refusal['roles_and_memberships'] == injected_pre['roles_and_memberships'],
                        'registry_state': post_refusal['registry_state'] == injected_pre['registry_state'],
                        'preserved_admin_state': post_refusal['preserved_admin_state'] == injected_pre['preserved_admin_state'],
                        'unrelated_service': post_refusal['unrelated_service_digest'] == injected_pre['unrelated_service_digest'],
                    }
                    restored_clean = restored == clean_before

                    # Extra explicit assertions for tablespace reconciliation and registry phase expectations
                    if case_name == 'default_database_tablespace':
                        assert injected_pre['injected_drift_state']['target_database_tablespace'] == 'qa_target_ts'
                        assert injected_pre['injected_drift_state']['filtered_custom_reltablespace_count'] == 0
                        assert injected_pre['injected_drift_state']['unrelated_unused_tablespace_present'] is True
                    if phase == 'initial':
                        assert post_refusal['registry_state']['schema_present'] is False
                        assert post_refusal['registry_state']['table_present'] is False
                    else:
                        assert post_refusal['registry_state']['table_present'] is True
                        assert post_refusal['registry_state']['row_count'] == 1

                    cell_passed = (
                        res.returncode == 1
                        and diag_matched
                        and phase_preflight
                        and injection_applied
                        and all(unchanged.values())
                        and restored_clean
                    )
                    cell = {
                        'cell_id': f'{mode}_{phase}_{case_name}',
                        'mode': mode,
                        'phase': phase,
                        'injection': case_name,
                        'exit_code': res.returncode,
                        'expected_diagnostic': expected_diag,
                        'diagnostic_matched': diag_matched,
                        'refused_in_preflight': phase_preflight,
                        'sanitized_diagnostic_lines': matched_lines,
                        'injection_applied': injection_applied,
                        'pre_post_refusal_unchanged': unchanged,
                        'restored_equals_clean_baseline': restored_clean,
                        'pass': cell_passed,
                        'observations': {
                            'clean_baseline': clean_before,
                            'injected_pre_refusal': injected_pre,
                            'post_refusal': post_refusal,
                            'restored_baseline': restored,
                        },
                    }
                    receipt['cells'].append(cell)
                    print(f"[{args.platform}] {cell['cell_id']}: pass={cell_passed} | diag={diag_matched} | preflight={phase_preflight}", flush=True)
                    if not cell_passed:
                        raise RuntimeError(f"Supplemental cell failed: {cell['cell_id']}")
        finally:
            if started:
                run_cmd([args.pg_bin / 'pg_ctl', '-D', data, '-m', 'fast', '-w', 'stop'],
                        package, env, private_values=private_values)
            for p in [root / 'target.json', root / 'credentials.json']:
                p.unlink(missing_ok=True)

    source_sha_after = subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip()
    tree_sha_after = subprocess.check_output(['git', 'rev-parse', 'HEAD^{tree}'], cwd=source, text=True).strip()
    assert source_sha_after == EXPECTED_SOURCE_SHA and tree_sha_after == EXPECTED_TREE_SHA
    assert len(receipt['cells']) == 16 and all(c['pass'] for c in receipt['cells'])
    receipt['all_passed'] = True
    out_file = args.output / f'supplemental-{args.platform}.json'
    out_file.write_text(json.dumps(receipt, indent=2) + '\n', encoding='utf-8', newline='\n')
    print(f"SUPPLEMENTAL_PASS ({args.platform}): {len(receipt['cells'])}/16 cells | {out_file}", flush=True)


if __name__ == '__main__':
    main()
