import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import path from 'node:path';
import { readdirSync } from 'node:fs';
import { execFileSync, spawn } from 'node:child_process';

assert.equal(process.env.PHASE_A_DISPOSABLE, '1', 'Explicit disposable runtime opt-in required');
assert.equal(process.env.DB_HOST, '127.0.0.1');
assert.equal(process.env.DB_DATABASE, 'talibon_portal_test');
assert.ok(process.env.GITHUB_ACTIONS === 'true' || process.env.PHASE_A_DISPOSABLE_PGDATA, 'Hosted disposable service or exact local temporary PGDATA required');
const suffix = crypto.randomBytes(5).toString('hex');
const env = { ...process.env, APP_ENV: 'testing', APP_KEY: `base64:${crypto.randomBytes(32).toString('base64')}`, SESSION_DRIVER: 'file', CACHE_STORE: 'array', APP_URL: 'http://127.0.0.1:8076', LOG_CHANNEL: 'single', PHASE_A_CANONICAL_URL: 'http://127.0.0.1:8076', PHASE_A_CANONICAL_LOGIN: `qa.phasea.${suffix}`, PHASE_A_HEAD_LOGIN: `qa.phasea.head.${suffix}`, PHASE_A_CANONICAL_PASSWORD: crypto.randomBytes(24).toString('base64url'), PHASE_A_HEAD_MFA_SECRET: [...crypto.randomBytes(32)].map(value => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[value % 32]).join('') };
const frozen=JSON.parse((await import('node:fs')).readFileSync('storage/app/qa/phase-a-qualification/2b096d74cabe-2026-11-26T07-40-00-670Z/results.json'));assert.equal(frozen.completed,true);assert.equal(frozen.passed,true);assert.equal(frozen.sourceWorktreeDirty,false);assert.equal(execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),frozen.sourceSha);assert.equal(crypto.createHash('sha256').update((await import('node:fs')).readFileSync('public/build/manifest.json')).digest('hex'),frozen.buildManifestSha256);
const php = code => execFileSync('php', ['-r', code], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const bootstrap = "require 'vendor/autoload.php'; $app=require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); ";
php(bootstrap + `if (getenv('APP_ENV')!=='testing' || getenv('DB_HOST')!=='127.0.0.1' || getenv('DB_DATABASE')!=='talibon_portal_test' || Illuminate\\Support\\Facades\\DB::connection()->getDriverName()!=='pgsql') exit(2);
    $directory=Illuminate\\Support\\Facades\\DB::selectOne('show data_directory')->data_directory;
    if(getenv('GITHUB_ACTIONS')!=='true' && str_replace('\\\\','/',realpath($directory))!==str_replace('\\\\','/',realpath(getenv('PHASE_A_DISPOSABLE_PGDATA'))))exit(3);
    echo 'DISPOSABLE_PG16_CONFIRMED';`);
const guarded = new Set(['2026_11_19_200000_create_legacy_custody_foundation.php', '2026_11_20_010000_extend_legacy_custody_g2b_command_provenance.php', '2026_11_20_020000_create_legacy_custody_k2_tombstones.php', '2026_11_20_030000_create_legacy_custody_g3_g5_extensions.php', '2026_11_22_150000_ops009_close_command_compatibility.php', '2026_11_22_170000_ops009_g2b_close_audit_compatibility.php', '2026_11_22_190000_ops009_r3_close_audit_provenance.php', '2026_11_22_191000_ops009_r3_origin_notice_effect.php', '2026_11_23_020000_ops009_origin_delivery_exception_queue.php']);
const migrations = readdirSync('database/migrations').filter(file => file.endsWith('.php') && !guarded.has(file)).sort();
execFileSync('php', ['artisan', 'migrate', '--force', '--no-interaction', ...migrations.map(file => `--path=database/migrations/${file}`)], { env, stdio: 'pipe' });
php(bootstrap + `
    if(App\\Models\\User::query()->where('username',getenv('PHASE_A_CANONICAL_LOGIN'))->exists())exit(4);
    $origin=App\\Models\\Department::firstOrCreate(['code'=>'QAPHASEA'],['name'=>'Synthetic Phase A Origin','short_name'=>'QA Origin','branch'=>'executive','office_type'=>'executive_office','is_active'=>true,'is_routable'=>true]);
    $mpdo=App\\Models\\Department::firstOrCreate(['code'=>'MPDO'],['name'=>'Synthetic MPDO Test Office','short_name'=>'Synthetic MPDO','branch'=>'executive','office_type'=>'executive_office','is_active'=>true,'is_routable'=>true]);
    foreach([['login'=>getenv('PHASE_A_CANONICAL_LOGIN'),'role'=>'employee','office'=>$origin],['login'=>getenv('PHASE_A_HEAD_LOGIN'),'role'=>'department_head','office'=>$mpdo]] as $actor){
        $u=App\\Models\\User::create(['name'=>'Synthetic Phase A '.$actor['role'],'username'=>$actor['login'],'password'=>getenv('PHASE_A_CANONICAL_PASSWORD'),'role'=>$actor['role'],'is_active'=>true,'account_status'=>'active']);
        App\\Models\\Employee::create(['employee_number'=>strtoupper($actor['login']),'full_name'=>$u->name,'user_id'=>$u->id,'department_id'=>$actor['office']->id,'position_title'=>'Synthetic Test '.$actor['role'],'employment_status'=>'active']);
        if($actor['role']==='department_head')$u->forceFill(['mfa_secret'=>getenv('PHASE_A_HEAD_MFA_SECRET'),'mfa_confirmed_at'=>now(),'mfa_version'=>1])->save();
    }
    app(App\\Services\\Planning\\PlanningSuiteInitializer::class)->seedReferenceSamples(true);
    echo 'SYNTHETIC_CANONICAL_ACTORS_READY';`);
const server = spawn('php', ['-d','max_execution_time=120','-S', '127.0.0.1:8076', '-t', '.', path.resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: path.resolve('public'), env, stdio: 'ignore', windowsHide: true });
try {
    let ready = false;const deadline=Date.now()+180000;
    for (let attempt = 0; attempt < 120 && Date.now()<deadline; attempt++) {
        try { const response = await fetch(`${env.APP_URL}/login`,{signal:AbortSignal.timeout(5000)}); if (response.ok && (await response.text()).includes('data-page')) { ready = true; break; } } catch {}
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'Disposable Laravel runtime did not become ready');
    await new Promise((resolve, reject) => {
        const test = spawn(process.execPath, ['storage/app/qa/canonical-final-2b-browser.mjs'], { env, stdio: 'inherit', windowsHide: true });
        test.on('error', reject);
        test.on('exit', code => code === 0 ? resolve() : reject(new Error(`Canonical browser validation failed (${code})`)));
    });
} finally { server.kill(); }
