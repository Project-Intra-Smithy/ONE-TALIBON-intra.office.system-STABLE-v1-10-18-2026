<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Document;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Custody\RegistryDocumentRetrievalService;
use App\Services\DocumentAccessService;
use App\Services\LegacyDocumentBytes;
use App\Services\LegacyPdfPreview;
use App\Services\PlanDocumentOriginGuard;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

final class DocumentController extends Controller
{
    private const SECURITY_HEADERS = [
        'Cache-Control' => 'private, no-store',
        'X-Content-Type-Options' => 'nosniff',
        'Referrer-Policy' => 'no-referrer',
    ];

    public function preview(
        Request $request,
        string $document,
        DocumentAccessService $access,
        AuditLogger $audit,
        LegacyPdfPreview $preview,
        LegacyDocumentBytes $storage,
        RegistryDocumentRetrievalService $registryRetrieval,
    ): Response {
        $actor = $request->user()->loadMissing('employee');

        $record = Str::isUuid($document)
            ? Document::query()->where('public_id', $document)->first()
            : null;
        if (! $record || ! PlanDocumentOriginGuard::isEligibleForLegacyPreview($record)) {
            return $this->maskedNotFound($actor, $audit, 'document.preview', 'Denied evidence preview.');
        }

        if ($record->getAttribute('custody_mode') === 'REGISTRY_V1') {
            try {
                $payload = $registryRetrieval->retrieveForEgress($actor, (string) $record->public_id, true);
            } catch (Throwable) {
                return $this->maskedNotFound($actor, $audit, 'document.preview', 'Denied evidence preview.');
            }

            $fresh = $payload['document'];
            $bytes = $payload['bytes'];

            return new Response($bytes, 200, [
                ...self::SECURITY_HEADERS,
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => $preview->disposition($fresh),
                'Content-Length' => (string) strlen($bytes),
            ]);
        }

        if ($record->getAttribute('custody_operation_id') !== null
            || ($record->getAttribute('custody_mode') !== null && $record->getAttribute('custody_mode') !== 'LEGACY_PATH')
            || ! $access->canDownload($actor, $record)) {
            return $this->maskedNotFound($actor, $audit, 'document.preview', 'Denied evidence preview.');
        }

        $bytes = $preview->verifiedBytes($record);
        if ($bytes === null) {
            return $this->maskedNotFound($actor, $audit, 'document.preview', 'Denied evidence preview.');
        }

        // Recheck persisted identity, provenance and all parents before
        // disclosure. This is not atomic cross-transaction revocation.
        $fresh = $record->fresh();
        if (! $fresh
            || ! PlanDocumentOriginGuard::isEligibleForLegacyPreview($fresh)
            || ! $access->canDownload($actor, $fresh)
            || $record->getAttributes() !== $fresh->getAttributes()
            || ! $storage->unambiguousLocator($fresh)) {
            return $this->maskedNotFound($actor, $audit, 'document.preview', 'Denied evidence preview.');
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
            ...self::SECURITY_HEADERS,
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition,
            'Content-Length' => (string) strlen($bytes),
        ]);
    }

    public function download(
        Request $request,
        string $document,
        DocumentAccessService $access,
        AuditLogger $audit,
        LegacyDocumentBytes $storage,
        RegistryDocumentRetrievalService $registryRetrieval,
    ): Response {
        $actor = $request->user()->loadMissing('employee');

        $record = Str::isUuid($document)
            ? Document::query()->where('public_id', $document)->first()
            : null;

        // Missing, invalid, and protected Plan identities must be byte-identical 404.
        if (! $record || PlanDocumentOriginGuard::isProtected($record)) {
            return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
        }

        if ($record->getAttribute('custody_mode') === 'REGISTRY_V1') {
            try {
                $payload = $registryRetrieval->retrieveForEgress($actor, (string) $record->public_id, false);
            } catch (Throwable) {
                return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
            }

            $fresh = $payload['document'];
            $bytes = $payload['bytes'];
            $disposition = $registryRetrieval->attachmentDisposition($fresh);

            return new StreamedResponse(static function () use ($bytes): void {
                echo $bytes;
            }, 200, [
                ...self::SECURITY_HEADERS,
                'Content-Type' => $registryRetrieval->attachmentMime($payload['mime']),
                'Content-Disposition' => $disposition,
                'Content-Length' => (string) strlen($bytes),
            ]);
        }

        // Contradiction defense (G3-N06): LEGACY_PATH row carrying custody_operation_id fails closed.
        if ($record->getAttribute('custody_operation_id') !== null
            || ($record->getAttribute('custody_mode') !== null && $record->getAttribute('custody_mode') !== 'LEGACY_PATH')) {
            return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
        }

        if (! $access->canDownload($actor, $record)) {
            // Provenance may have changed during the fresh actor/parent check.
            // Never turn a protected identity into an ordinary identified 403.
            if (PlanDocumentOriginGuard::isProtected($record)
                || $record->storage_disk !== (string) config('documents.disk', 'documents')
                || ! $record->storage_path) {
                // Shape only: never inspect storage for a denied actor.
                return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
            }

            $audit->record(
                $actor,
                'document.download',
                'Denied protected Core Portal evidence download.',
                outcome: 'denied',
                entityType: 'document',
                entityId: $record->id,
            );

            throw new AuthorizationException('You are not authorized to download this evidence.');
        }

        $object = $storage->verifiedObject($record);
        if ($object === null) {
            return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
        }

        // Re-read the descriptor and reauthorize before creating the stream.
        // This is not an atomic filesystem/cross-transaction custody guarantee.
        $fresh = $record->fresh();
        if (! $fresh
            || PlanDocumentOriginGuard::isProtected($fresh)
            || $record->getAttributes() !== $fresh->getAttributes()
            || ! $access->canDownload($actor, $fresh)
            || ! $storage->unambiguousLocator($fresh)) {
            return $this->maskedNotFound($actor, $audit, 'document.download', 'Denied evidence retrieval.');
        }

        $record = $fresh;
        $bytes = $object['bytes'];
        $disposition = $storage->attachmentDisposition($record);
        $audit->record(
            $actor,
            'document.download',
            'Downloaded protected Core Portal evidence.',
            entityType: 'document',
            entityId: $record->id,
        );

        // Preserve the streamed attachment ABI; emit only verified bytes.
        return new StreamedResponse(static function () use ($bytes): void {
            echo $bytes;
        }, 200, [
            ...self::SECURITY_HEADERS,
            'Content-Type' => $storage->attachmentMime($record),
            'Content-Disposition' => $disposition,
            'Content-Length' => (string) strlen($bytes),
        ]);
    }

    private function maskedNotFound(User $actor, AuditLogger $audit, string $action, string $summary): Response
    {
        try {
            $audit->record($actor, $action, $summary, outcome: 'denied');
        } catch (Throwable) {
            // Fail closed without exposing exception stack or body bytes when audit sink is unavailable.
        }

        return new Response('Not Found', 404, [
            ...self::SECURITY_HEADERS,
            'Content-Type' => 'text/plain; charset=UTF-8',
        ]);
    }
}
