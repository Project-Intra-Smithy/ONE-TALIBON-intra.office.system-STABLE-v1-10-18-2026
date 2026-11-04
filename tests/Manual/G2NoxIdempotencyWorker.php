<?php

declare(strict_types=1);

use App\PlanCustody\Contracts\CustodySecurityGate;
use App\PlanCustody\Data\CustodySecurityContext;
use App\PlanCustody\Data\StageGeneration;
use App\PlanCustody\PlanCustodyService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (DB::getDriverName() !== 'pgsql'
    || DB::scalar('select current_database()') !== 'talibon_portal_test'
    || (int) DB::scalar("select current_setting('server_version_num')") < 160000
    || count($argv) !== 8) {
    fwrite(STDERR, "G2_NOX_DISPOSABLE_WORKER_GUARD_FAILED\n");
    exit(2);
}

[, $source, $key, $actor, $office, $service, $barrier, $worker] = $argv;
$app->instance(CustodySecurityGate::class, new class implements CustodySecurityGate
{
    public function allows(CustodySecurityContext $context): bool
    {
        return true;
    }
});

file_put_contents($barrier.'.ready.'.$worker, 'ready');
$deadline = microtime(true) + 15;
while (! is_file($barrier.'.go')) {
    if (microtime(true) > $deadline) {
        fwrite(STDERR, "G2_NOX_BARRIER_TIMEOUT\n");
        exit(3);
    }
    usleep(10_000);
}

try {
    $generation = app(PlanCustodyService::class)->stage(new StageGeneration(
        $source,
        'application/pdf',
        filesize($source),
        hash_file('sha256', $source),
        $key,
        $service,
        new CustodySecurityContext($actor, $office, 1, 1, 'synthetic-fence'),
    ));
    fwrite(STDOUT, 'SUCCESS generation='.$generation->generation_id."\n");
    exit(0);
} catch (Throwable $exception) {
    fwrite(STDOUT, 'DENIED type='.$exception::class.' message='.$exception->getMessage()."\n");
    exit(4);
}
