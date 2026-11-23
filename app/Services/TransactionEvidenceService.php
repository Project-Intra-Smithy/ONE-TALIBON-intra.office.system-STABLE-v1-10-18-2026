<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Throwable;

final class TransactionEvidenceService
{
    public function __construct(
        private readonly TransactionWorkflowService $workflow,
        private readonly DocumentAttachmentService $attachments,
    ) {}

    /** @param array<string, mixed> $data @param array<int, \Illuminate\Http\UploadedFile> $files */
    public function create(User $actor, array $data, array $files): WorkflowTransaction
    {
        if ($files === []) {
            return $this->workflow->create($actor, $data);
        }

        $this->attachments->assertValidUploads($files);
        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $data, $files, &$attached): WorkflowTransaction {
                ['transaction' => $transaction, 'event' => $event] = $this->workflow->createWithEvent($actor, $data);

                $attached = $this->attachments->attach($actor, $files, [
                    ['model' => $transaction, 'relationship' => 'supporting_document'],
                    ['model' => $event, 'relationship' => 'route_evidence'],
                ]);

                return $transaction;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /** @param array<int, UploadedFile> $files */
    public function transition(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
        ?int $targetDepartmentId,
        ?int $assignedEmployeeId,
        ?string $remarks,
        array $files,
    ): WorkflowTransaction {
        if ($files === []) {
            return $this->workflow->transition(
                $actor,
                $transaction,
                $action,
                $targetDepartmentId,
                $assignedEmployeeId,
                $remarks,
            );
        }

        $this->attachments->assertValidUploads($files);
        $attached = [];

        try {
            return DB::transaction(function () use (
                $actor,
                $transaction,
                $action,
                $targetDepartmentId,
                $assignedEmployeeId,
                $remarks,
                $files,
                &$attached,
            ): WorkflowTransaction {
                ['transaction' => $updated, 'event' => $event] = $this->workflow->transitionWithEvent(
                    $actor,
                    $transaction,
                    $action,
                    $targetDepartmentId,
                    $assignedEmployeeId,
                    $remarks,
                );

                $attached = $this->attachments->attach($actor, $files, [[
                    'model' => $event,
                    'relationship' => $this->relationshipForAction($action),
                ]]);

                return $updated;
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    private function relationshipForAction(string $action): string
    {
        return in_array($action, [
            'forward',
            'send_to_mayor',
            'return_origin',
            'request_information',
        ], true) ? 'route_evidence' : 'action_evidence';
    }
}
