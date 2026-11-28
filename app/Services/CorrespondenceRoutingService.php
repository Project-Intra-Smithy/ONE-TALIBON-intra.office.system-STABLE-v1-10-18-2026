<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\Workflow\WorkflowDefinitionResolver;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Carbon\CarbonInterface;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;

class CorrespondenceRoutingService
{
    private const WORKFLOW_TYPE = 'document_review';

    private const ROUTE_ROLES = [
        'department_head',
        'mayor_approver',
        'hr_officer',
        'legislative_staff',
    ];

    private const ACTION_ROLES = [
        'department_head',
        'department_staff',
        'mayor_approver',
        'mayor_staff',
        'hr_officer',
        'legislative_staff',
    ];

    private const CONFIDENTIAL_VIEW_ROLES = [
        'department_head',
        'mayor_approver',
        'hr_officer',
        'legislative_staff',
    ];

    private const RESTRICTED_VIEW_ROLES = [
        'department_head',
        'mayor_approver',
    ];

    public function __construct(
        private readonly CorrespondenceAccessDecider $access,
        private readonly TransactionWorkflowService $workflow,
        private readonly CorrespondenceWorkflowStateMapper $workflowStates,
        private readonly CorrespondenceEventRecorder $events,
        private readonly TransactionalOutbox $outbox,
        private readonly AuditLogger $audit,
        private readonly ?WorkflowDefinitionResolver $definitions = null,
    ) {}

    /** @param array{target_department_id:int, priority:string, due_at?:mixed, remarks?:mixed} $data */
    public function route(
        User $actor,
        CorrespondenceRecord $correspondence,
        array $data,
        string $correlationId,
    ): CorrespondenceRecord {
        return $this->routeWithEvent($actor, $correspondence, $data, $correlationId)['record'];
    }

    /**
     * @param  array{target_department_id:int, priority:string, due_at?:mixed, remarks?:mixed}  $data
     * @return array{record: CorrespondenceRecord, event: CorrespondenceEvent}
     */
    public function routeWithEvent(
        User $actor,
        CorrespondenceRecord $correspondence,
        array $data,
        string $correlationId,
    ): array {
        return DB::transaction(function () use ($actor, $correspondence, $data, $correlationId): array {
            $locked = $this->lockClassifiedForRoute($actor, $correspondence);
            $workflow = $this->createLinkedWorkflow($actor, $locked, $data);
            $routedAt = now();

            $this->applyRoutedState($locked, $actor, $workflow, $routedAt);
            $event = $this->recordRoutedBoundary($locked, $actor, $workflow, $data, $correlationId, $routedAt);

            return [
                'record' => $locked->fresh(['workflowTransaction']),
                'event' => $event,
            ];
        });
    }

