<?php

namespace App\Http\Controllers;

use App\Models\Document;
use App\Services\AuditLogger;
use App\Services\DocumentAccessService;
use App\Services\LegacyPdfPreview;
use App\Services\PlanDocumentOriginGuard;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class DocumentController extends Controller
{
    public function preview(
        Request $request,
        string $document,
        DocumentAccessService $access,
        AuditLogger $audit,
        LegacyPdfPreview $preview,
    ): Response {
        $actor = $request->user()->loadMissing('employee');
        $headers = [
            'Cache-Control' => 'private, no-store',
            'X-Content-Type-Options' => 'nosniff',
            'Referrer-Policy' => 'no-referrer',
        ];

        // Missing, protected and unauthorized identities are indistinguishable.
        $deny = static function () use ($actor, $audit, $headers): Response {
            $audit->record($actor, 'document.preview', 'Denied evidence preview.', outcome: 'denied');

            return new Response('Not Found', 404, [...$headers, 'Content-Type' => 'text/plain; charset=UTF-8']);
        };

        $record = Str::isUuid($document)
            ? Document::query()->where('public_id', $document)->first()
            : null;
        if (! $record || ! PlanDocumentOriginGuard::isEligibleForLegacyPreview($record) || ! $access->canDownload($actor, $record)) {
            return $deny();
        }

        $bytes = $preview->verifiedBytes($record);
        if ($bytes === null) {
            return $deny();
        }

        // Recheck persisted identity, provenance and all parents before
        // disclosure. This is not atomic cross-transaction revocation.
        $fresh = $record->fresh();
        if (! $fresh
            || ! PlanDocumentOriginGuard::isEligibleForLegacyPreview($fresh)
            || ! $access->canDownload($actor, $fresh)
            || $record->getAttributes() !== $fresh->getAttributes()) {
            return $deny();
        }

        $disposition = $preview->disposition($fresh);
        $audit->record(
            $actor,
            'document.preview',
            'Authorized protected Core Portal evidence preview.',
            entityType: 'document',
            entityId: $fresh->id,
        );

        // Range requests intentionally receive the entire verified representation.
        return new Response($bytes, 200, [
            ...$headers,
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition,
            'Content-Length' => (string) strlen($bytes),
        ]);
    }

    public function download(
        Request $request,
        Document $document,
        DocumentAccessService $access,
        AuditLogger $audit,
    ): StreamedResponse {
        $actor = $request->user()->loadMissing('employee');

        // A known protected Plan must be indistinguishable from a missing UUID
        // at this legacy download endpoint. No Plan bytes are served here.
        if (PlanDocumentOriginGuard::isProtected($document)) {
            $audit->record($actor, 'document.download', 'Denied evidence retrieval.', outcome: 'denied');
            abort(404);
        }

        if (! $access->canDownload($actor, $document)) {
            // Provenance may have changed during the fresh actor/parent check.
            // Never turn a protected identity into an ordinary identified 403.
            if (PlanDocumentOriginGuard::isProtected($document)) {
                $audit->record($actor, 'document.download', 'Denied evidence retrieval.', outcome: 'denied');
                abort(404);
            }

            $audit->record(
                $actor,
                'document.download',
                'Denied protected Core Portal evidence download.',
                outcome: 'denied',
                entityType: 'document',
                entityId: $document->id,
            );

            throw new AuthorizationException('You are not authorized to download this evidence.');
        }

        $disk = (string) config('documents.disk', 'documents');
        if ($document->storage_disk !== $disk
            || ! $document->storage_path
            || ! Storage::disk($disk)->exists($document->storage_path)) {
            abort(404);
        }

        // Re-read the descriptor and reauthorize before creating the stream.
        // This is not an atomic filesystem/cross-transaction custody guarantee.
        $fresh = $document->fresh();
        if (! $fresh
            || PlanDocumentOriginGuard::isProtected($fresh)
            || $document->getAttributes() !== $fresh->getAttributes()
            || ! $access->canDownload($actor, $fresh)) {
            $audit->record($actor, 'document.download', 'Denied evidence retrieval.', outcome: 'denied');
            abort(404);
        }

        $document = $fresh;
        $audit->record(
            $actor,
            'document.download',
            'Downloaded protected Core Portal evidence.',
            entityType: 'document',
            entityId: $document->id,
        );

        return Storage::disk($disk)->download(
            $document->storage_path,
            $document->original_name ?: $document->title,
            [
                'Content-Type' => $document->mime_type ?: 'application/octet-stream',
                'Cache-Control' => 'private, no-store',
                'X-Content-Type-Options' => 'nosniff',
            ],
        );
    }
}
