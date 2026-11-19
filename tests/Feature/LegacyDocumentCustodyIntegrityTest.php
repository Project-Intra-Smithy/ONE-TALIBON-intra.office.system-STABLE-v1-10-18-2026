<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\AuditLogger;
use App\Services\DocumentAccessService;
use App\Services\DocumentAttachmentService;
use App\Services\LegacyDocumentBytes;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;
use Tests\TestCase;

final class LegacyDocumentCustodyIntegrityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        config(['messaging_release.restricted_uat' => false]);
        // Laravel's fake here is a disposable real local filesystem adapter.
        $syntheticDisk = Storage::fake('documents');
        config(['filesystems.disks.documents.root' => rtrim($syntheticDisk->path(''), '/')]);
    }

    public static function invalidDescriptors(): array
    {
        return [
            'same-size tamper' => ['tamper'],
            'wrong size' => ['size'],
            'wrong hash' => ['hash'],
            'missing size' => ['missing-size'],
            'missing hash' => ['missing-hash'],
            'missing disk' => ['missing-disk'],
            'missing path' => ['missing-path'],
            'wrong disk' => ['wrong-disk'],
            'traversal' => ['traversal'],
            'over cap' => ['cap'],
            'missing object' => ['missing-object'],
            'file symlink' => ['symlink'],
            'directory symlink' => ['directory-symlink'],
            'hardlink' => ['hardlink'],
            'directory object' => ['directory'],
        ];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('invalidDescriptors')]
    public function test_integrity_failure_masks_byte_paths_and_retains_other_bytes(string $state): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        // Physical-alias tests use identical bytes deliberately: digest alone
        // must not allow a symlink or hardlink, even with matching metadata.
        $otherBytes = in_array($state, ['symlink', 'hardlink', 'directory-symlink'], true)
            ? $this->pdf() : str_replace('page one', 'page TWO', $this->pdf());
        $disk->put($other->storage_path, $otherBytes);
        $other->update(['checksum_sha256' => hash('sha256', $otherBytes)]);
        $path = $disk->path($document->storage_path);
        $otherPath = $disk->path($other->storage_path);
        switch ($state) {
            case 'tamper': $disk->put($document->storage_path, $otherBytes); break;
            case 'size': $document->update(['size_bytes' => strlen($this->pdf()) + 1]); break;
            case 'hash': $document->update(['checksum_sha256' => str_repeat('a', 64)]); break;
            case 'missing-size': $document->update(['size_bytes' => null]); break;
            case 'missing-hash': $document->update(['checksum_sha256' => null]); break;
            case 'missing-disk': $document->update(['storage_disk' => '']); break;
            case 'missing-path': $document->update(['storage_path' => null]); break;
            case 'wrong-disk': $document->update(['storage_disk' => 'public']); break;
            case 'traversal': $document->update(['storage_path' => '2026/11/../11/'.basename($path)]); break;
            case 'cap': config(['documents.max_upload_mb' => 0]); break;
            case 'missing-object': unlink($path); break;
            case 'symlink': unlink($path); $this->assertTrue(symlink($otherPath, $path)); break;
            case 'hardlink': unlink($path); $this->assertTrue(link($otherPath, $path)); break;
            case 'directory': unlink($path); $this->assertTrue(mkdir($path)); break;
            case 'directory-symlink':
                $this->assertTrue(symlink(dirname($otherPath), $disk->path('aliased-dir')));
                $document->update(['storage_path' => 'aliased-dir/'.basename($otherPath)]);
                break;
        }
        $this->actingAs($actor);
        $this->assertSame(! in_array($state, ['missing-disk', 'missing-path', 'wrong-disk'], true),
            app(DocumentAccessService::class)->canDownload($actor, $document));
        try {
            $this->assertOpaque($document);
            $this->assertCleanupRetained($document);
        } finally {
            if ($state === 'directory-symlink') {
                unlink($disk->path('aliased-dir'));
            }
            if (is_link($path)) {
                unlink($path);
            }
        }
        $this->assertSame($otherBytes, $disk->get($other->storage_path));
    }

    public function test_stale_loaded_path_cannot_delete_another_document(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $otherBytes = str_replace('page one', 'page TWO', $this->pdf());
        $disk->put($other->storage_path, $otherBytes);
        $other->update(['checksum_sha256' => hash('sha256', $otherBytes)]);
        $document->storage_path = $other->storage_path;
        try {
            $this->assertCleanupRetained($document);
        } finally {
            $this->assertTrue($disk->exists($other->storage_path), 'Different document blob deleted.');
            $this->assertSame($otherBytes, $disk->get($other->storage_path));
        }
    }

    public function test_persisted_descriptor_drift_retains_original_blob(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        DB::table('documents')->where('id', $document->id)->update(['storage_path' => $other->storage_path]);
        try {
            $this->assertCleanupRetained($document);
        } finally {
            Storage::disk('documents')->assertExists($document->storage_path);
            Storage::disk('documents')->assertExists($other->storage_path);
        }
    }

    public static function aliases(): array
    {
        return [['exact'], ['normalized'], ['plan'], ['disk-alias'], ['parent-segments'], ['backslash']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('aliases')]
    public function test_conflicting_hidden_locator_denies_even_when_hash_matches(string $state): void
    {
        [$actor, , $document] = $this->evidence();
        [$outsider, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $original = $disk->get($document->storage_path);
        $alias = match ($state) {
            'normalized' => '2026//11/./'.basename($document->storage_path),
            'parent-segments' => '2026/11/other/../'.basename($document->storage_path),
            'backslash' => str_replace('/', '\\', $document->storage_path),
            default => $document->storage_path,
        };
        if ($state === 'disk-alias') {
            config(['filesystems.disks.k1_alias' => [
                'driver' => 'local', 'root' => $disk->path(''), 'visibility' => 'private', 'serve' => false,
            ]]);
        }
        $other->update(['storage_path' => $alias, 'storage_disk' => $state === 'disk-alias' ? 'k1_alias' : 'documents']);
        if ($state === 'plan') {
            $other->links()->delete();
            DB::table('documents')->where('id', $other->id)->update(['security_domain' => 'EVER_PLAN']);
        }
        $this->actingAs($actor);
        $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $other->fresh()));
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($original, $disk->get($document->storage_path));
    }

    public static function reverseAliases(): array
    {
        return [['hidden'], ['plan'], ['incorrect-hash'], ['other-local-disk']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('reverseAliases')]
    public function test_other_row_different_name_symlink_denies_target_and_preserves_bytes(string $state): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $bytes = $disk->get($document->storage_path);
        if ($state === 'other-local-disk') {
            $syntheticPlan = Storage::fake('plan_custody');
            config(['filesystems.disks.plan_custody.root' => rtrim($syntheticPlan->path(''), '/')]);
            $aliasDisk = Storage::disk('plan_custody');
            $alias = 'reverse-alias.pdf';
            $other->update(['storage_disk' => 'plan_custody', 'storage_path' => $alias]);
        } else {
            $aliasDisk = $disk;
            $alias = $other->storage_path;
            $disk->delete($alias);
        }
        $aliasPath = $aliasDisk->path($alias);
        $this->assertNotSame(basename($document->storage_path), basename($alias));
        $this->assertTrue(symlink($disk->path($document->storage_path), $aliasPath));
        if ($state === 'plan') {
            $other->links()->delete();
            DB::table('documents')->where('id', $other->id)->update(['security_domain' => 'EVER_PLAN']);
        }
        if ($state === 'incorrect-hash') {
            $other->update(['checksum_sha256' => str_repeat('0', 64)]);
        }
        $this->actingAs($actor);
        try {
            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $other->fresh()));
            $this->assertOpaque($document);
            $this->assertCleanupRetained($document);
        } finally {
            $this->assertTrue(is_link($aliasPath));
            unlink($aliasPath);
            $this->assertSame($bytes, $disk->get($document->storage_path));
        }
        // Once the other row has no physical alias, the target is valid again.
        $this->get($this->url($document))->assertOk()->assertContent($bytes);
    }

    public function test_unauthorized_actor_preserves_forbidden_for_valid_shape(): void
    {
        [, , $document] = $this->evidence();
        [$outsider] = $this->evidence();
        [, , $malformed] = $this->evidence();
        $this->actingAs($outsider);
        Storage::shouldReceive('disk')->never();
        $url = '/documents/'.$document->public_id.'/download';
        $this->get($url)->assertForbidden()->assertHeaderMissing('Content-Disposition');
        $this->head($url)->assertForbidden();
        $this->get($url, ['Range' => 'bytes=0-15'])->assertForbidden()->assertHeaderMissing('Content-Range');
        $malformed->update(['storage_disk' => 'public']);
        $this->assertOpaque($malformed);
    }

    public function test_reverse_different_basename_cleanup_refuses_without_prior_http_check(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $bytes = $disk->get($document->storage_path);
        $disk->delete($other->storage_path);
        $alias = $disk->path($other->storage_path);
        $this->assertTrue(symlink($disk->path($document->storage_path), $alias));
        DB::table('documents')->where('id', $other->id)->update(['checksum_sha256' => null]);
        try {
            $this->assertCleanupRetained($document);
        } finally {
            $this->assertTrue(is_link($alias));
            unlink($alias);
            $this->assertSame($bytes, $disk->get($document->storage_path));
        }
    }

    public function test_catalog_over_bound_and_unmapped_locator_fail_closed(): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $bytes = $disk->get($document->storage_path);
        $this->actingAs($actor);
        $unknown = Document::query()->create(['title' => 'Unmapped locator',
            'storage_disk' => 'k1-unconfigured', 'storage_path' => 'unmapped/other.pdf']);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $unknown->delete();

        // Batch insert only into the isolated test database; no file creation
        // or filesystem traversal is required to exceed the catalog bound.
        $rows = [];
        for ($n = 0; $n < 2049; $n++) {
            $rows[] = ['public_id' => (string) Str::uuid(), 'title' => 'Synthetic catalog bound',
                'storage_disk' => 'documents', 'storage_path' => 'absent/'.Str::uuid().'.pdf'];
            if (count($rows) === 256 || $n === 2048) {
                DB::table('documents')->insert($rows);
                $rows = [];
            }
        }
        $this->assertFalse(app(LegacyDocumentBytes::class)->unambiguousLocator($document));
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($bytes, $disk->get($document->storage_path));
    }

    public function test_d2_catalog_exact_threshold_with_real_disjoint_objects(): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $disk->makeDirectory('capacity');
        $rows = [];
        for ($n = 0; $n < 2048; $n++) {
            $path = 'capacity/'.Str::uuid().'.pdf';
            $disk->put($path, 'synthetic unrelated metadata probe');
            $rows[] = ['public_id' => (string) Str::uuid(), 'title' => 'Synthetic capacity',
                'storage_disk' => 'documents', 'storage_path' => $path];
            if (count($rows) === 256) {
                DB::table('documents')->insert($rows);
                $rows = [];
            }
        }
        $this->assertSame(2049, Document::query()->count());
        $this->actingAs($actor);
        $samples = [];
        for ($i = 0; $i < 3; $i++) {
            $start = hrtime(true);
            $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
            $download = round((hrtime(true) - $start) / 1e6, 2);
            $start = hrtime(true);
            $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
            $samples[] = [$download, round((hrtime(true) - $start) / 1e6, 2)];
        }
        fwrite(STDOUT, 'K1-D2 near-cap serial request ms (2048 other actual objects; download,preview): '.json_encode($samples).PHP_EOL);
    }

    public static function longLocatorLengths(): array
    {
        return [[4095], [4096], [4097]];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('longLocatorLengths')]
    public function test_d2_locator_path_boundary_unprovable_absolute_spelling_retains_bytes(int $length): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $path = substr(str_repeat('segment/', 600), 0, $length - 1).'x';
        $this->assertSame($length, strlen($path));
        Document::query()->create(['title' => 'Synthetic long path',
            'storage_disk' => 'documents', 'storage_path' => $path]);
        $this->actingAs($actor);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($this->pdf(), $disk->get($document->storage_path));
    }

    public function test_d2_long_relative_locator_within_absolute_linux_limit_is_not_an_alias(): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $length = 4095 - strlen($disk->path(''));
        $path = substr(str_repeat(str_repeat('a', 190).'/', 24), 0, $length - 1).'x';
        $this->assertSame(4095, strlen($disk->path($path)));
        Document::query()->create(['title' => 'Synthetic supported long missing locator',
            'storage_disk' => 'documents', 'storage_path' => $path]);
        $this->actingAs($actor);
        $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
        $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
    }

    public static function literalAliasCases(): array
    {
        $cases = [];
        foreach (['foreign-null', 'plan-wrong', 'normalized'] as $state) {
            foreach (['preview', 'download', 'cleanup'] as $action) {
                $cases[$state.'-'.$action] = [$state, $action];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('literalAliasCases')]
    public function test_d2_reverse_literal_and_normalized_aliases(string $state, string $action): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $disk->delete($other->storage_path);
        $literal = 'foreign\\different.pdf';
        $mapped = 'foreign/different.pdf';
        $this->assertFalse(file_exists($disk->path($mapped)));
        $alias = $disk->path($literal);
        if ($state === 'normalized') {
            $disk->makeDirectory('foreign');
            $alias = $disk->path($mapped);
            $this->assertFalse(file_exists($disk->path($literal)));
        }
        $this->assertTrue(symlink($target, $alias));
        $this->assertSame(1, lstat($target)['nlink']);
        $other->update(['storage_path' => $literal, 'checksum_sha256' => $state === 'foreign-null' ? null : str_repeat('0', 64)]);
        if ($state === 'plan-wrong') {
            $other->links()->delete();
            DB::table('documents')->where('id', $other->id)->update(['security_domain' => 'EVER_PLAN']);
        }
        $this->actingAs($actor);
        try {
            if ($action === 'cleanup') {
                $this->assertCleanupRetained($document);
            } else {
                $this->assertOpaque($document, [$action]);
            }
        } finally {
            $this->assertTrue(is_link($alias));
            unlink($alias);
            $this->assertTrue(is_file($target), 'D2 target deleted');
            $this->assertSame($bytes, file_get_contents($target));
        }
    }

    public function test_d2_literal_nonconflicting_locator_preserves_retrieval(): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $literal = 'unrelated\\literal.pdf';
        file_put_contents($disk->path($literal), 'unrelated synthetic bytes');
        $other->update(['storage_path' => $literal]);
        $this->actingAs($actor);
        $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
        $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
        $this->assertSame('unrelated synthetic bytes', file_get_contents($disk->path($literal)));
    }

    public function test_d2_dormant_framework_s3_has_no_local_mapping_and_is_not_resolved(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->assertSame('s3', config('filesystems.disks.s3.driver'));
        $this->assertEmpty(config('filesystems.disks.s3.bucket'));
        $this->actingAs($actor);
        $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
        $cached = (new \ReflectionProperty(\Illuminate\Filesystem\FilesystemManager::class, 'disks'))
            ->getValue(Storage::getFacadeRoot());
        $this->assertArrayNotHasKey('s3', $cached);
    }

    public function test_d2_active_nonlocal_mapping_or_persisted_nonlocal_locator_denied(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        config(['filesystems.disks.s3.bucket' => 'synthetic-unproven']);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        config(['filesystems.disks.s3.bucket' => null]);
        Document::query()->create(['title' => 'Synthetic nonlocal locator',
            'storage_disk' => 's3', 'storage_path' => 'foreign/other.pdf']);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($this->pdf(), Storage::disk('documents')->get($document->storage_path));
    }

    public static function rootMappingCases(): array
    {
        $cases = [];
        foreach (['target-stale', 'other-rebound', 'other-stale', 'target-rebound'] as $state) {
            foreach (['preview', 'download', 'cleanup'] as $action) {
                $cases[$state.'-'.$action] = [$state, $action];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('rootMappingCases')]
    public function test_d2_root_mapping_mismatch_without_other_rows(string $state, string $action): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $distinct = storage_path('framework/testing/disks/d2-other');
        $replacement = null;
        $this->assertSame(1, Document::query()->count());
        if ($state === 'target-stale') {
            config(['filesystems.disks.documents.root' => $distinct]);
        } elseif ($state === 'other-rebound') {
            Storage::set('public', $disk);
        } elseif ($state === 'other-stale') {
            Storage::fake('public');
            config(['filesystems.disks.public.root' => $distinct]);
        } else {
            $new = Storage::build(['driver' => 'local', 'root' => $distinct]);
            $new->put($document->storage_path, $bytes);
            $replacement = $new->path($document->storage_path);
            Storage::set('documents', $new);
        }
        $this->actingAs($actor);
        try {
            if ($action === 'cleanup') {
                $this->assertCleanupRetained($document);
            } else {
                $this->assertOpaque($document, [$action]);
            }
        } finally {
            $this->assertTrue(is_file($target), 'Original target must survive');
            $this->assertSame($bytes, file_get_contents($target));
            if ($replacement !== null) {
                $this->assertTrue(is_file($replacement), 'Rebound target must survive');
                $this->assertSame($bytes, file_get_contents($replacement));
            }
        }
    }

    public function test_d2_disjoint_unresolved_roots_do_not_initialize_directories(): void
    {
        [$actor, , $document] = $this->evidence();
        $absent = storage_path('framework/testing/disks/d2-absent-'.Str::uuid());
        config(['filesystems.disks.d2_absent' => ['driver' => 'local', 'root' => $absent]]);
        $this->assertFalse(file_exists($absent));
        $this->actingAs($actor);
        $this->get($this->url($document))->assertOk()->assertContent($this->pdf());
        $this->assertSame($this->pdf(), $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
        $this->assertFalse(file_exists($absent));
    }

    public static function d3LeadingCases(): array
    {
        $cases = [];
        foreach (['single' => '\\', 'multiple' => '\\\\', 'slash' => '/', 'mixed' => '\\/'] as $label => $leading) {
            foreach (['preview', 'download', 'cleanup'] as $action) {
                $cases[$label.'-'.$action] = [$leading, $label === 'multiple', $action];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('d3LeadingCases')]
    public function test_d3_leading_locator_actual_wrapper_alias(string $leading, bool $plan, string $action): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $root = rtrim($disk->path(''), '/');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $disk->delete($other->storage_path);
        $interior = 'd3-foreign\\different.pdf';
        $locator = $leading.$interior;
        $alias = $disk->path($locator);
        $this->assertSame($root.'/'.$interior, $alias);
        $normalized = (new \League\Flysystem\WhitespacePathNormalizer)->normalizePath($locator);
        $this->assertFalse(file_exists($root.'/'.$normalized));
        if (! str_starts_with($leading, '/')) {
            $this->assertFalse(file_exists($root.'/'.$locator));
        }
        $this->assertTrue(symlink($target, $alias));
        $this->assertSame($target, realpath($alias));
        $this->assertSame(1, lstat($target)['nlink']);
        $other->update(['storage_path' => $locator, 'checksum_sha256' => $plan ? str_repeat('0', 64) : null]);
        if ($plan) {
            $other->links()->delete();
            DB::table('documents')->where('id', $other->id)->update(['security_domain' => 'EVER_PLAN']);
        }
        $this->actingAs($actor);
        try {
            $this->assertFalse(app(DocumentAccessService::class)->canDownload($actor, $other->fresh()));
            if ($action === 'cleanup') {
                $this->assertCleanupRetained($document);
            } else {
                $this->assertOpaque($document, [$action]);
            }
        } finally {
            $this->assertTrue(is_link($alias));
            unlink($alias);
            $this->assertTrue(is_file($target), 'D3 leading-locator target deleted');
            $this->assertSame($bytes, file_get_contents($target));
        }
    }

    public static function d3UncachedAliasCases(): array
    {
        $cases = [];
        foreach (['prefix' => '0', 'directory_separator' => ''] as $option => $value) {
            foreach (['preview', 'download', 'cleanup'] as $action) {
                $cases[$option.'-'.$action] = [$option, $value, $action];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('d3UncachedAliasCases')]
    public function test_d3_uncached_mapping_actual_wrapper_alias(string $option, string $value, string $action): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $disk = Storage::disk('documents');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $disk->delete($other->storage_path);
        $root = storage_path('framework/testing/disks/d3-'.Str::uuid());
        $definition = ['driver' => 'local', 'root' => $root, $option => $value];
        // Explicit fixture construction only; build is on-demand, not cached.
        $wrapper = Storage::build($definition);
        config(['filesystems.disks.d3_alias' => $definition]);
        $locator = 'foreign/different.pdf';
        $alias = $wrapper->path($locator);
        $this->assertSame($option === 'prefix' ? $root.'/0/'.$locator : $root.$locator, $alias);
        $adapter = $wrapper->getAdapter();
        $prefixer = (new \ReflectionProperty(\League\Flysystem\Local\LocalFilesystemAdapter::class, 'prefixer'))->getValue($adapter);
        $this->assertSame($root.'/'.$locator, $prefixer->prefixPath($locator));
        $this->assertFalse(file_exists($root.'/'.$locator));
        $this->assertTrue(mkdir(dirname($alias), 0700, true));
        $this->assertTrue(symlink($target, $alias));
        $this->assertSame($target, realpath($alias));
        $other->update(['storage_disk' => 'd3_alias', 'storage_path' => $locator, 'checksum_sha256' => null]);
        $cached = new \ReflectionProperty(\Illuminate\Filesystem\FilesystemManager::class, 'disks');
        $manager = Storage::getFacadeRoot();
        $this->assertArrayNotHasKey('d3_alias', $cached->getValue($manager));
        $this->actingAs($actor);
        try {
            if ($action === 'cleanup') {
                $this->assertCleanupRetained($document);
            } else {
                $this->assertOpaque($document, [$action]);
            }
            $this->assertArrayNotHasKey('d3_alias', $cached->getValue($manager));
        } finally {
            unlink($alias);
            rmdir(dirname($alias));
            if ($option === 'prefix') {
                rmdir($root.'/0');
            }
            rmdir($root);
            $this->assertTrue(is_file($target), 'D3 mapping target deleted');
            $this->assertSame($bytes, file_get_contents($target));
        }
    }

    public static function d3MappingOptions(): array
    {
        $cases = [];
        $variants = [
            'absent' => [[], true],
            'null' => [['prefix' => null, 'directory_separator' => null, 'read-only' => null], true],
            'slash-false' => [['directory_separator' => '/', 'read-only' => false], true],
            'prefix-empty' => [['prefix' => ''], false],
            'prefix-false' => [['prefix' => false], false],
            'prefix-int-zero' => [['prefix' => 0], false],
            'prefix-string-zero' => [['prefix' => '0'], false],
            'separator-empty' => [['directory_separator' => ''], false],
            'separator-false' => [['directory_separator' => false], false],
            'separator-int-zero' => [['directory_separator' => 0], false],
            'separator-string-zero' => [['directory_separator' => '0'], false],
            'separator-backslash' => [['directory_separator' => '\\'], false],
            'readonly-empty' => [['read-only' => ''], false],
            'readonly-int-zero' => [['read-only' => 0], false],
            'readonly-string-zero' => [['read-only' => '0'], false],
            'readonly-true' => [['read-only' => true], false],
        ];
        foreach ($variants as $name => [$options, $allowed]) {
            foreach (['uncached', 'cached-effective'] as $mode) {
                $cases[$name.'-'.$mode] = [$options, $allowed, $mode];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('d3MappingOptions')]
    public function test_d3_typed_mapping_options_without_other_rows(array $options, bool $allowed, string $mode): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $root = storage_path('framework/testing/disks/d3-options-'.Str::uuid());
        $base = ['driver' => 'local', 'root' => $root];
        $cached = new \ReflectionProperty(\Illuminate\Filesystem\FilesystemManager::class, 'disks');
        $manager = Storage::getFacadeRoot();
        $this->assertSame(1, Document::query()->count());
        $this->assertFalse(file_exists($root));
        if ($mode === 'cached-effective') {
            // Isolate effective-config type checking from constructor coercion:
            // actual ordinary adapter, deliberately stale effective metadata.
            $wrapper = Storage::build($base);
            (new \ReflectionProperty(\Illuminate\Filesystem\FilesystemAdapter::class, 'config'))
                ->setValue($wrapper, $base + $options);
            Storage::set('d3_options', $wrapper);
            config(['filesystems.disks.d3_options' => $base]);
        } else {
            config(['filesystems.disks.d3_options' => $base + $options]);
        }
        $this->actingAs($actor);
        try {
            if ($allowed) {
                $this->get($this->url($document))->assertOk()->assertContent($bytes);
                $this->assertSame($bytes, $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent());
                app(DocumentAttachmentService::class)->cleanupDocuments([$document->fresh()]);
                $this->assertFalse(file_exists($target));
            } else {
                $this->assertOpaque($document);
                $this->assertCleanupRetained($document);
                $this->assertSame($bytes, file_get_contents($target));
            }
        } finally {
            if ($mode === 'uncached') {
                $this->assertArrayNotHasKey('d3_options', $cached->getValue($manager));
                $this->assertFalse(file_exists($root));
            } else {
                rmdir($root);
            }
        }
    }

    public static function d3SentinelCases(): array
    {
        $cases = [];
        foreach (['wrapper', 'adapter'] as $mapping) {
            foreach (['preview', 'download', 'cleanup'] as $action) {
                $cases[$mapping.'-'.$action] = [$mapping, $action];
            }
        }

        return $cases;
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('d3SentinelCases')]
    public function test_d3_nonempty_cached_mapping_must_match(string $mapping, string $action): void
    {
        [$actor, , $document] = $this->evidence();
        $disk = Storage::disk('documents');
        $target = $disk->path($document->storage_path);
        $bytes = file_get_contents($target);
        $root = storage_path('framework/testing/disks/d3-sentinel-'.Str::uuid());
        $base = ['driver' => 'local', 'root' => $root];
        $wrapper = Storage::build($base);
        $object = $mapping === 'wrapper' ? $wrapper : $wrapper->getAdapter();
        $owner = $mapping === 'wrapper' ? \Illuminate\Filesystem\FilesystemAdapter::class : \League\Flysystem\Local\LocalFilesystemAdapter::class;
        $property = new \ReflectionProperty($owner, 'prefixer');
        $prefixer = new \League\Flysystem\PathPrefixer($root, '');
        $property->setValue($object, $prefixer);
        $this->assertSame($root, $prefixer->prefixPath(''));
        $this->assertSame($root.'probe/file.pdf', $prefixer->prefixPath('probe/file.pdf'));
        Storage::set('d3_sentinel', $wrapper);
        config(['filesystems.disks.d3_sentinel' => $base]);
        $this->assertSame(1, Document::query()->count());
        $this->actingAs($actor);
        try {
            if ($action === 'cleanup') {
                $this->assertCleanupRetained($document);
            } else {
                $this->assertOpaque($document, [$action]);
            }
        } finally {
            rmdir($root);
            $this->assertTrue(is_file($target), 'D3 sentinel target deleted');
            $this->assertSame($bytes, file_get_contents($target));
        }
    }

    public function test_cleanup_missing_persisted_row_retains_bytes(): void
    {
        [, , $document] = $this->evidence();
        $path = $document->storage_path;
        $bytes = Storage::disk('documents')->get($path);
        DB::table('documents')->where('id', $document->id)->delete();
        $this->assertCleanupRetained($document);
        $this->assertSame($bytes, Storage::disk('documents')->get($path));
    }

    public function test_safe_exact_buffer_attachment_and_cleanup_and_cap_boundary(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        config(['documents.max_upload_mb' => 1]);
        $bytes = str_pad($this->pdf(), 1024 * 1024, ' ');
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertStringStartsWith('attachment;', $response->headers->get('Content-Disposition'));
        $this->assertSame($bytes, $response->streamedContent());
        $this->get($this->url($document))->assertOk()->assertContent($bytes);
        $bytes .= ' ';
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes)]);
        $this->get('/documents/'.$document->public_id.'/download')->assertNotFound();
        $this->assertCleanupRetained($document);
        $this->assertSame($bytes, Storage::disk('documents')->get($document->storage_path));
        config(['documents.max_upload_mb' => 2]);
        app(DocumentAttachmentService::class)->cleanupDocuments([$document->fresh()]);
        Storage::disk('documents')->assertMissing($document->storage_path);
    }

    public function test_attachment_is_not_reopened_after_verification(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $original = $this->pdf();
        $path = $document->storage_path;
        $this->mock(AuditLogger::class, function ($mock) use ($path): void {
            $mock->shouldReceive('record')->once()->andReturnUsing(function (...$args) use ($path): \App\Models\AuditLog {
                $result = (new AuditLogger)->record(...$args);
                Storage::disk('documents')->put($path, 'SYNTHETIC REPLACEMENT AFTER AUDIT');

                return $result;
            });
        });
        $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk();
        $this->assertSame($original, $response->streamedContent());
    }

    public static function unsafeRoots(): array
    {
        return [['public'], ['plan_custody'], ['local']];
    }

    #[\PHPUnit\Framework\Attributes\DataProvider('unsafeRoots')]
    public function test_configured_root_overlap_is_not_private_custody(string $disk): void
    {
        [$actor, , $document] = $this->evidence();
        $root = Storage::disk('documents')->path('');
        config(['filesystems.disks.'.$disk.'.root' => $root]);
        $this->actingAs($actor);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($this->pdf(), Storage::disk('documents')->get($document->storage_path));
    }

    public function test_same_content_duplicate_locator_retains_both_identities(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $other->update(['storage_path' => $document->storage_path]);
        try {
            $this->assertCleanupRetained($document);
        } finally {
            Storage::disk('documents')->assertExists($document->storage_path);
            $this->assertSame($this->pdf(), Storage::disk('documents')->get($document->storage_path));
        }
    }

    public function test_non_pdf_attachment_exact_bytes_and_safe_headers(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $bytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+Xn1sAAAAASUVORK5CYII=');
        Storage::disk('documents')->put($document->storage_path, $bytes);
        $document->update(['size_bytes' => strlen($bytes), 'checksum_sha256' => hash('sha256', $bytes),
            'mime_type' => 'image/png', 'original_name' => "../résumé\r\nX-Injection: yes%.png"]);
        DB::table('documents')->where('id', $document->id)->update(['security_domain' => 'LEGACY_CTW']);
        $response = $this->get('/documents/'.$document->public_id.'/download')->assertOk()
            ->assertHeader('Content-Type', 'image/png')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->assertSame($bytes, $response->streamedContent());
        $header = $response->headers->get('Content-Disposition');
        $this->assertStringStartsWith('attachment;', $header);
        $this->assertStringNotContainsString("\r", $header);
        $this->assertStringNotContainsString("\n", $header);
        $this->assertFalse($response->headers->has('X-Injection'));
        $this->get($this->url($document))->assertNotFound();
        app(DocumentAttachmentService::class)->cleanupDocuments([$document->fresh()]);
        Storage::disk('documents')->assertMissing($document->storage_path);
    }

    public function test_download_audit_failure_prevents_byte_delivery(): void
    {
        [$actor, , $document] = $this->evidence();
        $this->actingAs($actor);
        $this->mock(AuditLogger::class, function ($mock): void {
            $mock->shouldReceive('record')->once()->andThrow(new RuntimeException('Synthetic audit unavailable'));
        });
        $this->get('/documents/'.$document->public_id.'/download')->assertStatus(500)
            ->assertDontSee('Synthetic evidence page one');
    }

    public function test_locator_visibility_filtered_by_postgres_rls_is_not_ownership_proof(): void
    {
        [, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $this->assertTrue(app(LegacyDocumentBytes::class)->unambiguousLocator($document));
        $originalRls = (int) DB::selectOne("SELECT relrowsecurity::int AS enabled FROM pg_class WHERE oid = to_regclass('documents')")->enabled;
        $role = 'k1_visibility_'.strtolower(Str::random(12));
        // Disposable PG16 test database only; no application role or grants
        // changed. The test transaction also rolls back these fixture objects.
        DB::statement('CREATE ROLE '.$role.' NOLOGIN');
        DB::statement('GRANT USAGE ON SCHEMA public TO '.$role);
        DB::statement('GRANT SELECT ON TABLE documents TO '.$role);
        DB::statement('ALTER TABLE documents ENABLE ROW LEVEL SECURITY');
        DB::statement('CREATE POLICY k1_visibility ON documents TO '.$role.' USING (id = '.(int) $document->id.')');
        try {
            DB::statement('SET LOCAL ROLE '.$role);
            $this->assertTrue(DB::table('documents')->where('id', $document->id)->exists());
            $this->assertFalse(DB::table('documents')->where('id', $other->id)->exists());
            $this->assertFalse(app(LegacyDocumentBytes::class)->unambiguousLocator($document), 'RLS itself cannot prove global visibility.');
            DB::statement('RESET ROLE');
            $other->update(['storage_path' => $document->storage_path]);
            DB::statement('SET LOCAL ROLE '.$role);
            $this->assertFalse(DB::table('documents')->where('id', $other->id)->exists());
            $this->assertFalse(app(LegacyDocumentBytes::class)->unambiguousLocator($document));
            DB::statement('RESET ROLE');
            DB::statement('REVOKE SELECT ON TABLE documents FROM '.$role);
            DB::statement('SAVEPOINT k1_visibility_denied');
            try {
                DB::statement('SET LOCAL ROLE '.$role);
                $this->assertFalse(app(LegacyDocumentBytes::class)->unambiguousLocator($document));
            } finally {
                DB::statement('ROLLBACK TO SAVEPOINT k1_visibility_denied');
                DB::statement('RELEASE SAVEPOINT k1_visibility_denied');
            }
        } finally {
            DB::statement('RESET ROLE');
            DB::statement('DROP POLICY k1_visibility ON documents');
            if ($originalRls === 0) {
                DB::statement('ALTER TABLE documents DISABLE ROW LEVEL SECURITY');
            }
            DB::statement('REVOKE SELECT ON TABLE documents FROM '.$role);
            DB::statement('REVOKE USAGE ON SCHEMA public FROM '.$role);
            DB::statement('DROP ROLE '.$role);
        }
    }

    public function test_distinct_paths_with_ambiguous_filename_segment_fail_closed(): void
    {
        [$actor, , $document] = $this->evidence();
        [, , $other] = $this->evidence();
        $path = 'different/'.basename($document->storage_path);
        Storage::disk('documents')->put($path, $this->pdf());
        $other->update(['storage_path' => $path]);
        $this->actingAs($actor);
        $this->assertOpaque($document);
        $this->assertCleanupRetained($document);
        $this->assertSame($this->pdf(), Storage::disk('documents')->get($path));
    }

    public function test_request_queries_do_not_grow_with_links_or_locator_count(): void
    {
        [$actor, $parent, $document] = $this->evidence();
        $this->actingAs($actor);
        $counts = [];
        $samples = [];
        for ($n = 1; $n <= 32; $n++) {
            if ($n > 1) {
                DocumentLink::query()->create(['document_id' => $document->id,
                    'linkable_type' => $parent->getMorphClass(), 'linkable_id' => $parent->id,
                    'relationship' => 'k1-budget-'.$n]);
                Document::query()->create(['title' => 'Unrelated locator',
                    'storage_disk' => 'documents', 'storage_path' => 'unrelated/'.Str::uuid().'.pdf']);
            }
            if (! in_array($n, [1, 16, 17, 32], true)) {
                continue;
            }
            DB::enableQueryLog();
            DB::flushQueryLog();
            try {
                $start = hrtime(true);
                $this->get('/documents/'.$document->public_id.'/download')->assertOk()->streamedContent();
                $downloadMs = round((hrtime(true) - $start) / 1e6, 2);
                $download = count(DB::getQueryLog());
                DB::flushQueryLog();
                $start = hrtime(true);
                $this->get($this->url($document))->assertOk();
                $previewMs = round((hrtime(true) - $start) / 1e6, 2);
                $preview = count(DB::getQueryLog());
                $samples[] = [$downloadMs, $previewMs];
            } finally {
                DB::disableQueryLog();
                DB::flushQueryLog();
            }
            $counts[] = [$download, $preview];
        }
        foreach ($counts as [$download, $preview]) {
            $this->assertLessThanOrEqual($counts[0][0] + 1, $download);
            $this->assertLessThanOrEqual($counts[0][1] + 1, $preview);
        }
        fwrite(STDOUT, 'K1 request query budgets (1,16,17,32): '.json_encode($counts).PHP_EOL);
        fwrite(STDOUT, 'K1-D2 serial request ms (1,16,17,32; download,preview): '.json_encode($samples).PHP_EOL);
    }

    private function assertOpaque(Document $document, array $actions = ['preview', 'download']): void
    {
        foreach ($actions as $action) {
            $url = '/documents/'.$document->public_id.'/'.$action;
            $missing = $this->get('/documents/'.Str::uuid().'/'.$action)->assertNotFound();
            $response = $this->get($url)->assertNotFound()->assertHeaderMissing('Content-Disposition')
                ->assertHeaderMissing('Content-Range')->assertDontSee($document->original_name);
            $this->assertSame($missing->headers->get('Content-Length'), $response->headers->get('Content-Length'));
            $this->get($url, ['Range' => 'bytes=0-15'])->assertNotFound()->assertHeaderMissing('Content-Range');
            $this->head($url)->assertNotFound()->assertContent('')->assertHeaderMissing('Content-Disposition');
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'document.'.$action, 'entity_id' => $document->id, 'outcome' => 'allowed',
            ]);
            $this->assertDatabaseHas('audit_logs', [
                'action' => 'document.'.$action, 'entity_id' => null, 'outcome' => 'denied',
            ]);
            $this->assertDatabaseMissing('audit_logs', [
                'action' => 'document.'.$action, 'entity_id' => $document->id, 'outcome' => 'denied',
            ]);
        }
    }

    private function assertCleanupRetained(Document $document): void
    {
        $denied = false;
        try {
            app(DocumentAttachmentService::class)->cleanupDocuments([$document]);
        } catch (RuntimeException) {
            $denied = true;
        }
        $this->assertTrue($denied, 'Ambiguous or invalid cleanup must refuse deletion.');
    }

    private function url(Document $document): string
    {
        return '/documents/'.$document->public_id.'/preview';
    }

    private function evidence(): array
    {
        $actor = $this->actor();
        $record = $this->transaction($actor);
        $bytes = $this->pdf();
        $path = '2026/11/'.Str::uuid().'.pdf';
        Storage::disk('documents')->put($path, $bytes);
        $document = Document::query()->create([
            'title' => 'Synthetic evidence', 'original_name' => 'synthetic-evidence.pdf',
            'document_type' => 'supporting_document', 'classification' => 'internal',
            'mime_type' => 'application/pdf', 'size_bytes' => strlen($bytes),
            'checksum_sha256' => hash('sha256', $bytes), 'storage_disk' => 'documents',
            'storage_path' => $path, 'owner_department_id' => $actor->employee->department_id,
            'uploaded_by_user_id' => $actor->id,
        ]);
        $this->link($document, $record);

        return [$actor, $record, $document];
    }

    private function link(Document $document, Model $record): DocumentLink
    {
        return DocumentLink::query()->create([
            'document_id' => $document->id, 'linkable_type' => $record->getMorphClass(),
            'linkable_id' => $record->id, 'relationship' => 'supporting_document',
        ]);
    }

    private function transaction(User $actor): WorkflowTransaction
    {
        $office = $actor->employee->department_id;
        return WorkflowTransaction::query()->create([
            'reference_no' => 'PDF-'.Str::upper(Str::random(12)),
            'transaction_type' => 'internal_request', 'title' => 'Synthetic PDF transaction',
            'priority' => 'normal', 'origin_department_id' => $office, 'current_department_id' => $office,
            'created_by_user_id' => $actor->id, 'status' => 'submitted',
        ]);
    }

    private function actor(): User
    {
        $office = Department::query()->create([
            'code' => 'PDF-'.Str::upper(Str::random(10)), 'name' => 'Synthetic PDF office',
            'short_name' => 'PDF', 'branch' => 'executive', 'office_type' => 'department',
            'is_active' => true, 'is_routable' => true, 'sort_order' => 10,
        ]);
        $actor = User::query()->create([
            'name' => 'Synthetic PDF reviewer', 'email' => Str::random(12).'@example.test',
            'password' => 'password', 'role' => 'department_head', 'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'PDF-'.Str::upper(Str::random(12)), 'full_name' => $actor->name,
            'work_email' => $actor->email, 'user_id' => $actor->id, 'department_id' => $office->id,
            'position_title' => 'Synthetic reviewer', 'employment_status' => 'active',
        ]);

        return $actor->fresh('employee.department');
    }

    private function pdf(): string
    {
        $content = "BT /F1 24 Tf 50 680 Td (Synthetic evidence page one) Tj ET\n";
        $second = "BT /F1 24 Tf 50 680 Td (Synthetic evidence page two) Tj ET\n";
        $objects = [
            '<< /Type /Catalog /Pages 2 0 R >>',
            '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 6 0 R >>',
            '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 7 0 R >>',
            '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            '<< /Length '.strlen($content)." >>\nstream\n".$content.'endstream',
            '<< /Length '.strlen($second)." >>\nstream\n".$second.'endstream',
        ];
        $pdf = "%PDF-1.4\n";
        $offsets = [];
        foreach ($objects as $index => $object) {
            $offsets[] = strlen($pdf);
            $pdf .= ($index + 1)." 0 obj\n".$object."\nendobj\n";
        }
        $xref = strlen($pdf);
        $pdf .= "xref\n0 8\n0000000000 65535 f \n";
        foreach ($offsets as $offset) {
            $pdf .= sprintf("%010d 00000 n \n", $offset);
        }

        return $pdf."trailer\n<< /Size 8 /Root 1 0 R >>\nstartxref\n".$xref."\n%%EOF\n";
    }
}
