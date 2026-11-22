<?php

declare(strict_types=1);

namespace App\Services\Custody;

use RuntimeException;

/**
 * Machine-generated completion record. This is source evidence, not an LGU
 * signature, employee appointment, approval or official municipal certificate.
 *
 * The existing N03 contract requires at least one staged PDF/document even
 * when the Work Request close action has no user-uploaded attachment.
 */
final class WorkRequestCloseDocumentPdf
{
    public function write(string $reference, string $remarks, int $actorId): string
    {
        $file = tempnam(sys_get_temp_dir(), 'ops009-close-');
        if (! is_string($file)) {
            throw new RuntimeException('Unable to allocate temporary N03 closure evidence.');
        }

        try {
            $lines = [
                'ONE TALIBON - System-generated Work Request completion record',
                'This is system evidence, NOT a municipal signing authority.',
                'Reference: '.$reference,
                'Actor user ID: '.$actorId,
                'Recorded UTC: '.gmdate('Y-m-d H:i:s').'Z',
                'Completion note:',
                $remarks,
            ];

            $stream = "BT\n/F1 11 Tf\n50 760 Td\n";
            $count = 0;
            foreach ($lines as $line) {
                $clean = preg_replace('/[^\x20-\x7e]/', '?', $line);
                foreach (explode("\n", wordwrap((string) $clean, 89, "\n", true)) as $part) {
                    if ($count++ >= 45) {
                        break 2;
                    }
                    $escaped = str_replace(['\\', '(', ')'], ['\\\\', '\(', '\)'], $part);
                    $stream .= '('.$escaped.") Tj\n0 -15 Td\n";
                }
            }
            $stream .= "ET\n";

            $objects = [
                '<< /Type /Catalog /Pages 2 0 R >>',
                '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
                '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
                '<< /Length '.strlen($stream)." >>\nstream\n".$stream."endstream",
                '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
            ];
            $pdf = "%PDF-1.4\n";
            $offsets = [0];
            foreach ($objects as $i => $object) {
                $offsets[] = strlen($pdf);
                $pdf .= ($i + 1)." 0 obj\n".$object."\nendobj\n";
            }
            $xref = strlen($pdf);
            $pdf .= "xref\n0 ".(count($objects) + 1)."\n0000000000 65535 f \n";
            foreach (array_slice($offsets, 1) as $offset) {
                $pdf .= sprintf("%010d 00000 n \n", $offset);
            }
            $pdf .= "trailer\n<< /Size ".(count($objects) + 1)." /Root 1 0 R >>\n";
            $pdf .= "startxref\n".$xref."\n%%EOF\n";

            if (file_put_contents($file, $pdf, LOCK_EX) !== strlen($pdf)) {
                throw new RuntimeException('Unable to stage machine-generated closure PDF.');
            }

            return $file;
        } catch (\Throwable $exception) {
            @unlink($file);
            throw $exception;
        }
    }
}
