<?php

declare(strict_types=1);

// Dedicated subprocess worker: a real second Laravel process and PostgreSQL backend.
// The A worker holds the row lock before executing close while B blocks on it.
// No emulated or sequential second attempt is accepted as race evidence.
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\TransactionWorkflowService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

[$script, $mode, $transactionId, $userId, $dir] = $argv + [null, null, null, null, null];
if (getenv('APP_ENV') !== 'testing'
    || getenv('OPS009_DISPOSABLE_CI') !== '1'
    || getenv('DB_DATABASE') !== 'talibon_portal_test'
    || ! in_array($mode, ['A', 'B'], true)
    || ! is_dir((string) $dir)) {
    fwrite(STDERR, "OPS009 worker safety guard refused execution\n");
    exit(90);
}

$connection = DB::connection('pgsql');
$actor = User::query()->findOrFail((int) $userId);
Auth::login($actor);
$meta = $connection->selectOne("SELECT pg_backend_pid() AS pid, txid_current()::text AS txid, current_database() AS db, current_setting('server_version_num') AS version");
$record = [
    'mode' => $mode,
    'backend_pid' => (int) $meta->pid,
    'transaction_id' => (string) $meta->txid,
    'database' => (string) $meta->db,
    'version' => (string) $meta->version,
    'success' => false,
    'exception' => null,
];
file_put_contents($dir.'/'.$mode.'.ready', json_encode($record, JSON_THROW_ON_ERROR));

try {
    if ($mode === 'A') {
        $connection->beginTransaction();
        $connection->selectOne('SELECT id FROM transactions WHERE id = ? FOR UPDATE', [(int) $transactionId]);
        file_put_contents($dir.'/A.locked', '1');
        $deadline = microtime(true) + 25;
        while (! file_exists($dir.'/A.release') && microtime(true) < $deadline) {
            usleep(20000);
        }
        if (! file_exists($dir.'/A.release')) {
            throw new RuntimeException('Timed out waiting for confirmed B lock contention');
        }
    } else {
        $deadline = microtime(true) + 15;
        while (! file_exists($dir.'/A.locked') && microtime(true) < $deadline) {
            usleep(20000);
        }
        if (! file_exists($dir.'/A.locked')) {
            throw new RuntimeException('A never acquired its transaction row lock');
        }
    }

    app(TransactionWorkflowService::class)->transitionWithEvent(
        $actor,
        WorkflowTransaction::query()->findOrFail((int) $transactionId),
        'close',
        remarks: 'Synthetic completed under concurrent load.',
    );
    if ($mode === 'A') {
        $connection->commit();
    }
    $record['success'] = true;
} catch (Throwable $e) {
    if ($connection->transactionLevel() > 0) {
        $connection->rollBack();
    }
    $record['exception'] = get_class($e);
    $record['message'] = mb_substr($e->getMessage(), 0, 200);
}
file_put_contents($dir.'/'.$mode.'.result.json', json_encode($record, JSON_THROW_ON_ERROR));
exit(0);
