<?php
// Opt-in synthetic PG16 harness. Never point this at a preserved database.
require __DIR__.'/../../vendor/autoload.php';
$app = require __DIR__.'/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use App\Models\{User, Employee, Department, CorrespondenceRecord, Document, DocumentLink};
use App\Services\{DocumentImportAuthorization, DocumentIngestionService};
use App\Data\Documents\DocumentImportIntent;
use Symfony\Component\Process\Process;

if (getenv('AJ136_DISPOSABLE') !== '1' || ! app()->environment('testing')
    || config('database.connections.pgsql.host') !== '127.0.0.1'
    || (string) config('database.connections.pgsql.port') !== '55436'
    || DB::getDatabaseName() !== 'talibon_portal_test'
    || (int) DB::selectOne('show server_version_num')->server_version_num < 160000
    || (int) DB::selectOne('show server_version_num')->server_version_num >= 170000
    || config('filesystems.disks.documents.driver') !== 'local') {
    throw new RuntimeException('Requires explicitly opted-in disposable PG16 on 127.0.0.1:55436/talibon_portal_test.');
}
set_exception_handler(static function (Throwable $e): never { fwrite(STDERR, (string) $e); exit(1); });
$mode = $argv[1] ?? '';
if ($mode === 'worker') {
    [$actorId, $recordId, $key, $revision, $previous, $content, $barrier, $slot] = array_slice($argv, 2);
    $app->instance(DocumentImportAuthorization::class, new class extends DocumentImportAuthorization {
        public function authorize(User $actor, Illuminate\Database\Eloquent\Model $parent, string $classification): void {
            if (! $actor->is_active || (int) $actor->employee->department_id !== (int) $parent->receiving_department_id) {
                throw new Illuminate\Auth\Access\AuthorizationException();
            }
        }
    });
    file_put_contents($barrier.'.'.$slot, 'ready');
    $deadline = microtime(true) + 15;
    while (! file_exists($barrier)) {
        if (microtime(true) > $deadline) throw new RuntimeException('Race barrier timeout');
        usleep(10000);
    }
    try {
        $r = app(DocumentIngestionService::class)->ingest(
            User::findOrFail($actorId), CorrespondenceRecord::findOrFail($recordId),
            Illuminate\Http\UploadedFile::fake()->createWithContent('race.pdf', "%PDF-1.7\n$content\n%%EOF"),
            new DocumentImportIntent($key, 'synthetic', 'race-source', $revision, 'internal', supersedesRevisionId: $previous === '0' ? null : (int) $previous),
        );
        echo json_encode(['id' => $r->id]);
    } catch (Symfony\Component\HttpKernel\Exception\ConflictHttpException $e) {
        echo json_encode(['conflict' => true]);
    }
    exit;
}
if ($mode === 'seed' || $mode === 'race') {
    $tag = Str::lower(Str::random(8));
    $testPassword = Str::random(48);
    $mfaAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    $mfaSecret = '';
    for ($index = 0; $index < 32; $index++) {
        $mfaSecret .= $mfaAlphabet[random_int(0, strlen($mfaAlphabet) - 1)];
    }
    $office = Department::create(['code' => 'AJ136-'.$tag, 'name' => 'Synthetic AJ136 Office', 'short_name' => 'AJ136', 'branch' => 'executive', 'office_type' => 'department', 'is_active' => true, 'is_routable' => true]);
    $actor = User::create(['name' => 'AJ136 Synthetic Tester', 'email' => 'aj136-'.$tag.'@example.test', 'password' => $testPassword, 'role' => 'department_head', 'is_active' => true]);
    Employee::create(['employee_number' => 'AJ136-'.$tag, 'full_name' => $actor->name, 'user_id' => $actor->id, 'department_id' => $office->id, 'position_title' => 'Synthetic test officer', 'employment_status' => 'active']);
    $actor->forceFill(['mfa_secret' => $mfaSecret, 'mfa_confirmed_at' => now(), 'mfa_version' => 1])->save();
    $record = CorrespondenceRecord::create(['public_id' => (string) Str::uuid(), 'external_reference_no' => 'AJ136-'.$tag, 'source' => 'synthetic', 'channel' => 'synthetic', 'sender_name' => 'Synthetic sender', 'subject' => 'AJ136 Synthetic record 00', 'received_at' => now()->subDays(30), 'receiving_department_id' => $office->id, 'classification' => 'internal', 'lifecycle_state' => 'classified']);
}
if ($mode === 'race') {
    $race = function (string $revisionA, string $revisionB, int $previous, string $contentA, string $contentB, bool $sameKey) use ($actor, $record): array {
        $barrier = storage_path('framework/testing/aj136-'.Str::uuid());
        if (! is_dir(dirname($barrier))) mkdir(dirname($barrier), 0700, true);
        $key = (string) Str::uuid();
        $processes = [];
        foreach ([[$revisionA, $contentA], [$revisionB, $contentB]] as $slot => [$revision, $content]) {
            $process = new Process([PHP_BINARY, __FILE__, 'worker', (string) $actor->id, (string) $record->id, $sameKey ? $key : (string) Str::uuid(), $revision, (string) $previous, $content, $barrier, (string) $slot], base_path(), timeout: 30);
            $process->start(); $processes[] = $process;
        }
        $deadline = microtime(true) + 20;
        while (! file_exists($barrier.'.0') || ! file_exists($barrier.'.1')) {
            if (microtime(true) > $deadline) throw new RuntimeException('Workers did not reach barrier');
            usleep(10000);
        }
        file_put_contents($barrier, 'go');
        $results = [];
        foreach ($processes as $process) {
            $process->wait();
            if (! $process->isSuccessful()) throw new RuntimeException($process->getErrorOutput().$process->getOutput());
            $results[] = json_decode($process->getOutput(), true, flags: JSON_THROW_ON_ERROR);
        }
        foreach ([$barrier, $barrier.'.0', $barrier.'.1'] as $file) unlink($file);
        return $results;
    };
    $first = $race('r1', 'r1', 0, 'initial', 'initial', true);
    if (! isset($first[0]['id']) || $first[0] !== $first[1]) throw new RuntimeException('Identical replay produced different outcomes: '.json_encode($first));
    $next = $race('r2a', 'r2b', $first[0]['id'], 'next-a', 'next-b', false);
    if (count(array_filter($next, fn ($r) => isset($r['conflict']))) !== 1) throw new RuntimeException('Conflicting successors both succeeded: '.json_encode($next));
    $revisions = App\Models\DocumentImportRevision::where('parent_id', $record->id)->get();
    if ($revisions->count() !== 2 || $revisions->pluck('version_number')->sort()->values()->all() !== [1, 2]) throw new RuntimeException('Invalid lineage');
    echo json_encode(['identical_replay' => $first, 'competing_successors' => $next, 'versions' => [1,2], 'result' => 'PASS']);
} elseif ($mode === 'seed') {
    $download = null;
    for ($i = 0; $i < 27; $i++) {
        $r = $i === 0 ? $record : $record->replicate(['public_id', 'external_reference_no']);
        if ($i > 0) { $r->public_id = (string) Str::uuid(); $r->external_reference_no = 'AJ136-'.$tag.'-'.$i; $r->subject = sprintf('AJ136 Synthetic record %02d', $i); $r->received_at = now()->subDays(30-$i); $r->save(); }
        $bytes = "%PDF-1.7\nAJ136 synthetic file $i\n%%EOF";
        $path = 'aj136/'.$tag.'/'.$i.'.pdf'; Storage::disk('documents')->put($path, $bytes);
        $d = Document::create(['title' => sprintf('AJ136 file %02d', $i), 'original_name' => sprintf('aj136-%02d.pdf', $i), 'document_type' => 'supporting_document', 'classification' => 'internal', 'mime_type' => 'application/pdf', 'size_bytes' => strlen($bytes), 'storage_disk' => 'documents', 'storage_path' => $path, 'checksum_sha256' => hash('sha256', $bytes), 'owner_department_id' => $office->id, 'uploaded_by_user_id' => $actor->id]);
        DocumentLink::create(['document_id' => $d->id, 'linkable_type' => $r->getMorphClass(), 'linkable_id' => $r->id, 'relationship' => 'supporting_document', 'created_by_user_id' => $actor->id]);
        $download ??= $d->public_id;
    }
    echo json_encode([
        'email' => $actor->email,
        'password' => $testPassword,
        'mfa_secret' => $mfaSecret,
        'download' => $download,
        'actor_id' => $actor->id,
    ], JSON_THROW_ON_ERROR);
} else { throw new RuntimeException('Unknown mode'); }
