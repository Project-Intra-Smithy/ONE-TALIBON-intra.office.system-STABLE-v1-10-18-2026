<?php

namespace App\Domain\Workflow\Listeners;

use App\Domain\Workflow\Events\WorkflowTransactionCreated;
use App\Domain\Workflow\Events\WorkflowTransactionTransitioned;
use App\Domain\Workflow\WorkflowDefinitionResolver;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CorrespondenceAccessDecider;
use App\Services\PlatformNotificationService;
use Illuminate\Database\Eloquent\Collection;

final readonly class NotifyWorkflowTransactionMutation
{
    public function __construct(
        private PlatformNotificationService $notifications,
        private WorkflowDefinitionResolver $definitions,
        private CorrespondenceAccessDecider $correspondenceAccess,
    ) {}

    public function handle(
        WorkflowTransactionCreated|WorkflowTransactionTransitioned $domainEvent,
    ): void {
        $transaction = WorkflowTransaction::query()->findOrFail($domainEvent->transactionId);
        $event = TransactionEvent::query()->findOrFail($domainEvent->transactionEventId);

        if ($domainEvent instanceof WorkflowTransactionCreated) {
            $this->handleCreated($transaction, $event);

            return;
        }

        $this->handleTransitioned($domainEvent, $transaction, $event);
    }

    private function handleCreated(
        WorkflowTransaction $transaction,
        TransactionEvent $event,
    ): void {
        // The source link is not saved when the created event is dispatched.
        // Do not notify even generically until source-specific access exists.
        if ($transaction->transaction_type === 'document_review') {
            return;
        }

        $office = $this->activeOffice($transaction->current_department_id);

        if ($office) {
            $this->notifyOffice($office, $transaction, $event, true);
        }
    }

    private function handleTransitioned(
        WorkflowTransactionTransitioned $domainEvent,
        WorkflowTransaction $transaction,
        TransactionEvent $event,
    ): void {
        $rule = $this->definitions->resolve($transaction)->transition($domainEvent->action);

        if ($rule->requiresAssignment && $domainEvent->assignmentEmployeeId) {
            $this->notifyAssignedEmployee($transaction, $event, $domainEvent->assignmentEmployeeId);

            return;
        }

        if ($rule->refreshReceivedAt) {
            $office = $this->activeOffice($transaction->current_department_id);
            if ($office) {
                $this->notifyOffice($office, $transaction, $event);
            }

            return;
        }

        if ($rule->completes) {
            $this->notifyOriginDecision($transaction, $event, $domainEvent->action);
        }
    }

    private function notifyAssignedEmployee(
        WorkflowTransaction $transaction,
        TransactionEvent $event,
        int $assignmentId,
    ): void {
        $assigned = Employee::query()->with('user')->find($assignmentId);
        if (! $assigned?->user || ! $this->canReceive($assigned->user, $transaction)) {
            return;
        }

        $this->notifications->notifyUser($assigned->user, [
            'event_key' => 'transaction-event-'.$event->id,
            'department_id' => $transaction->current_department_id,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $transaction->id,
            'priority' => 'action_required',
            'title' => 'Work assigned to you',
            'message' => $transaction->reference_no.' · '.$transaction->title,
            'action_url' => '/transactions/'.$transaction->id,
        ]);
    }

    private function notifyOffice(
        Department $office,
        WorkflowTransaction $transaction,
        TransactionEvent $event,
        bool $initialReceipt = false,
    ): void {
        $this->dispatchOffice($office, $transaction, [
            'event_key' => 'transaction-event-'.$event->id,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $transaction->id,
            'priority' => $this->notificationPriority($transaction->priority),
            'title' => $this->officeNotificationTitle($office, $initialReceipt),
            'message' => $transaction->reference_no.' · '.$transaction->title,
            'action_url' => '/transactions/'.$transaction->id,
        ]);
    }

    private function notifyOriginDecision(
        WorkflowTransaction $transaction,
        TransactionEvent $event,
        string $action,
    ): void {
        $office = $this->activeOffice($transaction->origin_department_id);
        if (! $office) {
            return;
        }

        $this->dispatchOffice($office, $transaction, [
            'event_key' => 'transaction-event-'.$event->id,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $transaction->id,
            'priority' => 'action_required',
            'title' => $this->decisionTitle($action),
            'message' => $transaction->reference_no.' · '.$transaction->title,
            'action_url' => '/transactions/'.$transaction->id,
        ]);
    }

    /**
     * Scope notice delivery to users who can view the originating document.
     *
     * @param  array<string, mixed>  $payload
     */
    private function dispatchOffice(Department $office, WorkflowTransaction $transaction, array $payload): void
    {
        $sources = $this->linkedCorrespondence($transaction);
        if ($sources->isEmpty()) {
            // A document_review may be in its pre-link creation window.
            // Do not send title-bearing office notices without source proof.
            if ($transaction->transaction_type !== 'document_review') {
                $this->notifications->notifyDepartment($office, $payload);
            }

            return;
        }

        $recipients = User::query()
            ->where('is_active', true)
            ->whereHas('employee', fn ($employee) => $employee
                ->where('department_id', $office->id)
                ->where('employment_status', 'active'))
            ->with('employee')
            ->get();

        foreach ($recipients as $recipient) {
            if ($this->canViewEverySource($recipient, $sources)) {
                $this->notifications->notifyUser(
                    $recipient,
                    $payload + ['department_id' => $office->id],
                );
            }
        }
    }

    private function canReceive(User $recipient, WorkflowTransaction $transaction): bool
    {
        $sources = $this->linkedCorrespondence($transaction);
        if ($sources->isEmpty()) {
            // Preserve ordinary workflow assignments. A source-less
            // document_review has no verifiable correspondence provenance.
            return $transaction->transaction_type !== 'document_review';
        }

        return $this->canViewEverySource($recipient, $sources);
    }

    /** @return Collection<int, CorrespondenceRecord> */
    private function linkedCorrespondence(WorkflowTransaction $transaction): Collection
    {
        // Check all linked sources, including malformed legacy transaction
        // types. The order in which sources were created must never matter.
        return CorrespondenceRecord::query()
            ->where('workflow_transaction_id', $transaction->id)
            ->get();
    }

    /** @param Collection<int, CorrespondenceRecord> $sources */
    private function canViewEverySource(User $recipient, Collection $sources): bool
    {
        return $sources->isNotEmpty()
            && $sources->every(fn (CorrespondenceRecord $source): bool => $this->correspondenceAccess->canView($recipient, $source));
    }

    private function activeOffice(?int $officeId): ?Department
    {
        return $officeId
            ? Department::query()->activeRoutable()->find($officeId)
            : null;
    }

    private function officeNotificationTitle(Department $office, bool $initialReceipt): string
    {
        if (in_array($office->code, config('workflow.executive_attention_office_codes', []), true)) {
            return 'Executive action required';
        }

        return $initialReceipt ? 'New transaction received' : 'Transaction routed to your office';
    }

    private function decisionTitle(string $action): string
    {
        return match ($action) {
            'approve' => 'Transaction approved',
            'disapprove' => 'Transaction disapproved',
            default => 'Transaction completed',
        };
    }

    private function notificationPriority(string $priority): string
    {
        return match ($priority) {
            'urgent' => 'urgent',
            'high' => 'action_required',
            default => 'info',
        };
    }
}
