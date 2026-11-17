<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Throwable;

final class LegacyPdfPreview
{
    public function verifiedBytes(Document $document): ?string
    {
        $disk = (string) config('documents.disk', 'documents');
        $limit = min(max((int) config('documents.max_upload_mb', 15), 0), 32) * 1024 * 1024;
        $size = filter_var($document->size_bytes, FILTER_VALIDATE_INT);
        $checksum = $document->checksum_sha256;
        $relative = $document->storage_path;
        if ($document->mime_type !== 'application/pdf'
            || $disk !== 'documents'
            || $document->storage_disk !== $disk
            || config('filesystems.disks.documents.driver') !== 'local'
            || config('filesystems.disks.documents.visibility') !== 'private'
            || config('filesystems.disks.documents.serve') !== false
            || ! is_int($size) || $size < 1 || $size > $limit
            || ! is_string($checksum) || ! preg_match('/\A[a-f0-9]{64}\z/', $checksum)
            || ! is_string($relative)
            || ! preg_match('#\A[A-Za-z0-9][A-Za-z0-9._-]*(?:/[A-Za-z0-9][A-Za-z0-9._-]*)*\z#D', $relative)) {
            return null;
        }

        try {
            $rootPath = rtrim(Storage::disk($disk)->path(''), '/\\');
            $root = realpath($rootPath);
            if ($root === false || $this->normal($root) !== $this->normal($rootPath) || ! is_dir($root)) {
                return null;
            }
            foreach ([public_path(), storage_path('app/public'), config('filesystems.disks.plan_custody.root')] as $forbidden) {
                if (! is_string($forbidden) || $forbidden === '') {
                    continue;
                }
                $other = realpath($forbidden) ?: $forbidden;
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
            $before = @lstat($path);
            if ($resolved === false || $this->normal($resolved) !== $this->normal($path)
                || ! $this->within($resolved, $root) || ! is_array($before)
                || ($before['mode'] & 0170000) !== 0100000
                || $before['nlink'] !== 1 || $before['size'] !== $size) {
                return null;
            }

            $handle = @fopen($resolved, 'rb');
            if ($handle === false) {
                return null;
            }
            try {
                $opened = fstat($handle);
                if (! is_array($opened) || $opened['dev'] !== $before['dev']
                    || $opened['ino'] !== $before['ino'] || $opened['size'] !== $size
                    || $opened['nlink'] !== 1 || ($opened['mode'] & 0170000) !== 0100000) {
                    return null;
                }
                // Verify the exact bounded bytes that will be served, not a
                // separate reopened file.
                $bytes = stream_get_contents($handle, $size + 1);
                $after = fstat($handle);
                if (! is_array($after) || $after['size'] !== $size
                    || ! is_string($bytes) || strlen($bytes) !== $size
                    || ! hash_equals($checksum, hash('sha256', $bytes))) {
                    return null;
                }
            } finally {
                fclose($handle);
            }

            // Format/structure checks, not full parsing or malware scanning.
            if (! preg_match('/\A%PDF-(?:1\.[0-7]|2\.0)(?:\r\n|\r|\n)/', $bytes)
                || (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) !== 'application/pdf'
                || ! preg_match('/startxref\s+([0-9]+)\s+%%EOF[ \r\n\t]*\z/', $bytes, $xref)) {
                return null;
            }
            $offset = filter_var($xref[1], FILTER_VALIDATE_INT);
            if (! is_int($offset) || $offset < 0 || $offset >= $size
                || ! preg_match('/\A(?:xref\b|[0-9]+\s+[0-9]+\s+obj\b)/', substr($bytes, $offset, 128))) {
                return null;
            }

            return $bytes;
        } catch (Throwable) {
            return null;
        }
    }

    public function disposition(Document $document): string
    {
        $name = basename(str_replace('\\', '/', (string) ($document->original_name ?: $document->title)));
        $name = preg_replace('/[\p{C}\/%]/u', '_', $name) ?: 'document.pdf';
        $name = Str::limit($name, 180, '');
        if (! str_ends_with(strtolower($name), '.pdf')) {
            $name .= '.pdf';
        }
        $fallback = preg_replace('/[^A-Za-z0-9._-]/', '_', Str::ascii($name)) ?: 'document.pdf';

        return HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_INLINE, $name, $fallback);
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
