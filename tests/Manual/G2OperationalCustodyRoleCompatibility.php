<?php

declare(strict_types=1);

/**
 * Disposable-only G2 custody-login harness. Migrations and G1B/G2 grants must
 * already be installed by the bootstrap authority. All rows roll back and the
 * synthetic private object is explicitly removed before exit.
 */

use App\PlanCustody\Contracts\CustodySecurityGate;
use App\PlanCustody\Contracts\ScannerEvidenceVerifier;
use App\PlanCustody\Data\CustodySecurityContext;
use App\PlanCustody\Data\ScanEvidence;
use App\PlanCustody\Data\StageGeneration;
use App\PlanCustody\PlanCustodyService;
use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

require dirname(__DIR__, 2).'/vendor/autoload.php';
$app = require dirname(__DIR__, 2).'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

if (DB::getDriverName() !== 'pgsql'
    || DB::scalar('select current_database()') !== 'talibon_portal_test'
    || DB::scalar('select current_user') !== 'kirion_g1b_custody'
    || (int) DB::scalar("select current_setting('server_version_num')") < 160000) {
    fwrite(STDERR, "TEST_ENVIRONMENT_LEASE_REQUIRED\n");
    exit(2);
}

$app->instance(CustodySecurityGate::class, new class implements CustodySecurityGate
{
    public function allows(CustodySecurityContext $context): bool
    {
        return $context->restoreFenceToken === 'synthetic-external-fence';
    }
});
$app->instance(ScannerEvidenceVerifier::class, new class implements ScannerEvidenceVerifier
{
    public function isTrusted(ScanEvidence $evidence): bool
    {
        return $evidence->scannerIdentity === 'synthetic-trusted-scanner';
    }
});

$path = tempnam(sys_get_temp_dir(), 'g2-custody-role-');
if ($path === false) {
    throw new RuntimeException('Unable to allocate the synthetic custody fixture.');
}
file_put_contents($path, "%PDF-1.7\nsynthetic custody role fixture\n%%EOF");
$locator = null;

DB::beginTransaction();
try {
    $security = new CustodySecurityContext(
        'synthetic-actor', 'synthetic-office', 1, 1, 'synthetic-external-fence',
    );
    $generation = app(PlanCustodyService::class)->stage(new StageGeneration(
        $path,
        'application/pdf',
        filesize($path),
        hash_file('sha256', $path),
        'g2-custody-role-harness-'.Str::uuid(),
        'synthetic-custody-service',
        $security,
    ));
    $locator = $generation->storage_locator;
    $scan = app(PlanCustodyService::class)->recordTrustedScan(
        $generation,
        new ScanEvidence(
            (string) Str::uuid(), 'CLEAN', 'synthetic-trusted-scanner',
            'engine-1', 'signatures-1', $generation->sha256,
            (int) $generation->size_bytes, 'synthetic-signature', new DateTimeImmutable,
        ),
        'synthetic-scanner-service',
    );

    if ($generation->custody_state !== 'QUARANTINED'
        || $scan->decision !== 'CLEAN'
        || ! Storage::disk('plan_custody')->exists($locator)) {
        throw new RuntimeException('Custody-login compatibility assertion failed.');
    }

    fwrite(STDOUT, "PASS custody login staged verified quarantine generation\n");
    fwrite(STDOUT, "PASS custody login appended trusted scan evidence without publication\n");
} finally {
    DB::rollBack();
    if (is_string($locator)) {
        Storage::disk('plan_custody')->delete($locator);
    }
    @unlink($path);
}

fwrite(STDOUT, "G2_CUSTODY_ROLE_COMPATIBILITY_PASS assertions=2\n");
