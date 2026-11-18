<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Filesystem\FilesystemManager;
use Illuminate\Filesystem\LocalFilesystemAdapter as LaravelLocalAdapter;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use League\Flysystem\Filesystem as Flysystem;
use League\Flysystem\Local\LocalFilesystemAdapter as FlysystemLocalAdapter;
use League\Flysystem\PathPrefixer;
use League\Flysystem\WhitespacePathNormalizer;
use ReflectionProperty;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Throwable;

/** Bounded private local reads; callers retain provenance and actor authorization. */
final class LegacyDocumentBytes
{
    private const MAX_LOCATORS = 2048;

    private const MAX_LOCATOR_BYTES = 4096;

    /** @return array{bytes:string,path:string,stat:array}|null */
    public function verifiedObject(Document $document): ?array
    {
        $size = filter_var($document->size_bytes, FILTER_VALIDATE_INT);
        $limit = min(max((int) config('documents.max_upload_mb', 15), 0), 32) * 1024 * 1024;
        $checksum = $document->checksum_sha256;
        if (! is_int($size) || $size < 1 || $size > $limit
            || ! is_string($checksum) || ! preg_match('/\A[a-f0-9]{64}\z/', $checksum)) {
            return null;
        }
        try {
            if (! $this->unambiguousLocator($document) || ($path = $this->privatePath($document)) === null) {
                return null;
            }
            $before = @lstat($path);
            if (! $this->regular($before, $size)) {
                return null;
            }
            $handle = @fopen($path, 'rb');
            if ($handle === false) {
                return null;
            }
            try {
                if (! $this->sameObject($before, fstat($handle), $size)) {
                    return null;
                }
                $bytes = stream_get_contents($handle, $size + 1);
                if (! $this->sameObject($before, fstat($handle), $size)
                    || ! is_string($bytes) || strlen($bytes) !== $size
                    || ! hash_equals($checksum, hash('sha256', $bytes))) {
                    return null;
                }
            } finally {
                fclose($handle);
            }
            $object = ['bytes' => $bytes, 'path' => $path, 'stat' => $before];

            return $this->samePathObject($document, $object) ? $object : null;
        } catch (Throwable) {
            return null;
        }
    }

    /**
     * A bounded catalog snapshot, never actor filtered or hash filtered.
     * Resolve only stored local locators, not a filesystem tree. Metadata
     * probes detect physical aliases even when another row names a different
     * basename. Unavailable visibility, unsupported mapping or excess rows
     * fail closed. This is not an atomic or immutable-generation proof.
     */
    public function unambiguousLocator(Document $document): bool
    {
        $relative = $document->storage_path;
        if (! $document->exists || $document->getKey() === null || ! $this->canonical($relative)) {
            return false;
        }

        try {
            $roots = $this->verifiedLocalRoots();
            $target = $roots === null ? null : $this->privatePath($document, $roots);
            if ($target === null || ! is_array($identity = @lstat($target))
                || ($identity['mode'] & 0170000) !== 0100000 || $identity['nlink'] !== 1) {
                return false;
            }
            // One DB statement: the row-visibility fence and the bounded
            // snapshot share a PostgreSQL statement snapshot. A sentinel row
            // distinguishes an empty catalog from an unavailable view.
            $rows = DB::select(<<<'SQL'
                SELECT CASE WHEN visibility.ok THEN 1 ELSE 0 END AS visible,
                    locator.id, locator.storage_disk, locator.storage_path
                FROM (
                    SELECT has_table_privilege(to_regclass('documents'), 'SELECT')
                        AND NOT row_security_active(to_regclass('documents')) AS ok
                ) AS visibility
                LEFT JOIN LATERAL (
                    SELECT id, storage_disk,
                        CASE WHEN octet_length(storage_path) <= ? THEN storage_path END AS storage_path
                    FROM documents
                    WHERE id <> ? AND storage_path IS NOT NULL AND storage_path <> ''
                    LIMIT ?
                ) AS locator ON visibility.ok
                SQL, [self::MAX_LOCATOR_BYTES, $document->getKey(), self::MAX_LOCATORS + 1]);

            if ($rows === [] || (int) $rows[0]->visible !== 1 || count($rows) > self::MAX_LOCATORS) {
                return false;
            }
            $normalizer = new WhitespacePathNormalizer;
            $basename = strtolower(basename($relative));
            foreach ($rows as $row) {
                if ($row->id === null) {
                    continue;
                }
                $disk = $row->storage_disk;
                $path = $row->storage_path;
                if (! is_string($path) || ! is_string($disk) || ! isset($roots[$disk])
                    || $path === '' || str_starts_with($path, '/') || preg_match('/[\x00-\x1f\x7f]/', $path)) {
                    return false;
                }
                $slashMapped = str_replace('\\', '/', $path);
                if (in_array($basename, explode('/', strtolower($slashMapped)), true)) {
                    return false;
                }
                // Linux raw filename semantics and adapter normalization are
                // independent: a literal backslash is not an OS separator.
                $normalized = $normalizer->normalizePath($path);
                if ($normalized === '') {
                    return false;
                }
                foreach (array_unique([$path, $normalized, ltrim($slashMapped, '/')]) as $spelling) {
                    if ($this->couldAlias($roots[$disk].'/'.$spelling, $target, $identity)) {
                        return false;
                    }
                }
            }

            return true;
        } catch (Throwable) {
            return false;
        }
    }

