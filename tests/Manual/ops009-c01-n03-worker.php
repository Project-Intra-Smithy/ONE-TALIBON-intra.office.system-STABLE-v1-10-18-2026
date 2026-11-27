<?php

declare(strict_types=1);

// Witness-only: independent PHP process and real n03_command PostgreSQL session.
// No production or persistent database execution is permitted.
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\User;
use App\Services\Custody\LegacyCustodyCommandService;
use App\Services\TransactionWorkflowService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

[$script, $mode, $transactionId, $userId, $operationId, $dir] = array_pad($argv, 6, null);
if (getenv('GITHUB_ACTIONS') !== 'true'
    || getenv('APP_ENV') !== 'testing'
    || getenv('OPS009_DISPOSABLE_CI') !== '1'
    || getenv('N03_DISPOSABLE_LEASE') !== 'EXCLUSIVE_PG16_SYNTHETIC_ONLY'
    || getenv('N03_G2B_ROLE_SUITE') !== '1'
    || getenv('DB_DATABASE') !== 'talibon_portal_test'
    || ! in_array($mode, ['A', 'B'], true)
    || ! is_dir((string) $dir)
    || ! preg_match('/^[0-9a-f-]{36}$/i', (string) $operationId)
    || (int) $transactionId < 1 || (int) $userId < 1) {
    fwrite(STDERR, "OPS009 C01 worker disposable CI preflight rejected.\n");
    exit(90);
}

foreach ([
    'n03_stage' => 'N03_STAGE_PASSWORD',
    'n03_command' => 'N03_COMMAND_PASSWORD',
    'n03_reconcile' => 'N03_RECONCILE_PASSWORD',
] as $role => $key) {
    $password = getenv($key);
    if (! is_string($password) || $password === '') {
        fwrite(STDERR, "OPS009 C01 worker missing disposable role credential.\n");
        exit(91);
    }
    config([
        "database.connections.{$role}.host" => (string) getenv('DB_HOST'),
        "database.connections.{$role}.port" => (string) getenv('DB_PORT'),
        "database.connections.{$role}.database" => 'talibon_portal_test',
        "database.connections.{$role}.username" => $role,
        "database.connections.{$role}.password" => $password,
    ]);
    DB::purge($role);
}

$connection = DB::connection('n03_command');
$metadata = $connection->selectOne(
    "SELECT session_user AS role, pg_backend_pid() AS pid,
            current_database() AS database_name, current_setting('server_version_num') AS version"
);
if ($metadata->role !== 'n03_command'
    || $metadata->database_name !== 'talibon_portal_test'
    || (int) $metadata->version < 160000 || (int) $metadata->version >= 170000) {
    fwrite(STDERR, "OPS009 C01 worker N03 role/PG16 identity mismatch.\n");
    exit(92);
}

$actor = User::query()->findOrFail((int) $userId);
$record = [
    'mode' => $mode,
    'pid' => (int) $metadata->pid,
    'role' => (string) $metadata->role,
    'database' => (string) $metadata->database_name,
    'success' => false,
    'exception' => null,
    'outcome' => null,
];
file_put_contents($dir.'/'.$mode.'.ready.json', json_encode($record, JSON_THROW_ON_ERROR));

try {
    $outcome = app(LegacyCustodyCommandService::class)->execute(
        operationId: (string) $operationId,
        businessCommand: static fn (
            ConnectionInterface $conn,
            VerifiedCommandActor $verified,
            string $correlation,
        ): ProducedSourceEvent => app(TransactionWorkflowService::class)
            ->transitionWithEventOnConnection(
                $conn, $verified, (int) $transactionId, 'close', $correlation,
                remarks: 'Synthetic N03 simultaneous-close evidence.',
            ),
        expectedSessionVersion: (int) $actor->session_version,
        expectedRole: (string) $actor->role,
        cutPointHook: static function (string $point) use ($mode, $dir, $metadata): void {
            if ($mode !== 'A' || $point !== 'after_business') {
                return;
            }
            // The row mutation and event are uncommitted, and the N03 row
            // lock remains held until the competing real PG session blocks.
            file_put_contents($dir.'/A.locked', (string) $metadata->pid);
            $deadline = microtime(true) + 30;
            while (! file_exists($dir.'/A.release') && microtime(true) < $deadline) {
                usleep(20000);
            }
            if (! file_exists($dir.'/A.release')) {
                throw new RuntimeException('N03 C01 lock barrier timed out; rollback.');
            }
        },
    );
    $record['success'] = true;
    $record['outcome'] = (string) $outcome->outcome;
    $record['event_id'] = (int) $outcome->eventId;
} catch (Throwable $error) {
    $record['exception'] = get_class($error);
    $record['message'] = mb_substr($error->getMessage(), 0, 160);
}
file_put_contents($dir.'/'.$mode.'.result.json', json_encode($record, JSON_THROW_ON_ERROR));
exit(0);