    /** @param array{target_department_id:int, priority:string, due_at?:mixed, remarks?:mixed} $data */
    public function routeWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $correspondenceId,
        array $data,
        string $correlationId,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Correspondence custody routing requires an active database transaction.');
        }

        $locked = $connection->table('correspondence_records')
            ->select([
                'id',
                'external_reference_no',
                'municipal_reference_no',
                'subject',
                'summary',
                'classification',
                'receiving_department_id',
                'lifecycle_state',
                'workflow_transaction_id',
            ])
            ->where('id', $correspondenceId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(CorrespondenceRecord::class, [$correspondenceId]);
        }

        if ((string) $locked->lifecycle_state !== CorrespondenceLifecycleState::Classified->value) {
            throw ValidationException::withMessages(['correspondence' => 'Only classified correspondence can be routed.']);
        }

        if ($locked->workflow_transaction_id !== null) {
            throw ValidationException::withMessages(['correspondence' => 'This correspondence is already linked to a workflow transaction.']);
        }

        if (! in_array($actor->role, self::ROUTE_ROLES, true)
            || ! $this->canViewOnConnection($connection, $actor, $locked)) {
            throw new AuthorizationException('You are not authorized to route this correspondence.');
        }

        $prefix = is_string($locked->municipal_reference_no) && $locked->municipal_reference_no !== ''
            ? $locked->municipal_reference_no
            : (string) $locked->external_reference_no;

        $workflowProduced = $this->workflow->createWithEventOnConnection($connection, $actor, [
            'transaction_type' => self::WORKFLOW_TYPE,
            'title' => Str::limit($prefix.' — '.(string) $locked->subject, 255, ''),
            'description' => $locked->summary,
            'priority' => $data['priority'],
            'target_department_id' => $data['target_department_id'],
            'due_at' => $data['due_at'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ], $correlationId);

        $workflowRow = $connection->table('transactions')
            ->select(['id', 'reference_no', 'transaction_type', 'status', 'current_department_id', 'assigned_employee_id'])
            ->where('id', $workflowProduced->sourceId)
            ->first();

        $definition = ($this->definitions ?? app(WorkflowDefinitionResolver::class))->resolve(self::WORKFLOW_TYPE);
        if ($workflowRow === null
            || (string) $workflowRow->status !== $definition->initialStatus()
            || $workflowRow->assigned_employee_id !== null) {
            throw ValidationException::withMessages(['workflow' => 'The newly created workflow transaction is not in the expected routed state.']);
        }

        $routedAt = now();
        $timestamp = $routedAt->format('Y-m-d H:i:sP');

        $connection->table('correspondence_records')
            ->where('id', $correspondenceId)
            ->update([
                'workflow_transaction_id' => (int) $workflowRow->id,
                'routed_by_user_id' => $actor->userId,
                'routed_at' => $timestamp,
                'lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
                'updated_at' => $timestamp,
            ]);

        $metadata = [
            'workflow_transaction_id' => (int) $workflowRow->id,
            'workflow_reference_no' => $workflowRow->reference_no,
            'target_department_id' => (int) $workflowRow->current_department_id,
        ];

        $eventId = (int) $connection->table('correspondence_events')->insertGetId([
            'correspondence_record_id' => $correspondenceId,
            'event' => 'routed',
            'previous_lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
            'new_lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
            'actor_user_id' => $actor->userId,
            'office_department_id' => $actor->officeId,
            'remarks' => isset($data['remarks']) && is_string($data['remarks']) ? $data['remarks'] : null,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'correlation_id' => $correlationId,
            'occurred_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'correspondence.routed',
            summary: 'Human municipal actor routed classified correspondence through the existing workflow engine.',
            correlationId: $correlationId,
            entityType: 'correspondence_record',
            entityId: $correspondenceId,
            createdAt: $routedAt,
        );

        return new ProducedSourceEvent(
            sourceKind: 'correspondence',
            sourceId: $correspondenceId,
            eventId: $eventId,
            eventAction: 'routed',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
            classification: is_string($locked->classification) && $locked->classification !== ''
                ? $locked->classification
                : 'internal',
        );
    }

    public function markInAction(
        User $actor,
        CorrespondenceRecord $correspondence,
        string $correlationId,
        ?string $remarks = null,
    ): CorrespondenceRecord {
        return $this->markInActionWithEvent($actor, $correspondence, $correlationId, $remarks)['record'];
    }

    /**
     * @return array{record: CorrespondenceRecord, event: CorrespondenceEvent}
     */
    public function markInActionWithEvent(
        User $actor,
        CorrespondenceRecord $correspondence,
        string $correlationId,
        ?string $remarks = null,
    ): array {
        return DB::transaction(function () use ($actor, $correspondence, $correlationId, $remarks): array {
            $locked = $this->lockRoutedForAction($actor, $correspondence);
            $workflow = $this->lockActionableWorkflow($locked);
            $actedAt = now();

            $this->applyInActionState($locked, $actor, $actedAt);
            $event = $this->recordInActionBoundary($locked, $actor, $workflow, $remarks, $correlationId, $actedAt);

            return [
                'record' => $locked->fresh(['workflowTransaction']),
                'event' => $event,
            ];
        });
    }

    public function markInActionWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $correspondenceId,
        string $correlationId,
        ?string $remarks = null,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Correspondence custody action requires an active database transaction.');
        }

        $locked = $connection->table('correspondence_records')
            ->select([
                'id',
                'classification',
                'receiving_department_id',
                'lifecycle_state',
                'workflow_transaction_id',
            ])
            ->where('id', $correspondenceId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(CorrespondenceRecord::class, [$correspondenceId]);
        }

        if ((string) $locked->lifecycle_state !== CorrespondenceLifecycleState::Routed->value) {
            throw ValidationException::withMessages(['correspondence' => 'Only routed correspondence can enter action.']);
        }

        if (! in_array($actor->role, self::ACTION_ROLES, true)) {
            throw new AuthorizationException('You are not authorized to act on this correspondence.');
        }

        if ($locked->workflow_transaction_id === null) {
            throw ValidationException::withMessages(['workflow' => 'A linked workflow transaction is required before correspondence can enter action.']);
        }

        $workflow = $connection->table('transactions')
            ->select(['id', 'reference_no', 'transaction_type', 'status', 'current_department_id', 'assigned_employee_id'])
            ->where('id', (int) $locked->workflow_transaction_id)
            ->lockForUpdate()
            ->first();

        if (! $this->canViewOnConnection($connection, $actor, $locked)) {
            throw new AuthorizationException('You are not authorized to act on this correspondence.');
        }

        if ($workflow === null || ! $this->workflowPermitsInAction($workflow)) {
            throw ValidationException::withMessages(['workflow' => 'The linked workflow transaction has not reached an actionable state.']);
        }

        $actedAt = now();
        $timestamp = $actedAt->format('Y-m-d H:i:sP');

        $connection->table('correspondence_records')
            ->where('id', $correspondenceId)
            ->update([
                'action_started_by_user_id' => $actor->userId,
                'action_started_at' => $timestamp,
                'lifecycle_state' => CorrespondenceLifecycleState::InAction->value,
                'updated_at' => $timestamp,
            ]);

        $metadata = [
            'workflow_transaction_id' => (int) $workflow->id,
            'workflow_reference_no' => $workflow->reference_no,
            'workflow_status' => $workflow->status,
            'assigned_employee_id' => $workflow->assigned_employee_id !== null ? (int) $workflow->assigned_employee_id : null,
        ];

        $eventId = (int) $connection->table('correspondence_events')->insertGetId([
            'correspondence_record_id' => $correspondenceId,
            'event' => 'in_action',
            'previous_lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
            'new_lifecycle_state' => CorrespondenceLifecycleState::InAction->value,
            'actor_user_id' => $actor->userId,
            'office_department_id' => $actor->officeId,
            'remarks' => $remarks,
            'metadata' => json_encode($metadata, JSON_THROW_ON_ERROR),
            'correlation_id' => $correlationId,
            'occurred_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'correspondence.in_action',
            summary: 'Human municipal actor synchronized routed correspondence to an actionable linked workflow state.',
            correlationId: $correlationId,
            entityType: 'correspondence_record',
            entityId: $correspondenceId,
            createdAt: $actedAt,
        );

        return new ProducedSourceEvent(
            sourceKind: 'correspondence',
            sourceId: $correspondenceId,
            eventId: $eventId,
            eventAction: 'in_action',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
            classification: is_string($locked->classification) && $locked->classification !== ''
                ? $locked->classification
                : 'internal',
        );
    }

    private function workflowPermitsInAction(object $workflow): bool
    {
        $definition = ($this->definitions ?? app(WorkflowDefinitionResolver::class))
            ->resolve((string) $workflow->transaction_type);

        $status = (string) $workflow->status;
        if ($definition->isTerminal($status)) {
            return false;
        }

        if ($workflow->assigned_employee_id !== null) {
            return true;
        }

        $activeStatuses = [];
        foreach (['mark_review', 'send_to_mayor'] as $action) {
            if (! in_array($action, $definition->actions(), true)) {
                continue;
            }

            $targetStatus = $definition->transition($action)->status;
            if ($targetStatus !== null) {
                $activeStatuses[] = $targetStatus;
            }
        }

        return in_array($status, array_values(array_unique($activeStatuses)), true);
    }

    private function canViewOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        object $record,
    ): bool {
        if ($record->workflow_transaction_id !== null) {
            $workflow = $connection->table('transactions')
                ->select(['assigned_employee_id', 'current_department_id'])
                ->where('id', (int) $record->workflow_transaction_id)
                ->first();

            if ($workflow === null
                || ((int) $workflow->assigned_employee_id !== $actor->employeeId
                    && (int) $workflow->current_department_id !== $actor->officeId)) {
                return false;
            }
        } elseif ($record->receiving_department_id === null
            || (int) $record->receiving_department_id !== $actor->officeId) {
            return false;
        }

        $classification = is_string($record->classification) ? $record->classification : null;
        if ($classification === null
            || in_array($classification, [
                CorrespondenceClassification::Public->value,
                CorrespondenceClassification::Internal->value,
            ], true)) {
            return in_array($actor->role, self::ACTION_ROLES, true);
        }

        if ($classification === CorrespondenceClassification::Confidential->value) {
            return in_array($actor->role, self::CONFIDENTIAL_VIEW_ROLES, true);
        }

        return in_array($actor->role, self::RESTRICTED_VIEW_ROLES, true);
    }

    private function lockClassifiedForRoute(User $actor, CorrespondenceRecord $correspondence): CorrespondenceRecord
    {
        $locked = CorrespondenceRecord::query()->lockForUpdate()->findOrFail($correspondence->id);

        if ($locked->lifecycle_state !== CorrespondenceLifecycleState::Classified) {
            throw ValidationException::withMessages(['correspondence' => 'Only classified correspondence can be routed.']);
        }

        if ($locked->workflow_transaction_id !== null) {
            throw ValidationException::withMessages(['correspondence' => 'This correspondence is already linked to a workflow transaction.']);
        }

        if (! $this->access->canRoute($actor, $locked)) {
            throw new AuthorizationException('You are not authorized to route this correspondence.');
        }

        return $locked;
    }

    /** @param array{target_department_id:int, priority:string, due_at?:mixed, remarks?:mixed} $data */
    private function createLinkedWorkflow(
        User $actor,
        CorrespondenceRecord $record,
        array $data,
    ): WorkflowTransaction {
        $workflow = $this->workflow->createWithinExistingTransaction($actor, [
            'transaction_type' => self::WORKFLOW_TYPE,
            'title' => Str::limit(($record->municipal_reference_no ?? $record->external_reference_no).' — '.$record->subject, 255, ''),
            'description' => $record->summary,
            'priority' => $data['priority'],
            'target_department_id' => $data['target_department_id'],
            'due_at' => $data['due_at'] ?? null,
            'remarks' => $data['remarks'] ?? null,
        ]);

        if (! $this->workflowStates->representsRouted($workflow)) {
            throw ValidationException::withMessages(['workflow' => 'The newly created workflow transaction is not in the expected routed state.']);
        }

        return $workflow;
    }

    private function applyRoutedState(
        CorrespondenceRecord $record,
        User $actor,
        WorkflowTransaction $workflow,
        CarbonInterface $routedAt,
    ): void {
        $record->forceFill([
            'workflow_transaction_id' => $workflow->id,
            'routed_by_user_id' => $actor->id,
            'routed_at' => $routedAt,
            'lifecycle_state' => CorrespondenceLifecycleState::Routed,
        ])->save();
    }

    /** @param array{target_department_id:int, priority:string, due_at?:mixed, remarks?:mixed} $data */
    private function recordRoutedBoundary(
        CorrespondenceRecord $record,
        User $actor,
        WorkflowTransaction $workflow,
        array $data,
        string $correlationId,
        CarbonInterface $routedAt,
    ): CorrespondenceEvent {
        $actor->loadMissing('employee');
        $officeId = (int) $actor->employee->department_id;
        $metadata = [
            'workflow_transaction_id' => $workflow->id,
            'workflow_reference_no' => $workflow->reference_no,
            'target_department_id' => (int) $workflow->current_department_id,
        ];

        $event = $this->events->record(
            $record,
            'routed',
            CorrespondenceLifecycleState::Classified,
            CorrespondenceLifecycleState::Routed,
            actor: $actor,
            officeDepartmentId: $officeId,
            remarks: $data['remarks'] ?? null,
            metadata: $metadata,
            correlationId: $correlationId,
            occurredAt: $routedAt,
        );
        $this->outbox->record('correspondence.routed', 'correspondence_record', $record->public_id, [
            'correspondence_public_id' => $record->public_id,
            'municipal_reference_no' => $record->municipal_reference_no,
            'lifecycle_state' => CorrespondenceLifecycleState::Routed->value,
            ...$metadata,
        ], $routedAt);
        $this->audit->record(
            $actor,
            'correspondence.routed',
            'Human municipal actor routed classified correspondence through the existing workflow engine.',
            entityType: 'correspondence_record',
            entityId: $record->id,
        );

        return $event;
    }

    private function lockRoutedForAction(User $actor, CorrespondenceRecord $correspondence): CorrespondenceRecord
    {
        $locked = CorrespondenceRecord::query()->lockForUpdate()->findOrFail($correspondence->id);

        if ($locked->lifecycle_state !== CorrespondenceLifecycleState::Routed) {
            throw ValidationException::withMessages(['correspondence' => 'Only routed correspondence can enter action.']);
        }

        if (! $this->access->canAct($actor, $locked)) {
            throw new AuthorizationException('You are not authorized to act on this correspondence.');
        }

        if ($locked->workflow_transaction_id === null) {
            throw ValidationException::withMessages(['workflow' => 'A linked workflow transaction is required before correspondence can enter action.']);
        }

        return $locked;
    }

    private function lockActionableWorkflow(CorrespondenceRecord $record): WorkflowTransaction
    {
        $workflow = WorkflowTransaction::query()->lockForUpdate()->find($record->workflow_transaction_id);

        if (! $workflow instanceof WorkflowTransaction || ! $this->workflowStates->permitsInAction($workflow)) {
            throw ValidationException::withMessages(['workflow' => 'The linked workflow transaction has not reached an actionable state.']);
        }

        return $workflow;
    }

    private function applyInActionState(CorrespondenceRecord $record, User $actor, CarbonInterface $actedAt): void
    {
        $record->forceFill([
            'action_started_by_user_id' => $actor->id,
            'action_started_at' => $actedAt,
            'lifecycle_state' => CorrespondenceLifecycleState::InAction,
        ])->save();
    }

    private function recordInActionBoundary(
        CorrespondenceRecord $record,
        User $actor,
        WorkflowTransaction $workflow,
        ?string $remarks,
        string $correlationId,
        CarbonInterface $actedAt,
    ): CorrespondenceEvent {
        $actor->loadMissing('employee');
        $metadata = [
            'workflow_transaction_id' => $workflow->id,
            'workflow_reference_no' => $workflow->reference_no,
            'workflow_status' => $workflow->status,
            'assigned_employee_id' => $workflow->assigned_employee_id,
        ];

        $event = $this->events->record(
            $record,
            'in_action',
            CorrespondenceLifecycleState::Routed,
            CorrespondenceLifecycleState::InAction,
            actor: $actor,
            officeDepartmentId: (int) $actor->employee->department_id,
            remarks: $remarks,
            metadata: $metadata,
            correlationId: $correlationId,
            occurredAt: $actedAt,
        );
        $this->outbox->record('correspondence.in_action', 'correspondence_record', $record->public_id, [
            'correspondence_public_id' => $record->public_id,
            'municipal_reference_no' => $record->municipal_reference_no,
            'lifecycle_state' => CorrespondenceLifecycleState::InAction->value,
            'current_department_id' => (int) $workflow->current_department_id,
            ...$metadata,
        ], $actedAt);
        $this->audit->record(
            $actor,
            'correspondence.in_action',
            'Human municipal actor synchronized routed correspondence to an actionable linked workflow state.',
            entityType: 'correspondence_record',
            entityId: $record->id,
        );

        return $event;
    }
}
