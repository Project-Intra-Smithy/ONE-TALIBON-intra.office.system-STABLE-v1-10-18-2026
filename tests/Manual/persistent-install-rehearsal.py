"""Fresh/54-migration upgrade qualification on newly created local-only PG16 clusters.

Accepts no external database target. Keeps stopped synthetic clusters, never dumps data.
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
import tempfile
import sys

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('--pg-bin', type=Path, required=True)
ap.add_argument('--output', type=Path, required=True)
ap.add_argument('--compare-contract', action='store_true')
ap.add_argument('--record-contract', action='store_true', help='Developer fixture on an exclusive disposable database only; never a persistent-install option')
args = ap.parse_args()
source = Path(__file__).resolve().parents[2]
args.output.mkdir(parents=True, exist_ok=True)
php = shutil.which('php')
report = {'source_sha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip(), 'checks': []}
private_values = []
app_cwd = source
client_chunks = []


def check(name, condition):
    report['checks'].append({'case': name, 'pass': bool(condition)})
    if not condition:
        raise RuntimeError('Failed: ' + name)


def run(argv, env, input=None, allowed=(0,), private_result=False, timeout=240):
    with tempfile.TemporaryFile(mode='w+t', encoding='utf8') as log:
        if Path(str(argv[0])).stem == 'pg_ctl':
            result = subprocess.run([str(v) for v in argv], cwd=app_cwd, env=env, text=True,
                                    stdout=log, stderr=subprocess.STDOUT, timeout=90)
            log.seek(0)
            result.stdout, result.stderr = log.read(), ''
        else:
            result = subprocess.run([str(v) for v in argv], cwd=app_cwd, env=env, text=True,
                                    input=input, capture_output=True, timeout=timeout)
    if not private_result:
        client_chunks.append(result.stdout + result.stderr)
    if result.returncode not in allowed:
        message = (result.stdout + result.stderr)[-5000:]
        for secret in private_values:
            message = message.replace(secret, '<redacted>')
        raise RuntimeError(message)
    return result


# The authenticated launcher consumes the same verified bytes it hashes (no check/exec reread).
TRUSTED_BOOT = "import hashlib,sys; p=sys.argv[1]; b=open(p,'rb').read(); assert hashlib.sha256(b).hexdigest()==sys.argv[2]; sys.argv=[p]+sys.argv[3:]; exec(compile(b,p,'exec'),{'__name__':'__main__','__file__':p})"
if not (args.record_contract or args.compare_contract):
    build_parent = Path(tempfile.mkdtemp(prefix='ot-trusted-package-'))
    if os.name == 'nt':
        actor = run(['whoami'],os.environ).stdout.strip()
        run(['icacls',build_parent,'/inheritance:r','/grant:r',actor+':(OI)(CI)F'],os.environ)
    build = build_parent/'build'
    build_receipt = json.loads(run([sys.executable,source/'scripts/deployment/build-package.py','--output',build],os.environ,timeout=1200).stdout)
    check('trusted_builder_source',build_receipt['source_sha']==report['source_sha'])
    report['package'] = build_receipt
    package = build/'package'
    app_cwd = package
    launcher = build/'verified-install.py'
    manifest_digest = build_receipt['package_manifest_sha256']
    builtin={x.lower() for x in json.loads(run([php,'-n','-r','echo json_encode(get_loaded_extensions());'],os.environ).stdout)}
    extension_dir=Path(run([php,'-r',"echo ini_get('extension_dir');"],os.environ).stdout.strip())
    if not extension_dir.is_absolute():
        extension_dir=Path(php).parent/extension_dir
    provisioning_ini=build/'provision.ini'
    ini_lines=['display_errors=stderr','log_errors=On','error_log="php://stderr"','memory_limit=512M']
    for name in ['PDO','bcmath','ctype','curl','dom','fileinfo','intl','mbstring','openssl','pdo_pgsql','pgsql','session','tokenizer','xml','xmlreader','xmlwriter','zip']:
        if name.lower() not in builtin:
            library=extension_dir/(('php_'+name.lower()+'.dll') if os.name=='nt' else name.lower()+'.so')
            if not library.is_file():
                raise RuntimeError('Missing supported stock provisioning extension: '+name)
            ini_lines.append('extension="'+library.as_posix()+'"')
    provisioning_ini.write_text('\n'.join(ini_lines)+'\n',encoding='utf-8')
    provisioning_ini.chmod(0o600)
    php_digest=hashlib.sha256(Path(php).read_bytes()).hexdigest()
    ini_digest=hashlib.sha256(provisioning_ini.read_bytes()).hexdigest()

for mode in (['contract'] if (args.record_contract or args.compare_contract) else ['fresh', 'upgrade']):
    env = {k: v for k, v in os.environ.items() if not k.startswith(('PG', 'DB_', 'APP_', 'N03_', 'LEGACY_CUSTODY_', 'KIRION_'))}
    root = Path(tempfile.mkdtemp(prefix='ot-persistent-'+mode+'-'))
    if os.name == 'nt':
        actor = run(['whoami'], env).stdout.strip()
        run(['icacls', root, '/inheritance:r', '/grant:r', actor+':(OI)(CI)F'], env)
    else:
        root.chmod(0o700)
    bootstrap = secrets.token_hex(32)
    key = 'base64:'+base64.b64encode(secrets.token_bytes(32)).decode()
    private_values.extend([bootstrap, key])
    pwfile = root/'password'
    pwfile.write_text(bootstrap)
    pwfile.chmod(0o600)
    with socket.socket() as sock:
        sock.bind(('127.0.0.1', 0))
        port = sock.getsockname()[1]
    data = root/'data'
    started = False
    try:
        run([args.pg_bin/'initdb', '-D', data, '-U', 'postgres', '--auth=scram-sha-256', '--pwfile='+str(pwfile), '--encoding=UTF8', '--no-locale'], env)
        pwfile.unlink()
        openssl = shutil.which('openssl') or ('C:/Program Files/Git/usr/bin/openssl.exe' if os.name == 'nt' else 'openssl')
        run([openssl,'req','-x509','-newkey','rsa:2048','-nodes','-days','2','-subj','/CN=127.0.0.1','-addext','subjectAltName=IP:127.0.0.1','-keyout',root/'server.key','-out',root/'server.crt'],env)
        (root/'server.key').chmod(0o600)
        with (data/'postgresql.conf').open('a') as config:
            config.write("\nssl=on\nssl_cert_file='"+(root/'server.crt').as_posix().replace('\\','/')+"'\nssl_key_file='"+str(root/'server.key').replace('\\','/')+"'\nlog_min_error_statement='panic'\nlog_parameter_max_length=0\nlog_parameter_max_length_on_error=0\n")
        options = '-h 127.0.0.1 -p '+str(port)
        if os.name != 'nt':
            options += ' -k '+str(root)
        run([args.pg_bin/'pg_ctl', '-D', data, '-l', root/'postgres.log', '-o', options, '-w', 'start'], env)
        started = True
        db = 'talibon_portal_test' if mode == 'contract' else 'ot_persistent_'+mode
        env.update(PGHOST='127.0.0.1', PGPORT=str(port), PGUSER='postgres', PGPASSWORD=bootstrap, PGDATABASE='postgres',
                   APP_ENV='staging', APP_DEBUG='false', APP_KEY=key, APP_URL='https://rehearsal.invalid',
                   DB_CONNECTION='pgsql', DB_HOST='127.0.0.1', DB_PORT=str(port), DB_DATABASE=db, DB_USERNAME='postgres', DB_PASSWORD=bootstrap,
                   CACHE_STORE='array', SESSION_DRIVER='array', LOG_CHANNEL='stderr', PGSSLMODE='verify-full', PGSSLROOTCERT=(root/'server.crt').as_posix(), DB_SSLMODE='verify-full', DB_SSLROOTCERT=(root/'server.crt').as_posix(), PGREQUIREAUTH='scram-sha-256', PGGSSENCMODE='disable')

        def sql(query, connection_env=None, allowed=(0,), private_result=False):
            return run([args.pg_bin/'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-At'], connection_env or env, input=query, allowed=allowed, private_result=private_result)

        sql('CREATE DATABASE '+db)
        env['PGDATABASE'] = db
        report['server_version_num'] = sql("SELECT current_setting('server_version_num')").stdout.strip()
        if mode == 'contract':
            fixture_env = dict(env, APP_ENV='testing', N03_DISPOSABLE_LEASE='EXCLUSIVE_PG16_SYNTHETIC_ONLY')
            result = run([php,'tests/Manual/build-security-contract.php'],fixture_env)
            if not result.stdout.lstrip().startswith('{'):
                raise RuntimeError('Contract fixture did not return JSON: '+result.stdout[-1000:]+result.stderr[-1000:])
            contract = json.loads(result.stdout)
            canonical=json.dumps(contract,separators=(',',':'))
            if args.compare_contract:
                index=json.loads((source/'database/deployment/security-contract.json').read_text(encoding='utf-8'))
                reproduced={}
                for section in index['sections']:
                    rows=[]
                    for part in section['parts']:
                        file=source/'database/deployment'/part['file'];blob=file.read_bytes()
                        assert hashlib.sha256(blob).hexdigest()==part['sha256']
                        rows.extend(json.loads(blob))
                    assert len(rows)==section['rows'];reproduced[section['name']]=rows
                for part in index['runtime_profiles'][report['server_version_num']]:
                    blob=(source/'database/deployment'/part['file']).read_bytes()
                    assert hashlib.sha256(blob).hexdigest()==part['sha256']
                    reproduced['system_routine_security'].extend(json.loads(blob))
                reproduced['system_routine_security'].sort(key=lambda row:json.dumps(row,separators=(',',':')))
                if canonical!=json.dumps(reproduced,separators=(',',':')):
                    differences=[]
                    for name,rows in contract.items():
                        if rows!=reproduced.get(name):
                            differences.append({'section':name,'actual_rows':len(rows),'expected_rows':len(reproduced.get(name,[])),'sample_actual':next((row for row in rows if row not in reproduced.get(name,[])),None),'sample_expected':next((row for row in reproduced.get(name,[]) if row not in rows),None)})
                    (args.output/'contract-difference.json').write_text(json.dumps(differences,indent=2),encoding='utf-8')
                    print('Independent policy differences:',','.join(x['section'] for x in differences))
                check('independent_canonical_contract_matches',canonical==json.dumps(reproduced,separators=(',',':')))
                (args.output/'contract-comparison.json').write_text(json.dumps({'source_sha':report['source_sha'],'server_version_num':report['server_version_num'],'canonical_sha256':hashlib.sha256(canonical.encode()).hexdigest(),'independently_regenerated':True,'matches':True},indent=2))
            else:
                if report['server_version_num'] != '160015':
                    raise RuntimeError('Record the base contract only with the qualified PG16.15 fixture; runtime additions require independent review')
                profiles=json.loads((source/'database/deployment/security-contract.json').read_text(encoding='utf-8'))['runtime_profiles']
                index={'format':3,'sections':[]};folder=source/'database/deployment/security-contract';folder.mkdir(exist_ok=True)
                for name,rows in contract.items():
                    parts=[]
                    for i in range(0,len(rows),100):
                        file=folder/(name+'-'+str(i//100)+'.json');file.write_text(json.dumps(rows[i:i+100],indent=2)+'\n',encoding='utf-8',newline='\n')
                        parts.append({'file':file.relative_to(source/'database/deployment').as_posix(),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
                    index['sections'].append({'name':name,'rows':len(rows),'parts':parts})
                index['runtime_profiles']=profiles
                (source/'database/deployment/security-contract.json').write_text(json.dumps(index,indent=2)+'\n',encoding='utf-8',newline='\n')
            check('canonical_disposable_contract_derived',len(contract['roles'])==9 and len(contract['effective_columns'])>1000)
            continue
        all_paths = sorted((source/'database/migrations').glob('*.php'))
        if mode == 'upgrade':
            baseline = [p for p in all_paths if p.stem <= '2026_11_20_000200_enforce_iam_identity_integrity' and 'legacy_custody' not in p.name]
            run([php, 'artisan', 'migrate', '--force', '--no-interaction']+['--path=database/migrations/'+p.name for p in baseline], env)
            # The synthetic account contains real password and encrypted MFA representations.
            seed = """<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); try {
            $d=Illuminate\\Support\\Facades\\DB::table('departments')->insertGetId(['code'=>'SYNTH_QA','name'=>'Synthetic QA Office','is_active'=>true,'created_at'=>now(),'updated_at'=>now()]);
            $user=new App\\Models\\User; $user->forceFill(['name'=>'Synthetic Preserved Administrator','username'=>'synthetic_preserved_admin','email'=>'admin@rehearsal.invalid','password'=>Illuminate\\Support\\Facades\\Hash::make('synthetic-local-only-credential'),'role'=>'system_admin','is_active'=>true,'account_status'=>'active','mfa_secret'=>'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP','mfa_confirmed_at'=>now(),'mfa_recovery_codes'=>[Illuminate\\Support\\Facades\\Hash::make('synthetic-recovery')],'created_at'=>now(),'updated_at'=>now()])->save(); $u=$user->id;
            Illuminate\\Support\\Facades\\DB::table('employees')->insert(['employee_number'=>'SYNTH_ADMIN','user_id'=>$u,'department_id'=>$d,'position_title'=>'Synthetic evaluator','employment_status'=>'active','created_at'=>now(),'updated_at'=>now()]);
            echo 'SYNTH_SEEDED'; } catch(Throwable $e) { fwrite(STDERR,get_class($e)); exit(1); } """
            check(mode+'_nonempty_admin_fixture', run([php], env, input=seed).stdout.strip() == 'SYNTH_SEEDED')
            check(mode+'_admin_and_employee_present', sql('SELECT (SELECT count(*) FROM users)=1 AND (SELECT count(*) FROM employees)=1').stdout.strip() == 't')
            sql("CREATE ROLE legacy_owner NOLOGIN; CREATE ROLE legacy_runtime LOGIN NOINHERIT; CREATE DATABASE unrelated_service OWNER legacy_owner; ALTER DATABASE "+db+" OWNER TO legacy_owner; ALTER SCHEMA public OWNER TO legacy_owner;")
            sql("DO $o$ DECLARE x record; BEGIN FOR x IN SELECT tablename FROM pg_tables WHERE schemaname='public' LOOP EXECUTE format('ALTER TABLE public.%I OWNER TO legacy_owner',x.tablename); END LOOP; END $o$; GRANT USAGE,CREATE ON SCHEMA public TO legacy_runtime; GRANT ALL ON ALL TABLES IN SCHEMA public TO legacy_runtime; GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO legacy_runtime;")
            other_env=dict(env,PGDATABASE='unrelated_service')
            sql('CREATE TABLE unrelated_marker(id int PRIMARY KEY); ALTER TABLE unrelated_marker OWNER TO legacy_owner; GRANT SELECT ON unrelated_marker TO legacy_runtime;',other_env)
            unrelated_query="SELECT row_to_json(d) FROM pg_database d WHERE datname='unrelated_service'; SELECT row_to_json(r) FROM pg_roles r WHERE rolname IN ('legacy_owner','legacy_runtime') ORDER BY rolname; SELECT relacl::text,relowner::regrole FROM pg_class WHERE relname='unrelated_marker';"
            unrelated_before=sql(unrelated_query,other_env).stdout
            check(mode+'_exact_54_migration_baseline', sql('SELECT count(*) FROM migrations').stdout.strip() == '54')
        ledger = sql('SELECT migration FROM migrations ORDER BY migration').stdout.splitlines() if mode == 'upgrade' else []
        fingerprint_sql = "SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')) FROM users t; SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')) FROM employees t;"
        before = sql(fingerprint_sql).stdout if mode == 'upgrade' else None
        target = dict(database=db, host='127.0.0.1', port=str(port), system_identifier=sql('SELECT system_identifier FROM pg_control_system()').stdout.strip(),
                      bootstrap_role='postgres', source_sha=report['source_sha'], app_key_sha256=hashlib.sha256(key.encode()).hexdigest(), expected_migrations=ledger,
                      retired_runtime_roles=['legacy_runtime'] if mode == 'upgrade' else [], legacy_owner_roles=['legacy_owner'] if mode == 'upgrade' else [],
                      package_sha256=manifest_digest, tree_sha=build_receipt['tree_sha'], previous_installation=None)
        roles = ['kirion_g1b_migrator', 'kirion_g1b_app', 'kirion_g1b_custody', 'n03_stage', 'n03_command', 'n03_reconcile', 'n03_reader']
        credentials = {role: secrets.token_hex(32) for role in roles}
        private_values.extend(credentials.values())
        manifest_file, credentials_file = root/'target.json', root/'credentials.json'
        credentials_file.write_text(json.dumps(credentials))
        credentials_file.chmod(0o600)

        def invocation(target_file=manifest_file, credential_file=credentials_file, pin=manifest_digest, package_path=package):
            return [sys.executable,'-I','-S','-c',TRUSTED_BOOT,str(launcher),build_receipt['launcher_sha256'],
                    '--package',str(package_path),'--manifest',str(build/'package-manifest.json'),'--sha256',pin,
                    '--target',str(target_file),'--credentials',str(credential_file),'--php',php,'--ini',str(provisioning_ini),'--php-sha256',php_digest,'--ini-sha256',ini_digest]

        def install(manifest, expected=0, extra_env=None):
            manifest_file.write_text(json.dumps(manifest))
            manifest_file.chmod(0o600)
            return run(invocation(),extra_env or env,allowed=(expected,))

        for field, value in [('database','unauthorized_target'), ('system_identifier','0'), ('source_sha','0'*40), ('bootstrap_role','unauthorized_role'), ('app_key_sha256','0'*64), ('expected_migrations',['unknown_migration'])]:
            invalid = dict(target, **{field:value})
            check(mode+'_refuses_'+field, install(invalid, 1).returncode == 1)
        testing_env = dict(env, APP_ENV='testing')
        check(mode+'_persistent_refuses_testing', install(target, 1, testing_env).returncode == 1)
        foundation = next(p for p in all_paths if p.stem == '2026_11_19_200000_create_legacy_custody_foundation')
        denied = run([php,'artisan','migrate','--force','--path=database/migrations/'+foundation.name], env, allowed=(1,))
        check(mode+'_ordinary_migrate_still_denied', 'leased synthetic PG16' in denied.stdout+denied.stderr)
        if mode == 'fresh':
            # Ordinary migrate created only its repository, not application schema.
            target['expected_migrations'] = []
        invalid = dict(target)
        system_cases=[
            ('system_schema_acl','GRANT CREATE ON SCHEMA pg_catalog TO PUBLIC','REVOKE CREATE ON SCHEMA pg_catalog FROM PUBLIC'),
            ('system_column_acl','REVOKE SELECT(oid) ON pg_catalog.pg_subscription FROM PUBLIC','GRANT SELECT(oid) ON pg_catalog.pg_subscription TO PUBLIC'),
            ('system_type_acl','REVOKE USAGE ON TYPE pg_catalog.pg_lsn FROM PUBLIC','GRANT USAGE ON TYPE pg_catalog.pg_lsn TO PUBLIC'),
            ('system_routine_acl','REVOKE EXECUTE ON FUNCTION pg_catalog.abs(integer) FROM PUBLIC','GRANT EXECUTE ON FUNCTION pg_catalog.abs(integer) TO PUBLIC'),
        ]
        if report['server_version_num']=='160016':
            system_cases.append(('minor_routine_acl','REVOKE EXECUTE ON FUNCTION pg_catalog.binary_upgrade_set_next_attribute_versions(pg_lsn[]) FROM PUBLIC','GRANT EXECUTE ON FUNCTION pg_catalog.binary_upgrade_set_next_attribute_versions(pg_lsn[]) TO PUBLIC'))
        for name,change,undo in system_cases:
            sql(change)
            check(mode+'_initial_'+name,install(target,1).returncode==1)
            check(mode+'_initial_'+name+'_rollback',sql("SELECT (SELECT count(*) FROM migrations)="+str(len(ledger))+" AND (SELECT count(*) FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%')=0").stdout.strip()=='t')
            sql(undo)
        sql('ALTER TABLE migrations ENABLE ROW LEVEL SECURITY')
        late=install(invalid,1)
        if 'complete security postflight' not in late.stdout:
            raise RuntimeError('Late rollback witness refused before postflight: '+late.stdout[-800:]+late.stderr[-800:])
        check(mode+'_late_failure_rolls_back',late.returncode==1 and 'complete security postflight' in late.stdout and 'drift: relations' in late.stdout)
        check(mode+'_rollback_roles', sql("SELECT count(*) FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%'").stdout.strip() == '0')
        check(mode+'_rollback_custody', sql("SELECT to_regnamespace('legacy_custody') IS NULL").stdout.strip() == 't')
        check(mode+'_rollback_ledger', int(sql('SELECT count(*) FROM migrations').stdout.strip()) == len(ledger))
        sql('ALTER TABLE migrations DISABLE ROW LEVEL SECURITY')
        if mode=='upgrade':
            initial_cases=[
                ('initial_unknown_view','CREATE VIEW public.legacy_unknown_view AS SELECT id FROM users','DROP VIEW public.legacy_unknown_view'),
                ('initial_unknown_routine',"CREATE FUNCTION public.legacy_unknown_function() RETURNS int LANGUAGE SQL AS 'SELECT 1'; ALTER FUNCTION public.legacy_unknown_function() OWNER TO legacy_owner",'DROP FUNCTION public.legacy_unknown_function()'),
                ('initial_runtime_owned_table','ALTER TABLE public.users OWNER TO legacy_runtime','ALTER TABLE public.users OWNER TO legacy_owner'),
                ('initial_default_drift','ALTER DEFAULT PRIVILEGES FOR ROLE legacy_owner GRANT SELECT ON TABLES TO legacy_runtime','ALTER DEFAULT PRIVILEGES FOR ROLE legacy_owner REVOKE SELECT ON TABLES FROM legacy_runtime'),
                ('initial_shared_global_read','GRANT pg_read_all_data TO legacy_runtime WITH SET TRUE','REVOKE pg_read_all_data FROM legacy_runtime'),
                ('initial_unregistered_control','CREATE SCHEMA deployment_control','DROP SCHEMA deployment_control'),
            ]
            initial_cases.extend([('initial_large_object',"SELECT lo_create(900001); ALTER LARGE OBJECT 900001 OWNER TO legacy_runtime",'SELECT lo_unlink(900001)'),('initial_foreign_wrapper','CREATE FOREIGN DATA WRAPPER qa_fdw','DROP FOREIGN DATA WRAPPER qa_fdw'),('initial_publication','CREATE PUBLICATION qa_pub FOR TABLE users','DROP PUBLICATION qa_pub'),('initial_domain','CREATE DOMAIN public.qa_domain AS integer','DROP DOMAIN public.qa_domain')])
            for name,change,undo in initial_cases:
                sql(change)
                check(mode+'_'+name,install(target,1).returncode==1)
                check(mode+'_'+name+'_rollback',sql("SELECT (SELECT count(*) FROM migrations)=54 AND (SELECT count(*) FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%')=0").stdout.strip()=='t')
                sql(undo)
            # Authorized legacy/PUBLIC drift on canonical objects is reconciled, not inherited.
            sql('GRANT SELECT(password) ON users TO legacy_runtime WITH GRANT OPTION; GRANT SELECT ON users TO PUBLIC; GRANT TEMPORARY,CREATE ON DATABASE '+db+' TO legacy_runtime')
        check(mode+'_install', '"status":"INSTALLED"' in install(target).stdout)
        check(mode+'_all_migrations_once', sql('SELECT count(*)=count(DISTINCT migration) FROM migrations').stdout.strip() == 't')
        check(mode+'_complete_ledger', int(sql('SELECT count(*) FROM migrations').stdout.strip()) == len(all_paths))
        if before is not None:
            check(mode+'_admin_password_mfa_employee_preserved', before == sql(fingerprint_sql).stdout)
            auth = "<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); try { $u=App\\Models\\User::where('username','synthetic_preserved_admin')->firstOrFail(); $g=new PragmaRX\\Google2FA\\Google2FA; if (!Illuminate\\Support\\Facades\\Hash::check('synthetic-local-only-credential',$u->password) || $u->mfa_secret!=='JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP' || !$g->verifyKey($u->mfa_secret,$g->getCurrentOtp($u->mfa_secret))) { exit(19); } echo 'PRESERVED'; } catch(Throwable $e) { fwrite(STDERR,get_class($e)); exit(1); }"
            auth_result = run([php],env,input=auth)
            check(mode+'_password_and_mfa_decrypt', auth_result.stdout.strip()=='PRESERVED')
        runtime = dict(env, PGUSER='kirion_g1b_app', PGPASSWORD=credentials['kirion_g1b_app'])
        check(mode+'_real_runtime_connection', sql('SELECT current_user', runtime).stdout.strip() == 'kirion_g1b_app')
        app_env = dict(env, DB_USERNAME='kirion_g1b_app', DB_PASSWORD=credentials['kirion_g1b_app'])
        for suffix in ['STAGE','COMMAND','RECONCILE','READER']:
            app_env['N03_'+suffix+'_PASSWORD'] = credentials['n03_'+suffix.lower()]
        connections = "<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); $out=[]; foreach (['pgsql','n03_stage','n03_command','n03_reconcile','n03_reader'] as $name) { $out[$name]=Illuminate\\Support\\Facades\\DB::connection($name)->selectOne('SELECT current_user AS role')->role; } echo json_encode($out);"
        check(mode+'_laravel_runtime_connections', json.loads(run([php],app_env,input=connections).stdout) ==
              {'pgsql':'kirion_g1b_app', **{name:name for name in ['n03_stage','n03_command','n03_reconcile','n03_reader']}})
        check(mode+'_positive_runtime_directory',sql('SELECT count(*) FROM public.users',runtime).returncode==0)
        if mode=='upgrade':
            check(mode+'_positive_runtime_task_write',sql("BEGIN; INSERT INTO tasks(title,state,created_by_user_id,created_at,updated_at) SELECT 'Synthetic privilege witness','open',id,now(),now() FROM users LIMIT 1; ROLLBACK",runtime).returncode==0)
        for name, query in [('ddl','CREATE TABLE public.forbidden(id int)'), ('audit_update','UPDATE public.audit_logs SET action=action WHERE false'), ('custody_read','SELECT * FROM legacy_custody.operations'), ('migration_write',"DELETE FROM public.migrations WHERE false"), ('owner_escalation','SET ROLE kirion_g1b_owner')]:
            check(mode+'_runtime_denies_'+name, sql(query, runtime, allowed=(3,)).returncode == 3)
        reader = dict(env, PGUSER='n03_reader', PGPASSWORD=credentials['n03_reader'])
        check(mode+'_reader_denies_mfa', sql('SELECT mfa_secret FROM public.users', reader, allowed=(3,)).returncode == 3)
        if mode == 'upgrade':
            check(mode+'_legacy_runtime_revoked', sql("SELECT NOT has_table_privilege('legacy_runtime','public.users','UPDATE')").stdout.strip() == 't')
        target['expected_migrations'] = sql('SELECT migration FROM migrations ORDER BY migration').stdout.splitlines()
        target['previous_installation'] = json.loads(sql('SELECT row_to_json(i) FROM deployment_control.installations i').stdout)

        unsupported_probe="<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); echo json_encode(app(App\\Deployment\\SupportedPg16::class)->snapshot());"
        catalog_probe="<?php require 'vendor/autoload.php'; $a=require 'bootstrap/app.php'; $a->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); echo hash('sha256',json_encode(app(App\\Deployment\\SecurityCatalog::class)->snapshot('postgres')));"
        def metadata_fingerprint():
            # Compare security semantics, not autovacuum/statistics/relfilenode bookkeeping.
            # SecurityCatalog includes unknown objects, ACLs, owners, definitions, constraints,
            # RI triggers, memberships, defaults and effective rights; registry rows are separate.
            semantic=run([php],env,input=catalog_probe).stdout
            assert len(semantic.strip())==64 and all(c in '0123456789abcdef' for c in semantic.strip())
            registry=sql('SELECT row_to_json(i) FROM deployment_control.installations i ORDER BY singleton').stdout
            unsupported=run([php],env,input=unsupported_probe).stdout
            assert unsupported.startswith('{')
            return semantic,registry,unsupported
        canonical_fingerprint=run([php],env,input=catalog_probe).stdout
        drift_cases=[
            ('reader_delete','GRANT DELETE ON transactions TO n03_reader','REVOKE DELETE ON transactions FROM n03_reader'),
            ('column_grant','GRANT UPDATE(name) ON users TO n03_reader','REVOKE UPDATE(name) ON users FROM n03_reader'),
            ('sequence_update','GRANT UPDATE ON SEQUENCE users_id_seq TO n03_reader','REVOKE UPDATE ON SEQUENCE users_id_seq FROM n03_reader'),
            ('schema_create','GRANT CREATE ON SCHEMA public TO kirion_g1b_app','REVOKE CREATE ON SCHEMA public FROM kirion_g1b_app'),
            ('database_temp','GRANT TEMPORARY ON DATABASE '+db+' TO kirion_g1b_app','REVOKE TEMPORARY ON DATABASE '+db+' FROM kirion_g1b_app'),
            ('grant_option','GRANT SELECT ON transactions TO kirion_g1b_app WITH GRANT OPTION','REVOKE GRANT OPTION FOR SELECT ON transactions FROM kirion_g1b_app'),
            ('public_table','GRANT SELECT ON users TO PUBLIC','REVOKE SELECT ON users FROM PUBLIC'),
            ('public_schema','GRANT CREATE ON SCHEMA public TO PUBLIC','REVOKE CREATE ON SCHEMA public FROM PUBLIC'),
            ('public_database','GRANT CREATE ON DATABASE '+db+' TO PUBLIC','REVOKE CREATE ON DATABASE '+db+' FROM PUBLIC'),
            ('set_role','GRANT kirion_g1b_owner TO n03_reader','REVOKE kirion_g1b_owner FROM n03_reader'),
            ('migrator_extra_path','GRANT pg_read_all_data TO kirion_g1b_migrator WITH INHERIT FALSE, SET TRUE','REVOKE pg_read_all_data FROM kirion_g1b_migrator'),
            ('migrator_admin_option','GRANT kirion_g1b_owner TO kirion_g1b_migrator WITH ADMIN TRUE','GRANT kirion_g1b_owner TO kirion_g1b_migrator WITH ADMIN FALSE'),
            ('role_attribute','ALTER ROLE n03_reader INHERIT','ALTER ROLE n03_reader NOINHERIT'),
            ('owner_db','ALTER DATABASE '+db+' OWNER TO n03_reader','ALTER DATABASE '+db+' OWNER TO postgres; GRANT CONNECT ON DATABASE '+db+' TO n03_reader'),
            ('owner_schema','ALTER SCHEMA public OWNER TO n03_reader','ALTER SCHEMA public OWNER TO kirion_g1b_owner; GRANT USAGE ON SCHEMA public TO n03_reader'),
            ('routine_owner','ALTER FUNCTION legacy_custody.lock_pending(uuid,bigint,text) OWNER TO n03_reader','ALTER FUNCTION legacy_custody.lock_pending(uuid,bigint,text) OWNER TO kirion_g1b_owner'),
            ('unknown_view','CREATE VIEW public.unapproved_view AS SELECT id FROM users; ALTER VIEW public.unapproved_view OWNER TO n03_reader','DROP VIEW public.unapproved_view'),
            ('unknown_partition','CREATE TABLE public.unapproved_parent(id int) PARTITION BY RANGE(id); CREATE TABLE public.unapproved_child PARTITION OF public.unapproved_parent FOR VALUES FROM (0) TO (10)','DROP TABLE public.unapproved_parent'),
            ('default_acl','ALTER DEFAULT PRIVILEGES GRANT EXECUTE ON FUNCTIONS TO PUBLIC','ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC'),
            ('registry_schema_acl','GRANT CREATE ON SCHEMA deployment_control TO PUBLIC','REVOKE CREATE ON SCHEMA deployment_control FROM PUBLIC'),
            ('registry_table_acl','GRANT SELECT ON deployment_control.installations TO n03_reader','REVOKE SELECT ON deployment_control.installations FROM n03_reader'),
            ('registry_identity',"UPDATE deployment_control.installations SET installation_id='00000000-0000-4000-8000-000000000001'","UPDATE deployment_control.installations SET installation_id='"+target['previous_installation']['installation_id']+"'"),
            ('registry_schema_owner','ALTER SCHEMA deployment_control OWNER TO n03_reader','ALTER SCHEMA deployment_control OWNER TO postgres'),
            ('registry_table_owner','ALTER TABLE deployment_control.installations OWNER TO n03_reader','ALTER TABLE deployment_control.installations OWNER TO postgres'),
            ('sequence_owner','ALTER SEQUENCE users_id_seq OWNED BY NONE; ALTER SEQUENCE users_id_seq OWNER TO n03_reader','ALTER SEQUENCE users_id_seq OWNER TO kirion_g1b_owner; ALTER SEQUENCE users_id_seq OWNED BY users.id'),
            ('type_grant_option','GRANT USAGE ON TYPE users TO n03_reader WITH GRANT OPTION','REVOKE USAGE ON TYPE users FROM n03_reader'),
            ('internal_trigger_state','ALTER TABLE users DISABLE TRIGGER ALL','ALTER TABLE users ENABLE TRIGGER ALL'),
            ('role_startup','ALTER ROLE n03_reader IN DATABASE '+db+" SET search_path='pg_catalog'",'ALTER ROLE n03_reader IN DATABASE '+db+' RESET ALL'),
            ('registry_shape','ALTER TABLE deployment_control.installations ADD COLUMN untrusted boolean','ALTER TABLE deployment_control.installations DROP COLUMN untrusted'),
        ]
        unsupported_cases=[
            ('large_object',"SELECT lo_create(900001)","SELECT lo_unlink(900001)"),
            ('foreign_server',"CREATE FOREIGN DATA WRAPPER qa_fdw; CREATE SERVER qa_server FOREIGN DATA WRAPPER qa_fdw; CREATE USER MAPPING FOR CURRENT_USER SERVER qa_server OPTIONS (password 'synthetic-canary')","DROP SERVER qa_server CASCADE; DROP FOREIGN DATA WRAPPER qa_fdw"),
            ('publication','CREATE PUBLICATION qa_publication FOR TABLE users','DROP PUBLICATION qa_publication'),
            ('subscription',"CREATE SUBSCRIPTION qa_subscription CONNECTION 'host=127.0.0.1 password=synthetic-canary' PUBLICATION qa_publication WITH (connect=false,create_slot=false,enabled=false)",'DROP SUBSCRIPTION qa_subscription'),
            ('domain','CREATE DOMAIN public.qa_domain AS integer CHECK(VALUE>0)','DROP DOMAIN public.qa_domain'),
            ('system_schema_acl','GRANT CREATE ON SCHEMA pg_catalog TO n03_reader','REVOKE CREATE ON SCHEMA pg_catalog FROM n03_reader'),
            ('system_object','CREATE TABLE pg_catalog.qa_untrusted(id int)','DROP TABLE pg_catalog.qa_untrusted'),
            ('user_collation',"CREATE COLLATION public.qa_collation (provider=libc,locale='C')",'DROP COLLATION public.qa_collation'),
        ]
        drift_cases.extend(unsupported_cases)
        drift_cases.extend(('catalog_'+name,change,undo) for name,change,undo in system_cases)
        for name,change,undo in drift_cases:
            sql(change)
            drift_before=metadata_fingerprint()
            check(mode+'_rejects_'+name,install(target,1).returncode==1)
            check(mode+'_drift_rollback_'+name,metadata_fingerprint()==drift_before)
            sql(undo)
            check(mode+'_fixture_cleanup_'+name,run([php],env,input=catalog_probe).stdout==canonical_fingerprint)
        if mode=='upgrade':
            for field in ['legacy_owner_roles','retired_runtime_roles']:
                reduced=dict(target,**{field:[]})
                check(mode+'_bound_identity_omission_'+field,install(reduced,1).returncode==1)
            reclassified=dict(target,legacy_owner_roles=target['retired_runtime_roles'],retired_runtime_roles=target['legacy_owner_roles'])
            check(mode+'_bound_identity_reclassification',install(reclassified,1).returncode==1)
            sql('GRANT pg_read_all_data TO legacy_runtime WITH SET TRUE')
            check(mode+'_omission_with_retired_authority_drift',install(dict(target,retired_runtime_roles=[]),1).returncode==1)
            sql('REVOKE pg_read_all_data FROM legacy_runtime')
            sql('CREATE ROLE replacement_runtime')
            check(mode+'_bound_identity_substitution',install(dict(target,retired_runtime_roles=['replacement_runtime']),1).returncode==1)
            sql('DROP ROLE replacement_runtime')
        for role in roles:
            incorrect=dict(credentials,**{role:secrets.token_hex(32)})
            private_values.append(incorrect[role])
            credentials_file.write_text(json.dumps(incorrect))
            check(mode+'_registered_wrong_password_'+role,install(target,1).returncode==1)
            credentials_file.write_text(json.dumps(credentials))
        # HBA belongs only to this new synthetic cluster. Never alter a real target's authentication.
        hba=data/'pg_hba.conf'; original_hba=hba.read_text()
        hba.write_text(original_hba.replace('scram-sha-256','trust'))
        run([args.pg_bin/'pg_ctl','-D',data,'reload'],env)
        check(mode+'_refuses_nonpassword_HBA',install(target,1).returncode==1)
        hba.write_text(original_hba);run([args.pg_bin/'pg_ctl','-D',data,'reload'],env)
        canary=root/'execution-canary'; payload=root/'unverified.php'
        payload.write_text("<?php file_put_contents("+json.dumps(canary.as_posix())+",'EXECUTED'); return [];",encoding='utf-8')
        cache_vars={name:str(payload) for name in ['APP_SERVICES_CACHE','APP_PACKAGES_CACHE','APP_CONFIG_CACHE','APP_ROUTES_CACHE','APP_EVENTS_CACHE']}
        cache_vars.update(APP_BASE_PATH=str(root),LARAVEL_STORAGE_PATH=str(root),COMPOSER_HOME=str(root),APP_ENV_FILE=str(payload),PGSERVICE='unverified',PGPASSFILE=str(root/'unverified-passwords'))
        ini_original=provisioning_ini.read_bytes()
        provisioning_ini.write_bytes(ini_original+('auto_prepend_file="'+payload.as_posix()+'"\n').encode())
        check(mode+'_untrusted_php_configuration_rejected_before_execution',install(target,1).returncode==1 and not canary.exists())
        provisioning_ini.write_bytes(ini_original)
        normalized=install(target,0,dict(env,**cache_vars))
        check(mode+'_external_executable_paths_contained', '"status":"INSTALLED"' in normalized.stdout and not canary.exists())
        (root/'hashlib.py').write_text('from pathlib import Path\nPath('+repr(str(canary))+').write_text("EXECUTED")\n',encoding='utf-8')
        startup_env=dict(env,PYTHONPATH=str(root),PYTHONHOME=str(root),PYTHONSTARTUP=str(root/'hashlib.py'))
        if os.name=='nt':
            startup_env.update(SystemRoot=str(root/'Windows'),WINDIR=str(root/'Windows'))
        check(mode+'_outer_runtime_environment_contained','"status":"INSTALLED"' in install(target,0,startup_env).stdout and not canary.exists())
        relative_php=invocation();relative_php[relative_php.index('--php')+1]=Path(php).name
        check(mode+'_relative_php_refused',run(relative_php,env,allowed=(1,)).returncode==1)
        for setting in ['log_statement=all','log_min_error_statement=error','log_parameter_max_length=-1','pgaudit.log=all']:
            key,value=setting.split('=',1)
            sql('ALTER ROLE postgres IN DATABASE '+db+' SET "'+key+'" TO \''+value+"'")
            check(mode+'_server_logging_refusal_'+key,install(target,1).returncode==1)
            sql('ALTER ROLE postgres IN DATABASE '+db+' RESET "'+key+'"')
        # Even an externally declared matching arbitrary previous SHA cannot bless an unqualified lineage.
        sql("UPDATE deployment_control.installations SET source_sha='"+'f'*40+"'")
        forged=dict(target,previous_installation=dict(target['previous_installation'],source_sha='f'*40))
        check(mode+'_rejects_forged_lineage',install(forged,1).returncode==1)
        sql("UPDATE deployment_control.installations SET source_sha='"+report['source_sha']+"'")
        for setting in ['log_statement=all','log_duration=on','log_min_duration_statement=0','log_parameter_max_length=-1','log_min_error_statement=error','debug_print_parse=on','pgaudit.log=all']:
            check(mode+'_logging_refusal_'+setting.split('=')[0],install(target,1,dict(env,PGOPTIONS='-c '+setting)).returncode==1)
        check(mode+'_rejects_unencrypted_transport',install(target,1,dict(env,DB_SSLMODE='disable',PGSSLMODE='disable')).returncode==1)
        check(mode+'_rejects_wrong_credentials',install(target,1,dict(env,DB_PASSWORD=secrets.token_hex(32))).returncode==1)
        # Content tampering is rejected BEFORE vendor/autoload or application bootstrap executes.
        tamper_paths=['app/Deployment/PersistentInstaller.php','database/deployment/finalize.sql','database/deployment/security-contract.json','vendor/autoload.php','composer.lock','public/build/manifest.json']
        for relative in tamper_paths:
            file=package/relative
            original=file.read_bytes()
            file.write_bytes(original+b'\nUNTRUSTED-CANARY\n')
            check(mode+'_tamper_'+relative,install(target,1).returncode==1)
            file.write_bytes(original)
        extra=package/'DEPLOYMENT_SHA'; extra.write_text(report['source_sha'])
        check(mode+'_mutable_marker_not_authority',install(target,1).returncode==1)
        extra.unlink()
        missing=package/'bin/legacy-custody-broker'; original=missing.read_bytes(); missing.unlink()
        check(mode+'_missing_executable',install(target,1).returncode==1); missing.write_bytes(original)
        for name in ['PHPRC','PHP_INI_SCAN_DIR','LD_PRELOAD','OTEL_TRACES_EXPORTER']:
            check(mode+'_runtime_instrumentation_'+name,install(target,1,dict(env,**{name:'untrusted-canary'})).returncode==1)
        check(mode+'_wrong_independent_pin',run(invocation(pin='0'*64),env,allowed=(1,)).returncode==1)
        trusted_launcher=launcher.read_bytes(); launcher.write_bytes(trusted_launcher+b'\nraise RuntimeError("UNTRUSTED")\n')
        check(mode+'_tampered_trust_anchor',run(invocation(),env,allowed=(1,)).returncode==1); launcher.write_bytes(trusted_launcher)
        if os.name=='nt':
            run(['icacls',credentials_file,'/grant','*S-1-1-0:R'],env)
            check(mode+'_private_acl_required',install(target,1).returncode==1)
            run(['icacls',credentials_file,'/remove:g','*S-1-1-0'],env)
        else:
            credentials_file.chmod(0o644)
            check(mode+'_private_mode_required',install(target,1).returncode==1)
            credentials_file.chmod(0o600)
        # Canary scanning includes BOTH plaintext and actual sensitive SCRAM verifiers, success and failures.
        verifiers=sql("SELECT rolpassword FROM pg_authid WHERE rolname IN ('kirion_g1b_migrator','kirion_g1b_app','kirion_g1b_custody','n03_stage','n03_command','n03_reconcile','n03_reader')",private_result=True).stdout.splitlines()
        private_values.extend(verifiers)
        server_log=(root/'postgres.log').read_text(encoding='utf-8',errors='replace')
        check(mode+'_no_secret_or_verifier_in_server_log',all(v not in server_log for v in [bootstrap,key,*credentials.values(),*verifiers]) and 'SCRAM-SHA-256$' not in server_log)
        check(mode+'_no_secret_or_verifier_in_client_error_logs',all(v not in ''.join(client_chunks) for v in [bootstrap,key,*credentials.values(),*verifiers]) and 'SCRAM-SHA-256$' not in ''.join(client_chunks))
        if mode=='upgrade':
            check(mode+'_unrelated_database_and_roles_unchanged',sql(unrelated_query,other_env).stdout==unrelated_before)
        check(mode+'_idempotent_rerun', '"status":"INSTALLED"' in install(target).stdout)
        check(mode+'_no_credential_rotation', sql('SELECT 1', runtime).stdout.strip() == '1')
        check(mode+'_all_tables_owner', sql("SELECT count(*)=0 FROM pg_tables t JOIN pg_class c ON c.oid=to_regclass(format('%I.%I',t.schemaname,t.tablename)) WHERE t.schemaname IN ('public','legacy_custody') AND c.relowner<>'kirion_g1b_owner'::regrole").stdout.strip()=='t')
    finally:
        if started:
            run([args.pg_bin/'pg_ctl','-D',data,'-m','fast','-w','stop'],env)
        for path in [root/'target.json',root/'credentials.json']:
            path.unlink(missing_ok=True)
        (args.output/'persistent-rehearsal.json').write_text(json.dumps(report,indent=2))

print('Canonical policy contract derived:' if (args.record_contract or args.compare_contract) else 'Persistent fresh/upgrade qualification PASS:',len(report['checks']),'checks')
