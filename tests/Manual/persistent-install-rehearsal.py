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

ap = argparse.ArgumentParser(description=__doc__)
ap.add_argument('--pg-bin', type=Path, required=True)
ap.add_argument('--output', type=Path, required=True)
args = ap.parse_args()
source = Path(__file__).resolve().parents[2]
args.output.mkdir(parents=True, exist_ok=True)
php = shutil.which('php')
report = {'source_sha': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=source, text=True).strip(), 'checks': []}
private_values = []


def check(name, condition):
    report['checks'].append({'case': name, 'pass': bool(condition)})
    if not condition:
        raise RuntimeError('Failed: ' + name)


def run(argv, env, input=None, allowed=(0,)):
    with tempfile.TemporaryFile(mode='w+t', encoding='utf8') as log:
        if Path(str(argv[0])).stem == 'pg_ctl':
            result = subprocess.run([str(v) for v in argv], cwd=source, env=env, text=True,
                                    stdout=log, stderr=subprocess.STDOUT, timeout=90)
            log.seek(0)
            result.stdout, result.stderr = log.read(), ''
        else:
            result = subprocess.run([str(v) for v in argv], cwd=source, env=env, text=True,
                                    input=input, capture_output=True, timeout=240)
    if result.returncode not in allowed:
        message = (result.stdout + result.stderr)[-5000:]
        for secret in private_values:
            message = message.replace(secret, '<redacted>')
        raise RuntimeError(message)
    return result


for mode in ['fresh', 'upgrade']:
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
        run([args.pg_bin/'initdb', '-D', data, '-U', 'ot_bootstrap', '--auth=scram-sha-256', '--pwfile='+str(pwfile), '--encoding=UTF8', '--no-locale'], env)
        pwfile.unlink()
        options = '-h 127.0.0.1 -p '+str(port)
        if os.name != 'nt':
            options += ' -k '+str(root)
        run([args.pg_bin/'pg_ctl', '-D', data, '-l', root/'postgres.log', '-o', options, '-w', 'start'], env)
        started = True
        db = 'ot_persistent_'+mode
        env.update(PGHOST='127.0.0.1', PGPORT=str(port), PGUSER='ot_bootstrap', PGPASSWORD=bootstrap, PGDATABASE='postgres',
                   APP_ENV='staging', APP_DEBUG='false', APP_KEY=key, APP_URL='https://rehearsal.invalid',
                   DB_CONNECTION='pgsql', DB_HOST='127.0.0.1', DB_PORT=str(port), DB_DATABASE=db, DB_USERNAME='ot_bootstrap', DB_PASSWORD=bootstrap,
                   CACHE_STORE='array', SESSION_DRIVER='array', LOG_CHANNEL='stderr')

        def sql(query, connection_env=None, allowed=(0,)):
            return run([args.pg_bin/'psql', '-X', '-v', 'ON_ERROR_STOP=1', '-At'], connection_env or env, input=query, allowed=allowed)

        sql('CREATE DATABASE '+db)
        env['PGDATABASE'] = db
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
            sql('CREATE ROLE legacy_runtime LOGIN NOSUPERUSER; GRANT USAGE ON SCHEMA public TO legacy_runtime; GRANT ALL ON ALL TABLES IN SCHEMA public TO legacy_runtime;')
            check(mode+'_exact_54_migration_baseline', sql('SELECT count(*) FROM migrations').stdout.strip() == '54')
        ledger = sql('SELECT migration FROM migrations ORDER BY migration').stdout.splitlines() if mode == 'upgrade' else []
        fingerprint_sql = "SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')) FROM users t; SELECT md5(coalesce(string_agg(to_jsonb(t)::text,'|' ORDER BY id),'')) FROM employees t;"
        before = sql(fingerprint_sql).stdout if mode == 'upgrade' else None
        target = dict(database=db, host='127.0.0.1', port=str(port), system_identifier=sql('SELECT system_identifier FROM pg_control_system()').stdout.strip(),
                      bootstrap_role='ot_bootstrap', source_sha=report['source_sha'], app_key_sha256=hashlib.sha256(key.encode()).hexdigest(), expected_migrations=ledger,
                      retired_runtime_roles=['legacy_runtime'] if mode == 'upgrade' else [])
        roles = ['kirion_g1b_migrator', 'kirion_g1b_app', 'kirion_g1b_custody', 'n03_stage', 'n03_command', 'n03_reconcile', 'n03_reader']
        credentials = {role: secrets.token_hex(32) for role in roles}
        private_values.extend(credentials.values())
        manifest_file, credentials_file = root/'target.json', root/'credentials.json'
        credentials_file.write_text(json.dumps(credentials))
        credentials_file.chmod(0o600)

        def install(manifest, expected=0, extra_env=None):
            manifest_file.write_text(json.dumps(manifest))
            manifest_file.chmod(0o600)
            return run([php, 'artisan', 'deploy:persistent', manifest_file, credentials_file], extra_env or env, allowed=(expected,))

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
        invalid = dict(target, retired_runtime_roles=['ot_bootstrap'])
        check(mode+'_late_failure_rolls_back', install(invalid, 1).returncode == 1)
        check(mode+'_rollback_roles', sql("SELECT count(*) FROM pg_roles WHERE rolname LIKE 'kirion_g1b_%' OR rolname LIKE 'n03_%'").stdout.strip() == '0')
        check(mode+'_rollback_custody', sql("SELECT to_regnamespace('legacy_custody') IS NULL").stdout.strip() == 't')
        check(mode+'_rollback_ledger', int(sql('SELECT count(*) FROM migrations').stdout.strip()) == len(ledger))
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
        for name, query in [('ddl','CREATE TABLE public.forbidden(id int)'), ('audit_update','UPDATE public.audit_logs SET action=action WHERE false'), ('custody_read','SELECT * FROM legacy_custody.operations'), ('migration_write',"DELETE FROM public.migrations WHERE false"), ('owner_escalation','SET ROLE kirion_g1b_owner')]:
            check(mode+'_runtime_denies_'+name, sql(query, runtime, allowed=(3,)).returncode == 3)
        reader = dict(env, PGUSER='n03_reader', PGPASSWORD=credentials['n03_reader'])
        check(mode+'_reader_denies_mfa', sql('SELECT mfa_secret FROM public.users', reader, allowed=(3,)).returncode == 3)
        if mode == 'upgrade':
            check(mode+'_legacy_runtime_revoked', sql("SELECT NOT has_table_privilege('legacy_runtime','public.users','UPDATE')").stdout.strip() == 't')
        target['expected_migrations'] = sql('SELECT migration FROM migrations ORDER BY migration').stdout.splitlines()
        check(mode+'_idempotent_rerun', '"status":"INSTALLED"' in install(target).stdout)
        check(mode+'_no_credential_rotation', sql('SELECT 1', runtime).stdout.strip() == '1')
        check(mode+'_all_tables_owner', sql("SELECT count(*)=0 FROM pg_tables t JOIN pg_class c ON c.oid=to_regclass(format('%I.%I',t.schemaname,t.tablename)) WHERE t.schemaname IN ('public','legacy_custody') AND c.relowner<>'kirion_g1b_owner'::regrole").stdout.strip()=='t')
    finally:
        if started:
            run([args.pg_bin/'pg_ctl','-D',data,'-m','fast','-w','stop'],env)
        for path in [root/'target.json',root/'credentials.json']:
            path.unlink(missing_ok=True)
        (args.output/'persistent-rehearsal.json').write_text(json.dumps(report,indent=2))

print('Persistent fresh/upgrade qualification PASS:',len(report['checks']),'checks')
