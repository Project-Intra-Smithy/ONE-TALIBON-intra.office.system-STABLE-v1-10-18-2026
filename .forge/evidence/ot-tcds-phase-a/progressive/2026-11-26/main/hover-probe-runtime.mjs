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
const env = { ...process.env, APP_ENV: 'testing', APP_KEY: `base64:${crypto.randomBytes(32).toString('base64')}`, SESSION_DRIVER: 'file', CACHE_STORE: 'array', APP_URL: 'http://127.0.0.1:8077', LOG_CHANNEL: 'single', PHASE_A_CANONICAL_URL: 'http://127.0.0.1:8077', PHASE_A_CANONICAL_LOGIN: `qa.phasea.${suffix}`, PHASE_A_HEAD_LOGIN: `qa.phasea.head.${suffix}`, PHASE_A_CANONICAL_PASSWORD: crypto.randomBytes(24).toString('base64url'), PHASE_A_HEAD_MFA_SECRET: [...crypto.randomBytes(32)].map(value => 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[value % 32]).join('') };
assert.equal(crypto.createHash('sha256').update((await import('node:fs')).readFileSync('public/build/manifest.json')).digest('hex'),'b9e891fec0282ca7e531587ce25ceb9c9b9e7d3fb6064bb45301c8868791c467');
env.PHASE_A_ADMIN_LOGIN=`qa.phasea.admin.${suffix}`; env.PHASE_A_MAYOR_LOGIN=`qa.phasea.mayor.${suffix}`;
const php = code => execFileSync('php', ['-r', code], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
const bootstrap = "require 'vendor/autoload.php'; $app=require 'bootstrap/app.php'; $app->make(Illuminate\\Contracts\\Console\\Kernel::class)->bootstrap(); ";
php(bootstrap + `if (getenv('APP_ENV')!=='testing' || getenv('DB_HOST')!=='127.0.0.1' || getenv('DB_DATABASE')!=='talibon_portal_test' || Illuminate\\Support\\Facades\\DB::connection()->getDriverName()!=='pgsql') exit(2);
    $directory=Illuminate\\Support\\Facades\\DB::selectOne('show data_directory')->data_directory;
    if(getenv('GITHUB_ACTIONS')!=='true' && str_replace('\\\\','/',realpath($directory))!==str_replace('\\\\','/',realpath(getenv('PHASE_A_DISPOSABLE_PGDATA'))))exit(3);
    if((int)Illuminate\\Support\\Facades\\DB::selectOne("select current_setting('server_version_num')::int as version")->version<160000 || (int)Illuminate\\Support\\Facades\\DB::selectOne("select current_setting('server_version_num')::int as version")->version>=170000)exit(5);
    echo 'DISPOSABLE_PG16_CONFIRMED';`);
const guarded = new Set(['2026_11_19_200000_create_legacy_custody_foundation.php', '2026_11_20_010000_extend_legacy_custody_g2b_command_provenance.php', '2026_11_20_020000_create_legacy_custody_k2_tombstones.php', '2026_11_20_030000_create_legacy_custody_g3_g5_extensions.php', '2026_11_22_150000_ops009_close_command_compatibility.php', '2026_11_22_170000_ops009_g2b_close_audit_compatibility.php', '2026_11_22_190000_ops009_r3_close_audit_provenance.php', '2026_11_22_191000_ops009_r3_origin_notice_effect.php', '2026_11_23_020000_ops009_origin_delivery_exception_queue.php']);
const migrations = readdirSync('database/migrations').filter(file => file.endsWith('.php') && !guarded.has(file)).sort();
execFileSync('php', ['artisan', 'migrate', '--force', '--no-interaction', ...migrations.map(file => `--path=database/migrations/${file}`)], { env, stdio: 'pipe' });
php(bootstrap + `
    if(App\\Models\\User::query()->where('username',getenv('PHASE_A_CANONICAL_LOGIN'))->exists())exit(4);
    $origin=App\\Models\\Department::firstOrCreate(['code'=>'QAPHASEA'],['name'=>'Synthetic Phase A Origin','short_name'=>'QA Origin','branch'=>'executive','office_type'=>'executive_office','is_active'=>true,'is_routable'=>true]);
    $mpdo=App\\Models\\Department::firstOrCreate(['code'=>'MPDO'],['name'=>'Synthetic MPDO Test Office','short_name'=>'Synthetic MPDO','branch'=>'executive','office_type'=>'executive_office','is_active'=>true,'is_routable'=>true]);
    $mayor=App\\Models\\Department::firstOrCreate(['code'=>'MAYOR'],['name'=>'Synthetic Mayor Office','short_name'=>'Synthetic Mayor','branch'=>'executive','office_type'=>'executive_office','is_active'=>true,'is_routable'=>true]);
    foreach([['login'=>getenv('PHASE_A_CANONICAL_LOGIN'),'role'=>'employee','office'=>$origin],['login'=>getenv('PHASE_A_HEAD_LOGIN'),'role'=>'department_head','office'=>$mpdo],['login'=>getenv('PHASE_A_ADMIN_LOGIN'),'role'=>'system_admin','office'=>$mayor],['login'=>getenv('PHASE_A_MAYOR_LOGIN'),'role'=>'mayor_approver','office'=>$mayor]] as $actor){
        $u=App\\Models\\User::create(['name'=>'Synthetic Phase A '.$actor['role'],'username'=>$actor['login'],'password'=>getenv('PHASE_A_CANONICAL_PASSWORD'),'role'=>$actor['role'],'is_active'=>true,'account_status'=>'active']);
        App\\Models\\Employee::create(['employee_number'=>strtoupper($actor['login']),'full_name'=>$u->name,'user_id'=>$u->id,'department_id'=>$actor['office']->id,'position_title'=>'Synthetic Test '.$actor['role'],'employment_status'=>'active']);
        if($actor['role']!=='employee')$u->forceFill(['mfa_secret'=>getenv('PHASE_A_HEAD_MFA_SECRET'),'mfa_confirmed_at'=>now(),'mfa_version'=>1])->save();
    }
    app(App\\Services\\Planning\\PlanningSuiteInitializer::class)->seedReferenceSamples(true);
    echo 'SYNTHETIC_CANONICAL_ACTORS_READY';`);
if (process.env.PHASE_A_QUALIFICATION === '1') {
    env.PHASE_A_ENROLL_LOGIN=`qa.enroll.${suffix}`;
    env.PHASE_A_FIXTURES = php(bootstrap + `
        $owner=App\\Models\\User::where('username',getenv('PHASE_A_CANONICAL_LOGIN'))->firstOrFail();
        $head=App\\Models\\User::where('username',getenv('PHASE_A_HEAD_LOGIN'))->firstOrFail();
        $mayor=App\\Models\\User::where('username',getenv('PHASE_A_MAYOR_LOGIN'))->firstOrFail();
        $suffix=bin2hex(random_bytes(5));
        $enrolling=App\\Models\\User::create(['name'=>'Synthetic enrollment actor','username'=>getenv('PHASE_A_ENROLL_LOGIN'),'password'=>getenv('PHASE_A_CANONICAL_PASSWORD'),'role'=>'department_head','is_active'=>true,'account_status'=>'active']);
        App\\Models\\Employee::create(['employee_number'=>'QA-ENROLL-'.$suffix,'full_name'=>$enrolling->name,'user_id'=>$enrolling->id,'department_id'=>$head->employee->department_id,'position_title'=>'Synthetic enrollment actor','employment_status'=>'active']);
        $staff=App\\Models\\User::create(['name'=>'Synthetic qualification delegate '.$suffix,'username'=>'qa.delegate.'.$suffix,'password'=>getenv('PHASE_A_CANONICAL_PASSWORD'),'role'=>'department_staff','is_active'=>true,'account_status'=>'active']);
        $staffEmployee=App\\Models\\Employee::create(['employee_number'=>'QA-DELEGATE-'.$suffix,'full_name'=>$staff->name,'user_id'=>$staff->id,'department_id'=>$head->employee->department_id,'position_title'=>'Synthetic qualification delegate','employment_status'=>'active']);
        $law=App\\Models\\LegislativeRecord::create(['record_type'=>'ordinance','record_number'=>'QA-LAW-'.$suffix,'title'=>'Synthetic qualification ordinance','summary'=>'Synthetic non-operational record.','year'=>2026,'status'=>'active','issuing_body'=>'Synthetic test body','created_by_user_id'=>$mayor->id]);
        $travel=App\\Models\\TravelOrder::create(['reference_number'=>'QA-TO-'.$suffix,'issuance_date'=>today(),'purpose'=>'Synthetic qualification travel','destination'=>'Synthetic destination','department_id'=>$owner->employee->department_id,'travel_start_date'=>today(),'travel_end_date'=>today(),'status'=>'approved','recorded_by_user_id'=>$mayor->id]);
        $travel->issuedTo()->attach($owner->employee->id);
        $memo=App\\Models\\Memorandum::create(['memo_number'=>'QA-MEMO-'.$suffix,'title'=>'Synthetic qualification memorandum','body'=>'Synthetic non-operational memorandum.','issued_by_user_id'=>$mayor->id,'issued_by_department_id'=>$mayor->employee->department_id,'audience_type'=>'employees','classification'=>'internal','status'=>'published','requires_acknowledgement'=>true,'published_at'=>now()]);
        App\\Models\\MemoRecipient::create(['memorandum_id'=>$memo->id,'user_id'=>$owner->id,'delivered_at'=>now()]);
        $correspondence=App\\Models\\CorrespondenceRecord::create(['public_id'=>(string)Illuminate\\Support\\Str::uuid(),'external_reference_no'=>'QA-COR-'.$suffix,'source'=>'external','sender_name'=>'Synthetic sender','subject'=>'Synthetic qualification correspondence','received_at'=>now(),'receiving_department_id'=>$owner->employee->department_id,'classification'=>'internal','lifecycle_state'=>'received']);
        App\\Models\\Asset::create(['property_number'=>'QA-ASSET-'.$suffix,'qr_value'=>'QA-QR-'.$suffix,'category'=>'Synthetic equipment','description'=>'Synthetic qualification asset','current_department_id'=>$owner->employee->department_id]);
        echo json_encode(['employee'=>$owner->employee->id,'law'=>$law->id,'travel'=>$travel->public_id,'memo'=>$memo->id,'correspondence'=>$correspondence->public_id,'delegateEmployee'=>$staffEmployee->id,'delegateName'=>$staff->name]);`);
}
const server = spawn('php', ['-d', 'max_execution_time=120', '-S', '127.0.0.1:8077', '-t', '.', path.resolve('vendor/laravel/framework/src/Illuminate/Foundation/resources/server.php')], { cwd: path.resolve('public'), env, stdio: 'ignore', windowsHide: true });
try {
    let ready = false;
    const deadline = Date.now() + 180000;
    for (let attempt = 0; attempt < 120 && Date.now() < deadline; attempt++) {
        try { const response = await fetch(`${env.APP_URL}/login`, {signal:AbortSignal.timeout(5000)}); if (response.ok && (await response.text()).includes('data-page')) { ready = true; break; } } catch {}
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    assert.ok(ready, 'Disposable Laravel runtime did not become ready');
    await new Promise((resolve, reject) => {
        const test = spawn(process.execPath, [process.env.PHASE_A_QUALIFICATION === '1' ? 'storage/app/qa/hover-probe-browser.mjs' : 'tests/Browser/phase-a-accessibility.mjs'], { env, stdio: 'inherit', windowsHide: true });
        test.on('error', reject);
        test.on('exit', code => code === 0 ? resolve() : reject(new Error(`Canonical browser validation failed (${code})`)));
    });
} finally { server.kill(); }
