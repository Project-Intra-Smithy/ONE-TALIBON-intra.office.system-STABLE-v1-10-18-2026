<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\Document;
use App\Models\User;
use App\Services\AuditLogger;
use App\Services\Custody\Contracts\StorageBrokerClient;
use App\Services\DocumentAccessService;
use App\Services\LegacyPdfPreview;
use App\Services\PlanDocumentOriginGuard;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use PDOException;
use Symfony\Component\HttpFoundation\HeaderUtils;

/**
 * Stage 4 (G3) O(1) indexed REGISTRY_V1 egress service.
 *
 * Strictly enforces:
 * - Zero fallback to LegacyDocumentBytes
 * - Shared AuthorityFence read claim vs exclusive mutation barrier (G3-N01)
 * - Live actor verification on strictly read-only n03_reader connection
 * - All-parent authorization across all 6 morphs
 * - O(1) indexed lookup: bindings -> generations -> terminal_receipts(COMMITTED,1) -> operation_gates(OPEN,1)
 * - External non-rollback restore watermark verification (G3-N03)
 * - K3 separate-process broker readGeneration verification
 * - Pre-egress audit log persistence before releasing a single byte (G3-N02)
 */
final class RegistryDocumentRetrievalService
{
    public const READER_CONNECTION_NAME = 'n03_reader';

