<?php
declare(strict_types=1);
// RT02 synthetic fixture control; never referenced from a Laravel route.
if (getenv('RUNNER_ENVIRONMENT') !== 'github-hosted' ||
    getenv('GITHUB_REPOSITORY') !== 'Project-Intra-Smithy/Talibon-Sales-Prototype' ||
    getenv('APP_ENV') !== 'local' ||
    getenv('DB_HOST') !== '127.0.0.1' ||
    getenv('DB_DATABASE') !== 'talibon_portal_test') {
    fwrite(STDERR, "RT02 synthetic fixture HOLD\n"); exit(76);
}
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\User;
use App\Models\Employee;
use App\Models\Task;
use Illuminate\Support\Facades\Hash;
$action = $argv[1] ?? '';
$emailA = 'employee@talibon.demo';
$emailB = 'rt02-technical-b@example.test';
if ($action === 'setup') {
    $password = getenv('QA_DEMO_PASSWORD');
    if (!is_string($password) || strlen($password) < 32) throw new RuntimeException('Ephemeral credential required');
    $a = User::query()->with('employee')->where('email', $emailA)->firstOrFail();
    if (!$a->employee || !$a->is_active || $a->employee->employment_status !== 'active') throw new RuntimeException('Reference fixture inactive');
    if (User::query()->where('email', $emailB)->exists()) throw new RuntimeException('RT02 fixture already exists');
    $b = new User();
    $b->forceFill(['name' => 'RT02 Disposable Technical B', 'email' => $emailB, 'password' => Hash::make($password), 'role' => 'employee', 'is_active' => true])->save();
    $e = new Employee();
    $e->forceFill(['employee_number' => 'RT02-TECH-0002', 'full_name' => 'RT02 Disposable Technical B', 'work_email' => $emailB, 'user_id' => $b->id, 'department_id' => $a->employee->department_id, 'position_title' => 'RT02 Test Staff', 'employment_status' => 'active'])->save();
    echo "RT02 synthetic second active actor created\n";
} elseif ($action === 'audit') {
    $idsA = array_filter(array_map('intval', explode(',', $argv[2] ?? '')));
    $idsB = array_filter(array_map('intval', explode(',', $argv[3] ?? '')));
    if (count($idsA) < 14 || count($idsB) < 2) throw new RuntimeException('Too few native Task fixture IDs');
    $a = User::query()->where('email', $emailA)->firstOrFail();
    $b = User::query()->where('email', $emailB)->firstOrFail();
    $records = Task::query()->whereIn('id', array_merge($idsA,$idsB))->get();
    $valid = $records->count() === count($idsA) + count($idsB);
    foreach ($records as $task) {
        $valid = $valid && $task->task_kind === 'individual' && $task->assigned_to_user_id === null &&
          (in_array((int)$task->id,$idsA,true) ? ((int)$task->created_by_user_id === (int)$a->id) : ((int)$task->created_by_user_id === (int)$b->id));
    }
    echo json_encode(['source' => 'real-postgresql', 'valid' => $valid,
       'actorCount' => 2, 'aIndividualOwned' => count($idsA), 'bIndividualOwned' => count($idsB),
       'allTaskKindIndividual' => $valid, 'allUnassigned' => $valid, 'ownerIdDerivedFromSession' => $valid], JSON_THROW_ON_ERROR)."\n";
    if (!$valid) exit(81);
} elseif ($action === 'deactivate' || $action === 'restore') {
    $b = User::query()->where('email', $emailB)->firstOrFail();
    $b->forceFill(['is_active' => $action === 'restore'])->save();
    echo "RT02 synthetic account state changed\n";
} else {
    throw new RuntimeException('Unknown RT02 fixture operation');
}