    /** Metadata only: no reading or opening another document's bytes. */
    private function couldAlias(string $candidate, string $target, array $identity): bool
    {
        // Linux path limits include the absolute prefix. A syscall error
        // on an oversized spelling is not evidence of a missing object.
        if (strlen($candidate) >= 4096) {
            return true;
        }
        foreach (explode('/', $candidate) as $segment) {
            if (strlen($segment) > 255) {
                return true;
            }
        }
        clearstatcache(true);
        $resolved = @realpath($candidate);
        if ($resolved !== false) {
            $stat = @stat($resolved);

            return ! is_array($stat) || $this->normal($resolved) === $this->normal($target)
                || ($stat['dev'] === $identity['dev'] && $stat['ino'] === $identity['ino']);
        }
        // Missing unrelated objects are not a current physical alias. Do not
        // mistake a dangling link or inaccessible ancestor for a missing file.
        $ancestor = $candidate;
        while (true) {
            $stat = @lstat($ancestor);
            if (is_array($stat)) {
                return ($stat['mode'] & 0170000) !== 0040000
                    || ! is_readable($ancestor) || ! is_executable($ancestor);
            }
            $parent = dirname($ancestor);
            if ($parent === $ancestor) {
                return true;
            }
            $ancestor = $parent;
        }
    }

    public function samePathObject(Document $document, array $object): bool
    {
        try {
            $path = $this->privatePath($document);
            if ($path === null || $path !== $object['path']) {
                return false;
            }
            clearstatcache(true, $path);

            return $this->sameObject($object['stat'], @lstat($path), strlen($object['bytes']));
        } catch (Throwable) {
            return false;
        }
    }

    public function sameDescriptor(Document $loaded, Document $fresh): bool
    {
        foreach (['id', 'public_id', 'storage_disk', 'storage_path', 'size_bytes', 'checksum_sha256', 'security_domain'] as $field) {
            if ($loaded->getAttribute($field) !== $fresh->getAttribute($field)) {
                return false;
            }
        }

        return true;
    }