    private const ALLOWED_ATTACHMENT_MIMES = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
        'text/plain',
        'application/octet-stream',
    ];

    public function __construct(
        private readonly StorageBrokerClient $broker,
        private readonly AuthorityFence $authorityFence,
        private readonly ExternalWatermarkAuthority $watermarkAuthority,
        private readonly DocumentAccessService $documentAccess,
        private readonly AuditLogger $audit,
        private readonly string $readerConnectionName = self::READER_CONNECTION_NAME,
    ) {}

    /**
     * @param  ?callable(Document, object): void  $preAuditFaultHook
     * @return array{
     *     document: Document,
     *     bytes: string,
     *     mime: string,
     *     size: int,
     *     generation_id: string,
     *     receipt_uuid: string
     * }
     */
    public function retrieveForEgress(
        User $actor,
        string $publicId,
        bool $inlinePdf,
        ?callable $preAuditFaultHook = null,
    ): array {
        if (! Str::isUuid($publicId)) {
            throw new CustodyViolationException('Registry egress requires a valid UUID public_id.');
        }

        // Step 1: Load Document descriptor and enforce strict REGISTRY_V1 + non-Plan invariants.
        $document = Document::query()->where('public_id', $publicId)->first();
        if ($document === null
            || $document->getAttribute('custody_mode') !== 'REGISTRY_V1'
            || $document->getAttribute('security_domain') !== 'LEGACY_CTW'
            || $document->getAttribute('storage_disk') !== 'legacy_registry_v1'
            || $document->getAttribute('storage_path') !== null
            || ! is_string($document->getAttribute('custody_operation_id'))
            || ! Str::isUuid((string) $document->getAttribute('custody_operation_id'))
            || PlanDocumentOriginGuard::isProtected($document)) {
            throw new CustodyViolationException('Document is ineligible for REGISTRY_V1 egress.');
        }

        if ($inlinePdf && (string) $document->mime_type !== 'application/pdf') {
            throw new CustodyViolationException('Inline preview is restricted to application/pdf documents.');
        }

        // Step 2: Acquire cross-process shared authority read claim.
        $claim = $this->authorityFence->acquireSharedReadClaim();

        try {
            $reader = $this->resolveReaderConnection();
            $this->assertReaderSessionIdentity($reader);

            // Step 3: Verify live actor state on strictly read-only n03_reader connection.
            $liveOfficeId = $this->resolveLiveOfficeId($reader, (int) $actor->getKey());
            VerifiedCommandActor::verifyOnConnection(
                connection: $reader,
                actorUserId: (int) $actor->getKey(),
                expectedOfficeId: $liveOfficeId,
                expectedRole: (string) $actor->role,
            );

            $verifiedMunicipal = VerifiedMunicipalActor::forProtectedSource($actor);

            // Confirm Plan quarantine directly on the pinned reader connection.
            $hasPlanMarker = $reader->selectOne(
                'SELECT EXISTS(SELECT 1 FROM public.plan_document_origin_receipts WHERE document_id = ?) '
                .'OR EXISTS(SELECT 1 FROM public.plan_document_bindings WHERE document_id = ?) AS protected',
                [(int) $document->getKey(), (int) $document->getKey()],
            );
            if ($hasPlanMarker !== null && (bool) $hasPlanMarker->protected) {
                throw new CustodyViolationException('Document carries Plan provenance quarantine markers.');
            }

            // Step 4: Verify all linked parents across all 6 morphs are authorized.
            if (! $this->documentAccess->allLinkedParentsAuthorized($verifiedMunicipal, $document)) {
                throw new AuthorizationException('Actor is not authorized across all linked document parents.');
            }

            // Step 5: O(1) primary-key indexed join across bindings, generations, terminal_receipts, operation_gates.
            $binding = $reader->selectOne(<<<'SQL'
                SELECT
                    b.document_id,
                    b.document_public_id,
                    b.generation_id,
                    b.operation_id,
                    b.ordinal,
                    g.namespace_id,
                    g.epoch,
                    g.locator,
                    g.size_bytes,
                    g.sha256,
                    g.mime_type,
                    g.provider_object_identity,
                    tr.receipt_uuid,
                    tr.outcome AS receipt_outcome,
                    tr.fence_no AS receipt_fence_no,
                    og.state AS gate_state,
                    og.fence_no AS gate_fence_no
                FROM legacy_custody.bindings b
                JOIN legacy_custody.generations g
                  ON g.generation_id = b.generation_id
                JOIN legacy_custody.terminal_receipts tr
                  ON tr.operation_id = b.operation_id
                 AND tr.outcome = 'COMMITTED'
                 AND tr.fence_no = 1
                JOIN legacy_custody.operation_gates og
                  ON og.operation_id = b.operation_id
                 AND og.state = 'OPEN'
                 AND og.fence_no = 1
                WHERE b.document_id = ?
                  AND b.document_public_id = ?
                SQL, [(int) $document->getKey(), strtolower($publicId)]);

            if ($binding === null) {
                throw new CustodyViolationException('No committed REGISTRY_V1 binding found for document.');
            }

            $freshDoc = $reader->table('documents')
                ->select([
                    'id',
                    'public_id',
                    'mime_type',
                    'size_bytes',
                    'checksum_sha256',
                    'storage_disk',
                    'storage_path',
                    'security_domain',
                    'custody_mode',
                    'custody_operation_id',
                    'custody_ordinal',
                ])
                ->where('id', (int) $document->getKey())
                ->first();

            if ($freshDoc === null
                || (string) $freshDoc->custody_mode !== 'REGISTRY_V1'
                || (string) $freshDoc->security_domain !== 'LEGACY_CTW'
                || (string) $freshDoc->storage_disk !== 'legacy_registry_v1'
                || $freshDoc->storage_path !== null
                || strtolower((string) $freshDoc->public_id) !== strtolower((string) $binding->document_public_id)
                || strtolower((string) $freshDoc->custody_operation_id) !== strtolower((string) $binding->operation_id)
                || (int) $freshDoc->custody_ordinal !== (int) $binding->ordinal
                || (int) $freshDoc->size_bytes !== (int) $binding->size_bytes
                || (string) $freshDoc->checksum_sha256 !== (string) $binding->sha256
                || (string) $freshDoc->mime_type !== (string) $binding->mime_type) {
                throw new CustodyViolationException('Public document descriptor diverges from committed REGISTRY_V1 binding.');
            }

            // Verify zero drifted links outside committed ownership_links.
            $linkParity = $reader->selectOne(
                'SELECT (SELECT count(*) FROM public.document_links WHERE document_id = ?) AS pub_count, '
                .'(SELECT count(*) FROM legacy_custody.ownership_links WHERE binding_document_id = ?) AS own_count',
                [(int) $document->getKey(), (int) $document->getKey()],
            );
            if ($linkParity === null
                || (int) $linkParity->pub_count < 1
                || (int) $linkParity->pub_count !== (int) $linkParity->own_count) {
                throw new CustodyViolationException('Document link set diverges from committed ownership_links.');
            }

            // Step 6: Verify External Non-Rollback Restore Watermark against DB watermark_checkpoints.
            $checkpoint = $reader->selectOne(<<<'SQL'
                SELECT checkpoint_seq, epoch, state_anchor_digest
                FROM legacy_custody.watermark_checkpoints
                WHERE namespace_id = ?
                ORDER BY checkpoint_seq DESC
                LIMIT 1
                SQL, [(string) $binding->namespace_id]);

            $dbMaxSeq = $checkpoint !== null ? (int) $checkpoint->checkpoint_seq : 0;
            $dbLatestAnchor = $checkpoint !== null ? (string) $checkpoint->state_anchor_digest : null;
            $expectedEpoch = max((int) $binding->epoch, $checkpoint !== null ? (int) $checkpoint->epoch : 0);

            $this->watermarkAuthority->verifyAgainstDatabase(
                namespaceId: (string) $binding->namespace_id,
                expectedEpoch: $expectedEpoch,
                dbMaxCheckpointSeq: $dbMaxSeq,
                dbLatestAnchorDigest: $dbLatestAnchor,
            );

            // Step 7: Read verified bounded bytes from isolated K3 storage broker.
            $readObject = $this->broker->readGeneration(
                namespaceId: (string) $binding->namespace_id,
                generationId: (string) $binding->generation_id,
                locator: (string) $binding->locator,
                expectedProviderObjectIdentity: (string) $binding->provider_object_identity,
                expectedSize: (int) $binding->size_bytes,
                expectedSha256: (string) $binding->sha256,
            );

            $bytes = $readObject->bytes;
            if (strlen($bytes) !== (int) $binding->size_bytes
                || ! hash_equals((string) $binding->sha256, hash('sha256', $bytes))
                || $readObject->providerObjectIdentity !== (string) $binding->provider_object_identity) {
                throw new CustodyViolationException('Broker returned bytes failed post-read integrity verification.');
            }

            if ($inlinePdf) {
                if ((string) $binding->mime_type !== 'application/pdf' || ! LegacyPdfPreview::isValidPdfBytes($bytes)) {
                    throw new CustodyViolationException('REGISTRY_V1 object failed strict inline PDF structural checks.');
                }
            }

            // Step 8: Re-verify unbroken authority fence claim and live actor before audit.
            $this->authorityFence->assertClaimUnbroken($claim);
            VerifiedCommandActor::verifyOnConnection(
                connection: $reader,
                actorUserId: (int) $actor->getKey(),
                expectedOfficeId: $liveOfficeId,
                expectedRole: (string) $actor->role,
            );

            // Step 9: Invoke optional fault hook (G3-N02) and persist audit row BEFORE releasing bytes.
            if ($preAuditFaultHook !== null) {
                $preAuditFaultHook($document, $binding);
            }

            $this->audit->record(
                $actor,
                $inlinePdf ? 'document.preview' : 'document.download',
                $inlinePdf
                    ? 'Authorized protected Core Portal registry evidence preview.'
                    : 'Downloaded protected Core Portal registry evidence.',
                outcome: 'allowed',
                entityType: 'document',
                entityId: (int) $document->getKey(),
            );

            return [
                'document' => $document,
                'bytes' => $bytes,
                'mime' => (string) $binding->mime_type,
                'size' => (int) $binding->size_bytes,
                'generation_id' => (string) $binding->generation_id,
                'receipt_uuid' => (string) $binding->receipt_uuid,
            ];
        } finally {
            $this->authorityFence->releaseClaim($claim);
        }
    }

    public function attachmentDisposition(Document $document): string
    {
        $name = basename(str_replace('\\', '/', (string) ($document->original_name ?: $document->title)));
        $name = preg_replace('/[\p{C}\/%]/u', '_', $name) ?: 'evidence-file';
        $name = Str::limit($name, 180, '');
        $fallback = preg_replace('/[^A-Za-z0-9._-]/', '_', Str::ascii($name)) ?: 'evidence-file';

        return HeaderUtils::makeDisposition(HeaderUtils::DISPOSITION_ATTACHMENT, $name, $fallback);
    }

    public function attachmentMime(string $mime): string
    {
        return in_array($mime, self::ALLOWED_ATTACHMENT_MIMES, true)
            ? $mime
            : 'application/octet-stream';
    }

    private function resolveReaderConnection(): ConnectionInterface
    {
        if ($this->readerConnectionName !== self::READER_CONNECTION_NAME) {
            throw new CustodyViolationException('Registry egress is strictly pinned to the n03_reader connection.');
        }

        $connection = DB::connection($this->readerConnectionName);
        if ($connection->getName() !== self::READER_CONNECTION_NAME) {
            throw new CustodyViolationException('Registry egress reader connection identity drift detected.');
        }

        return $connection;
    }

    private function assertReaderSessionIdentity(ConnectionInterface $reader): void
    {
        try {
            $identity = $reader->selectOne('SELECT session_user AS session_user, current_user AS current_user');
        } catch (QueryException|PDOException $exception) {
            throw new CustodyViolationException('Registry egress n03_reader connection is unavailable.', previous: $exception);
        }

        if ($identity === null
            || (string) $identity->session_user !== self::READER_CONNECTION_NAME
            || (string) $identity->current_user !== self::READER_CONNECTION_NAME) {
            throw new CustodyViolationException('Registry egress must query PostgreSQL exclusively as role n03_reader.');
        }
    }

    private function resolveLiveOfficeId(ConnectionInterface $reader, int $actorUserId): int
    {
        if ($actorUserId <= 0) {
            throw new AuthorizationException('Registry egress requires a positive authenticated actor user ID.');
        }

        $employee = $reader->table('employees')
            ->select(['department_id'])
            ->where('user_id', $actorUserId)
            ->first();

        if ($employee === null || (int) $employee->department_id <= 0) {
            throw new AuthorizationException('Registry egress actor has no active municipal office assignment.');
        }

        return (int) $employee->department_id;
    }
}
