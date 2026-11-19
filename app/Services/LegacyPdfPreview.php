<?php

namespace App\Services;

use App\Models\Document;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;
use Throwable;

final class LegacyPdfPreview
{
    public function __construct(private readonly LegacyDocumentBytes $storage) {}

    public function verifiedBytes(Document $document): ?string
    {
        if ($document->mime_type !== 'application/pdf') {
            return null;
        }
        $object = $this->storage->verifiedObject($document);
        if ($object === null) {
            return null;
        }
        $bytes = $object['bytes'];

        return self::isValidPdfBytes($bytes) ? $bytes : null;
    }

    public static function isValidPdfBytes(string $bytes): bool
    {
        $size = strlen($bytes);
        if ($size === 0) {
            return false;
        }

        try {
            // Format/structure checks, not full parsing or malware scanning.
            if (! preg_match('/\A%PDF-(?:1\.[0-7]|2\.0)(?:\r\n|\r|\n)/', $bytes)
                || (new \finfo(FILEINFO_MIME_TYPE))->buffer($bytes) !== 'application/pdf'
                || ! preg_match('/startxref\s+([0-9]+)\s+%%EOF[ \r\n\t]*\z/', $bytes, $xref)) {
                return false;
            }
            $offset = filter_var($xref[1], FILTER_VALIDATE_INT);
            if (! is_int($offset) || $offset < 0 || $offset >= $size
                || ! preg_match('/\A(?:xref\b|[0-9]+\s+[0-9]+\s+obj\b)/', substr($bytes, $offset, 128))) {
                return false;
            }

            return true;
        } catch (Throwable) {
            return false;
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
}