    public function attachmentDisposition(Document $document): string
    {
        $name = basename(str_replace('\\', '/', (string) ($document->original_name ?: $document->title)));
        $name = preg_replace('/[\p{C}\/%]/u', '_', $name) ?: 'evidence-file';
        $name = Str::limit($name, 180, '');
        $fallback = preg_replace('/[^A-Za-z0-9._-]/', '_', Str::ascii($name)) ?: 'evidence-file';

        return HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $name, $fallback);
    }

    public function attachmentMime(Document $document): string
    {
        return in_array($document->mime_type, [
            'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'image/jpeg', 'image/png', 'image/webp', 'text/plain', 'application/octet-stream',
        ], true) ? $document->mime_type : 'application/octet-stream';
    }

    /**
     * Supported mapping: pinned Laravel manager / ordinary local Flysystem
     * adapter on Linux, with no prefix, custom driver or decorated adapter.
     * Inspect cached objects without resolving absent disks (the default
     * constructor mkdirs). Uncached mappings follow the verified built-in
     * factory. Reflection is intentionally version-sensitive and fails closed.
     * No filesystem generation, bind-mount or concurrent mapping attestation.
     *
     * @return array<string, string>|null
     */
    private function verifiedLocalRoots(): ?array
    {
        if (PHP_OS_FAMILY !== 'Linux' || DIRECTORY_SEPARATOR !== '/') {
            return null;
        }
        $manager = Storage::getFacadeRoot();
        if (! is_object($manager) || get_class($manager) !== FilesystemManager::class
            || app('filesystem') !== $manager) {
            return null;
        }
        $cached = (new ReflectionProperty(FilesystemManager::class, 'disks'))->getValue($manager);
        $custom = (new ReflectionProperty(FilesystemManager::class, 'customCreators'))->getValue($manager);
        $definitions = config('filesystems.disks');
        if (! is_array($cached) || ! is_array($custom) || isset($custom['local'])
            || ! is_array($definitions) || array_diff_key($cached, $definitions) !== []) {
            return null;
        }
        $roots = [];
        foreach ($definitions as $name => $definition) {
            // Laravel merges its default, dormant S3 definition into the
            // application's disks. It has no local mapping and is not
            // resolved here. An active, custom, cached or locally mapped
            // nonlocal definition is not supported; a persisted S3 locator
            // is also denied because it will not appear in $roots.
            if ($name === 's3' && is_array($definition)
                && ($definition['driver'] ?? null) === 's3'
                && ! array_key_exists($name, $cached) && ! isset($custom['s3'])
                && empty($definition['bucket']) && empty($definition['key'])
                && empty($definition['secret']) && empty($definition['token'])
                && empty($definition['endpoint']) && empty($definition['url'])
                && empty($definition['root']) && empty($definition['prefix'])) {
                continue;
            }
            if (! is_string($name) || ! is_array($definition)
                || ($definition['driver'] ?? null) !== 'local'
                || ! empty($definition['prefix']) || ! empty($definition['read-only'])
                || ! empty($definition['directory_separator'])) {
                return null;
            }
            $root = $this->canonicalRoot($definition['root'] ?? null);
            if ($root === null) {
                return null;
            }
            if (array_key_exists($name, $cached)) {
                $disk = $cached[$name];
                if (! is_object($disk) || get_class($disk) !== LaravelLocalAdapter::class) {
                    return null;
                }
                $adapter = $disk->getAdapter();
                $driver = $disk->getDriver();
                $effective = $disk->getConfig();
                if (get_class($adapter) !== FlysystemLocalAdapter::class
                    || get_class($driver) !== Flysystem::class
                    || ! is_array($effective) || ! empty($effective['prefix'])
                    || ! empty($effective['read-only']) || ! empty($effective['directory_separator'])
                    || $this->canonicalRoot($effective['root'] ?? null) !== $root
                    || $this->canonicalRoot($disk->path('')) !== $root
                    || $this->canonicalRoot((new ReflectionProperty(FlysystemLocalAdapter::class, 'rootLocation'))->getValue($adapter)) !== $root
                    || (new ReflectionProperty(Flysystem::class, 'adapter'))->getValue($driver) !== $adapter) {
                    return null;
                }
                $prefixer = (new ReflectionProperty(FlysystemLocalAdapter::class, 'prefixer'))->getValue($adapter);
                $normalizer = (new ReflectionProperty(Flysystem::class, 'pathNormalizer'))->getValue($driver);
                if (get_class($prefixer) !== PathPrefixer::class
                    || $this->canonicalRoot($prefixer->prefixPath('')) !== $root
                    || get_class($normalizer) !== WhitespacePathNormalizer::class) {
                    return null;
                }
                if ($name === 'documents' && (($effective['visibility'] ?? 'private') !== 'private'
                    || (new ReflectionProperty(LaravelLocalAdapter::class, 'shouldServeSignedUrls'))->getValue($disk) !== false)) {
                    return null;
                }
            }
            $roots[$name] = $root;
        }
        $target = $roots['documents'] ?? null;
        if ($target === null || ! is_dir($target)) {
            return null;
        }
        $forbidden = array_diff_key($roots, ['documents' => true]);
        $public = $this->canonicalRoot(public_path());
        $published = $this->canonicalRoot(storage_path('app/public'));
        if ($public === null || $published === null || ! isset($roots['plan_custody'], $roots['public'], $roots['local'])) {
            return null;
        }
        $forbidden[] = $public;
        $forbidden[] = $published;
        $links = config('filesystems.links');
        if (! is_array($links)) {
            return null;
        }
        foreach ($links as $link => $destination) {
            $destination = $this->canonicalRoot($destination);
            if (! is_string($link) || $destination === null || $this->canonicalRoot(dirname($link)) === null) {
                return null;
            }
            clearstatcache(true);
            $actual = is_link($link) ? realpath($link) : $link;
            if ($actual === false || ($physical = $this->canonicalRoot($actual)) === null) {
                return null;
            }
            $forbidden[] = $destination;
            $forbidden[] = $physical;
        }
        $targetStat = @stat($target);
        if (! is_array($targetStat)) {
            return null;
        }
        foreach ($forbidden as $otherRoot) {
            $otherStat = @stat($otherRoot);
            if ($this->within($target, $otherRoot) || $this->within($otherRoot, $target)
                || (is_array($otherStat) && $targetStat['dev'] === $otherStat['dev']
                    && $targetStat['ino'] === $otherStat['ino'])) {
                return null;
            }
        }

        return $roots;
    }

    /**
     * Canonical absolute directory spelling; a missing suffix is supported
     * only under a readable/searchable existing directory. Never mkdir.
     */
    private function canonicalRoot(mixed $root): ?string
    {
        if (! is_string($root) || strlen($root) >= 4096) {
            return null;
        }
        $root = rtrim($root, '/');
        if (! preg_match('#\A/[A-Za-z0-9._ -]+(?:/[A-Za-z0-9._ -]+)*\z#D', $root)) {
            return null;
        }
        clearstatcache(true);
        $path = '';
        $missing = false;
        foreach (explode('/', substr($root, 1)) as $segment) {
            if ($segment === '.' || $segment === '..' || strlen($segment) > 255) {
                return null;
            }
            $path .= '/'.$segment;
            if ($missing) {
                continue;
            }
            $stat = @lstat($path);
            if ($stat === false) {
                $parent = dirname($path);
                if (! is_dir($parent) || ! is_readable($parent) || ! is_executable($parent)) {
                    return null;
                }
                $missing = true;
            } elseif (($stat['mode'] & 0170000) !== 0040000
                || ! is_readable($path) || ! is_executable($path) || realpath($path) !== $path) {
                return null;
            }
        }

        return $root;
    }

    private function privatePath(Document $document, ?array $roots = null): ?string
    {
        $disk = (string) config('documents.disk', 'documents');
        $relative = $document->storage_path;
        if ($disk !== 'documents' || $document->storage_disk !== $disk
            || config('filesystems.disks.documents.driver') !== 'local'
            || config('filesystems.disks.documents.visibility') !== 'private'
            || config('filesystems.disks.documents.serve') !== false
            || ! $this->canonical($relative)) {
            return null;
        }
        $roots ??= $this->verifiedLocalRoots();
        $root = $roots[$disk] ?? null;
        if ($root === null) {
            return null;
        }

        $path = $root;
        foreach (explode('/', $relative) as $segment) {
            $path .= DIRECTORY_SEPARATOR.$segment;
            clearstatcache(true, $path);
            if (is_link($path)) {
                return null;
            }
        }
        $resolved = realpath($path);

        return $resolved !== false && $this->normal($resolved) === $this->normal($path)
            && $this->within($resolved, $root) ? $resolved : null;
    }

    private function canonical(mixed $path): bool
    {
        return is_string($path)
            && preg_match('#\A[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)*\z#D', $path) === 1;
    }

    private function regular(mixed $stat, int $size): bool
    {
        return is_array($stat) && ($stat['mode'] & 0170000) === 0100000
            && $stat['nlink'] === 1 && $stat['size'] === $size;
    }

    private function sameObject(array $before, mixed $after, int $size): bool
    {
        return $this->regular($after, $size)
            && $after['dev'] === $before['dev'] && $after['ino'] === $before['ino']
            && $after['mtime'] === $before['mtime'] && $after['ctime'] === $before['ctime'];
    }

    private function normal(string $path): string
    {
        return rtrim($path, '/');
    }

    private function within(string $path, string $root): bool
    {
        return $this->normal($path) === $this->normal($root)
            || str_starts_with($this->normal($path), $this->normal($root).'/');
    }
}
