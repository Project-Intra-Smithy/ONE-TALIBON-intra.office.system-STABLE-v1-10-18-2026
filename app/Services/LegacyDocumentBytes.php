<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Throwable;

/** Bounded private local reads; callers retain provenance and actor authorization. */
final class LegacyDocumentBytes
{
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
     * One unscoped set-based probe covering protected rows and all disk labels.
     * A matching filename segment (case-folded, slash/backslash normalized)
     * conservatively denies exact, dot, parent, repeated slash and disk aliases.
     * Distinct canonical files sharing a basename can be denied intentionally.
     */
    public function unambiguousLocator(Document $document): bool
    {
        $relative = $document->storage_path;
        if (! $document->exists || $document->getKey() === null || ! $this->canonical($relative)) {
            return false;
        }

        try {
            return ! Document::query()->withoutGlobalScopes()
                ->where('id', '<>', $document->getKey())
                ->whereRaw("strpos('/' || lower(replace(storage_path, chr(92), '/')) || '/', ?) > 0", [
                    '/'.strtolower(basename($relative)).'/',
                ])->exists();
        } catch (Throwable) {
            return false;
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
            'image/jpeg', 'image/png', 'image/webp', 'application/octet-stream',
        ], true) ? $document->mime_type : 'application/octet-stream';
    }

    private function privatePath(Document $document): ?string
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

        $rootPath = rtrim(Storage::disk($disk)->path(''), '/\\');
        clearstatcache(true, $rootPath);
        $root = realpath($rootPath);
        if ($root === false || $this->normal($root) !== $this->normal($rootPath) || ! is_dir($root)) {
            return null;
        }
        $forbidden = [public_path(), storage_path('app/public'), config('filesystems.disks.plan_custody.root')];
        foreach ((array) config('filesystems.disks') as $name => $definition) {
            if ($name !== $disk && ($definition['driver'] ?? null) === 'local') {
                $forbidden[] = $definition['root'] ?? null;
            }
        }
        foreach ($forbidden as $otherRoot) {
            if (! is_string($otherRoot) || $otherRoot === '') {
                return null;
            }
            $other = realpath($otherRoot) ?: $otherRoot;
            if ($this->within($root, $other) || $this->within($other, $root)) {
                return null;
            }
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
        return rtrim(str_replace('\\', '/', $path), '/');
    }

    private function within(string $path, string $root): bool
    {
        return $this->normal($path) === $this->normal($root)
            || str_starts_with($this->normal($path), $this->normal($root).'/');
    }
}
