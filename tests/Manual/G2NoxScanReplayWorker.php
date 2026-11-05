<?php

declare(strict_types=1);

use App\Models\PlanCustodyGeneration;
use App\PlanCustody\Contracts\ScannerEvidenceVerifier;
use App\PlanCustody\Data\ScanEvidence;
use App\PlanCustody\PlanCustodyService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (DB::getDriverName() !== 'pgsql'
    || DB::scalar('select current_database()') !== 'talibon_portal_test'
    || (int) DB::scalar("select current_setting('server_version_num')") < 160000
    || count($argv) !== 7) {
    fwrite(STDERR, "G2_NOX_SCAN_WORKER_GUARD_FAILED\n");
    exit(2);
}

[, $generationId, $evidenceId, $scannedAt, $barrier, $worker, $signature] = $argv;
$app->instance(ScannerEvidenceVerifier::class, new class implements ScannerEvidenceVerifier
{
    public function isTrusted(ScanEvidence $evidence): bool
    {
        return true;
    }
});

$generation = PlanCustodyGeneration::query()->where('generation_id', $generationId)->firstOrFail();
file_put_contents($barrier.'.ready.'.$worker, 'ready');
$deadline = microtime(true) + 15;
while (! is_file($barrier.'.go')) {
    if (microtime(true) > $deadline) {
        fwrite(STDERR, "G2_NOX_SCAN_BARRIER_TIMEOUT\n");
        exit(3);
    }
    usleep(10_000);
}

try {
    $scan = app(PlanCustodyService::class)->recordTrustedScan(
        $generation,
        new ScanEvidence(
            $evidenceId,
            'CLEAN',
            'scanner-a',
            'engine-1',
            'signatures-1',
            $generation->sha256,
            (int) $generation->size_bytes,
            $signature,
            new DateTimeImmutable($scannedAt),
        ),
        'scanner-service',
    );
    fwrite(STDOUT, 'SUCCESS scan='.$scan->evidence_id."\n");
    exit(0);
} catch (Throwable $exception) {
    fwrite(STDOUT, 'DENIED type='.$exception::class.' message='.$exception->getMessage()."\n");
    exit(4);
}
