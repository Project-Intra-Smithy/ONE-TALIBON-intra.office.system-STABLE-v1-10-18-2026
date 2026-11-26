<?php

declare(strict_types=1);

namespace App\Services\Custody;

use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\DocumentAttachmentService;
use App\Services\TransactionWorkflowService;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Only supported HTTP boundary for ordinary Work Request closure. N03 staging
 * uses TX1/TX2, and the actual workflow mutation + receipt + notices execute
 * on the one pinned n03_command connection. There is no default-DB fallback.
 */
final readonly class WorkRequestN03CloseService
{
    public function __construct(
        private LegacyCustodyStageService $stage,
        private LegacyCustodyCommandService $commands,
        private WorkRequestCloseDocumentPdf $pdf,
        private TransactionWorkflowService $workflow,
        private DocumentAttachmentService $attachments,
    ) {}

    /** @param list<UploadedFile> $uploads */
    public function close(
        User $actor,
        WorkflowTransaction $transaction,
        ?string $remarks,
        array $uploads = [],
    ): WorkflowTransaction {
        Gate::forUser($actor)->authorize('close', $transaction);

        $remarks = is_string($remarks) ? trim($remarks) : '';
        if ($remarks === '') {
            throw ValidationException::withMessages([
                'remarks' => 'A completion note is required.',
            ]);
        }

        // No default-DB or unconfigured production compatibility fallback.
        $namespace = trim((string) config('work_requests.n03_namespace_id', ''));
        $epoch = (int) config('work_requests.n03_epoch', 0);
        if (! Str::isUuid($namespace) || $epoch < 1) {
            throw ValidationException::withMessages([
                'action' => 'Work Request completion is unavailable until the N03 custody environment is authorized.',
            ]);
        }

        // N03 stage requires 1..5 genuine bytes-backed evidence items. The
        // first is a machine-attributed statement, not fabricated LGU approval.
        if (count($uploads) > 4) {
            throw ValidationException::withMessages([
                'evidence' => 'Closing evidence may contain up to four uploaded files.',
            ]);
        }
        $this->attachments->assertValidUploads($uploads);

        $generated = $this->pdf->write($transaction->reference_no, $remarks, (int) $actor->id);
        try {
            $items = [[
                'source_path' => $generated,
                'size_bytes' => (int) filesize($generated),
                'sha256' => hash_file('sha256', $generated),
                'mime_type' => 'application/pdf',
            ]];
            $metadata = [1 => [
                'title' => 'System-generated Work Request completion statement',
                'original_name' => 'work-request-completion.pdf',
            ]];

            foreach ($uploads as $index => $uploaded) {
                $path = $uploaded->getRealPath();
                if (! is_string($path) || ! is_file($path)) {
                    throw ValidationException::withMessages([
                        "evidence.$index" => 'The uploaded evidence is not readable for custody staging.',
                    ]);
                }

                $extension = strtolower($uploaded->getClientOriginalExtension());
                $mime = match ($extension) {
                    'pdf' => 'application/pdf',
                    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    'jpeg', 'jpg' => 'image/jpeg',
                    'png' => 'image/png',
                    'webp' => 'image/webp',
                    default => throw ValidationException::withMessages([
                        "evidence.$index" => 'The evidence type is not supported by N03 custody.',
                    ]),
                };
                $items[] = [
                    'source_path' => $path,
                    'size_bytes' => (int) $uploaded->getSize(),
                    'sha256' => hash_file('sha256', $path),
                    'mime_type' => $mime,
                ];
                $metadata[$index + 2] = [
                    'title' => 'Completion supporting evidence #'.($index + 1),
                    'original_name' => basename($uploaded->getClientOriginalName()),
                ];
            }

            $actor->loadMissing('employee');
            $officeId = (int) ($actor->employee?->department_id ?? 0);
            if ($officeId < 1) {
                throw ValidationException::withMessages([
                    'action' => 'An active receiving office is required for custody completion.',
                ]);
            }

            $correlation = (string) Str::uuid();
            $operation = $this->stage->reserveAndStage(
                namespaceId: $namespace,
                epoch: $epoch,
                actorUserId: (int) $actor->id,
                officeId: $officeId,
                serviceIdentity: 'ops009-ui-close',
                commandKind: 'transaction_transition',
                commandAction: 'close',
                correlationId: $correlation,
                idempotencyHash: hash('sha256', $transaction->id.':'.$actor->id.':'.$correlation),
                items: $items,
            );

            $outcome = $this->commands->execute(
                operationId: $operation['reservation']['operation_id'],
                businessCommand: fn (
                    ConnectionInterface $connection,
                    VerifiedCommandActor $verified,
                    string $commandCorrelation,
                ): ProducedSourceEvent => $this->workflow->transitionWithEventOnConnection(
                    connection: $connection,
                    actor: $verified,
                    transactionId: (int) $transaction->id,
                    action: 'close',
                    correlationId: $commandCorrelation,
                    remarks: $remarks,
                ),
                itemMetadataByOrdinal: $metadata,
                expectedSessionVersion: (int) $actor->session_version,
                expectedRole: (string) $actor->role,
            );

            return WorkflowTransaction::query()->findOrFail($outcome->sourceId);
        } finally {
            @unlink($generated);
        }
    }
}
