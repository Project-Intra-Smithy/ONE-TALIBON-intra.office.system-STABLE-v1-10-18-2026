<?php

declare(strict_types=1);

// CI-only synthetic fixture: the real first-admin CLI is covered by the
// PermanentIamLifecycleTest. This never points at a retained or municipal DB.
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (getenv('GITHUB_ACTIONS') !== 'true'
    || getenv('APP_ENV') !== 'testing'
    || getenv('DB_DATABASE') !== 'talibon_portal_test'
    || getenv('DB_HOST') !== '127.0.0.1'
    || DB::connection()->getDriverName() !== 'pgsql') {
    fwrite(STDERR, "IAM browser fixture refuses non-CI/non-test database.\n");
    exit(1);
}

$password = getenv('IAM_QA_ADMIN_PASSWORD');
if (! is_string($password) || strlen($password) < 16
    || DB::table('users')->exists()
    || DB::table('employees')->exists()
    || DB::table('initial_admin_bootstraps')->exists()) {
    fwrite(STDERR, "IAM browser fixture requires strong synthetic credential and empty identity state.\n");
    exit(1);
}

DB::transaction(function () use ($password): void {
    $office = Department::query()->create([
        'code' => 'ADMIN',
        'name' => 'Synthetic CI Administration Office',
        'short_name' => 'Synthetic Admin',
        'branch' => 'executive',
        'office_type' => 'executive_office',
        'sort_order' => 1,
        'is_active' => true,
        'is_routable' => true,
    ]);
    $owner = User::query()->create([
        'name' => 'Synthetic IAM Owner',
        'username' => 'qa.owner',
        'email' => null,
        'password' => $password,
        'role' => 'system_admin',
        'is_active' => true,
        'account_status' => 'active',
    ]);
    Employee::query()->create([
        'employee_number' => 'QA-OWNER',
        'full_name' => 'Synthetic IAM Owner',
        'user_id' => $owner->id,
        'department_id' => $office->id,
        'position_title' => 'Synthetic Administrator',
        'employment_status' => 'active',
    ]);
    DB::table('initial_admin_bootstraps')->insert([
        'id' => 1,
        'user_id' => $owner->id,
        'created_at' => now(),
    ]);
    Employee::query()->create([
        'employee_number' => 'QA-EMP-001',
        'full_name' => 'Synthetic QA Employee',
        'user_id' => null,
        'department_id' => $office->id,
        'position_title' => 'Synthetic Team Lead',
        'employment_status' => 'active',
    ]);
});

fwrite(STDOUT, "Synthetic IAM browser identities prepared in isolated PostgreSQL test database.\n");
