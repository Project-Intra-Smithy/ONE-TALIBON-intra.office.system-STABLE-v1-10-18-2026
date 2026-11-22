<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Authorization\AuthorizationContext;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\Workflow\Authorization\TransactionAccessDecider;
use App\Domain\Workflow\Authorization\TransactionCapabilities;
use App\Domain\Workflow\Events\WorkflowTransactionCreated;
use App\Domain\Workflow\Events\WorkflowTransactionTransitioned;
use App\Domain\Workflow\ResolvedWorkflowTransition;
use App\Domain\Workflow\SlaResolver;
use App\Domain\Workflow\WorkflowDefinition;
use App\Domain\Workflow\WorkflowDefinitionResolver;
use App\Domain\Workflow\WorkflowDestinationResolver;
use App\Domain\Workflow\WorkflowTransitionRule;
use App\Models\Department;
use App\Models\Employee;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use LogicException;

class TransactionWorkflowService
{
    public function __construct(
        private readonly WorkflowDefinitionResolver $definitions,
        private readonly WorkflowDestinationResolver $destinations,
        private readonly SlaResolver $sla,
        private readonly ?AuditLogger $audit = null,
        private readonly ?TransactionCapabilities $capabilities = null,
        private readonly ?TransactionAccessDecider $access = null,
    ) {}

    public function create(User $actor, array $data): WorkflowTransaction
    {
        return $this->createWithEvent($actor, $data)['transaction'];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{transaction: WorkflowTransaction, event: TransactionEvent}
     */
    public function createWithEvent(User $actor, array $data): array
    {
        Gate::forUser($actor)->authorize('create', WorkflowTransaction::class);
        $originDepartmentId = $this->originDepartmentId($actor);
        $targetDepartment = $this->receivingDepartment(
            (int) $data['target_department_id'],
            $originDepartmentId,
        );

        return DB::transaction(
            fn (): array => $this->createWithinTransactionWithEvent(
                $actor,
                $data,
                $originDepartmentId,
                $targetDepartment,
            ),
        );
    }

    public function createWithinExistingTransaction(User $actor, array $data): WorkflowTransaction
    {
        Gate::forUser($actor)->authorize('create', WorkflowTransaction::class);

        if (DB::connection()->transactionLevel() < 1) {
            throw new LogicException('Workflow creation through this boundary requires an existing database transaction.');
        }

        $originDepartmentId = $this->originDepartmentId($actor);
        $targetDepartment = $this->receivingDepartment(
            (int) $data['target_department_id'],
            $originDepartmentId,
        );

        return $this->createWithinTransactionWithEvent(
            $actor,
            $data,
            $originDepartmentId,
            $targetDepartment,
        )['transaction'];
    }

    public function transition(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
        ?int $targetDepartmentId = null,
        ?int $assignedEmployeeId = null,
        ?string $remarks = null,
    ): WorkflowTransaction {
        return $this->transitionWithEvent(
            $actor,
            $transaction,
            $action,
            $targetDepartmentId,
            $assignedEmployeeId,
            $remarks,
        )['transaction'];
    }

    /**
     * @return array{transaction: WorkflowTransaction, event: TransactionEvent}
     */
    public function transitionWithEvent(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
        ?int $targetDepartmentId = null,
        ?int $assignedEmployeeId = null,
        ?string $remarks = null,
    ): array {
        // A normal Eloquent transaction has neither the N03 command receipt nor
        // the same-transaction origin-delivery guarantee. Never close through it.
        if ($action === 'close') {
            throw ValidationException::withMessages([
                'action' => 'Work Request completion requires the verified N03 custody path.',
            ]);
        }

        $this->authorizeTransition($actor, $transaction, $action);

        return DB::transaction(
            fn (): array => $this->transitionWithinTransactionWithEvent(
                $actor,
                $transaction,
                $action,
                $targetDepartmentId,
                $assignedEmployeeId,
                $remarks,
            ),
        );
    }

    /**
     * Create a transaction and its initial submitted event strictly on an active custody connection.
     *
     * @param  array<string, mixed>  $data
     */
    public function createWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        array $data,
        string $correlationId,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Transaction custody creation requires an active database transaction.');
        }

        if (! $actor->officeRoutable) {
            throw ValidationException::withMessages([
                'department' => 'An active routable employee office is required.',
            ]);
        }

        $targetDepartmentId = (int) ($data['target_department_id'] ?? 0);
        if ($targetDepartmentId <= 0 || $targetDepartmentId === $actor->officeId) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Select a different receiving office.',
            ]);
        }

        $targetExists = $connection->table('departments')
            ->where('id', $targetDepartmentId)
            ->where('is_active', true)
            ->where('is_routable', true)
            ->limit(1)
            ->value('id') !== null;

        if (! $targetExists) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Select an active routable receiving office.',
            ]);
        }

        $assignedEmployeeId = isset($data['assigned_employee_id']) && $data['assigned_employee_id'] !== null
            ? (int) $data['assigned_employee_id']
            : null;
        if ($assignedEmployeeId !== null) {
            $employeeExists = $connection->table('employees')
                ->where('id', $assignedEmployeeId)
                ->where('department_id', $targetDepartmentId)
                ->where('employment_status', 'active')
                ->limit(1)
                ->value('id') !== null;
            if (! $employeeExists) {
                throw ValidationException::withMessages([
                    'assigned_employee_id' => 'Select an active employee from the receiving office.',
                ]);
            }
        }

        $definition = $this->definitions->resolve((string) $data['transaction_type']);
        $initialStatus = $definition->initialStatus();
        $now = now();
        $timestamp = $now->format('Y-m-d H:i:sP');
        $dueAt = $this->sla->resolve((string) $data['priority'], $data['due_at'] ?? null);

        $transactionId = (int) $connection->table('transactions')->insertGetId([
            'transaction_type' => (string) $data['transaction_type'],
            'request_category' => $data['request_category'] ?? null,
            'request_type' => $data['request_type'] ?? null,
            'action_required' => $data['action_required'] ?? null,
            'title' => (string) $data['title'],
            'description' => $data['description'] ?? null,
            'priority' => (string) $data['priority'],
            'origin_department_id' => $actor->officeId,
            'current_department_id' => $targetDepartmentId,
            'created_by_user_id' => $actor->userId,
            'assigned_employee_id' => $assignedEmployeeId,
            'status' => $initialStatus,
            'received_at' => $timestamp,
            'due_at' => $dueAt->format('Y-m-d H:i:sP'),
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        $referenceNo = sprintf('TAL-%s-%06d', $now->format('Y'), $transactionId);
        $connection->table('transactions')
            ->where('id', $transactionId)
            ->update([
                'reference_no' => $referenceNo,
                'updated_at' => $timestamp,
            ]);

        $eventId = (int) $connection->table('transaction_events')->insertGetId([
            'transaction_id' => $transactionId,
            'actor_user_id' => $actor->userId,
            'from_department_id' => $actor->officeId,
            'to_department_id' => $targetDepartmentId,
            'from_assigned_employee_id' => null,
            'to_assigned_employee_id' => $assignedEmployeeId,
            'action' => 'submitted',
            'previous_status' => 'draft',
            'new_status' => $initialStatus,
            'remarks' => isset($data['remarks']) && is_string($data['remarks']) ? $data['remarks'] : null,
            'created_at' => $timestamp,
        ]);

        ($this->audit ?? app(AuditLogger::class))->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'transaction.created',
            summary: "Created and routed {$referenceNo}.",
            correlationId: $correlationId,
            entityType: WorkflowTransaction::class,
            entityId: $transactionId,
            createdAt: $now,
        );

        return new ProducedSourceEvent(
            sourceKind: 'transaction',
            sourceId: $transactionId,
            eventId: $eventId,
            eventAction: 'submitted',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
        );
    }

    /**
     * Transition a transaction and record its event strictly on an active custody connection.
     */
    public function transitionWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $transactionId,
        string $action,
        string $correlationId,
        ?int $targetDepartmentId = null,
        ?int $assignedEmployeeId = null,
        ?string $remarks = null,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Transaction custody transition requires an active database transaction.');
        }

        $locked = $connection->table('transactions')
            ->select([
                'id',
                'reference_no',
                'transaction_type',
                'action_required',
                'origin_department_id',
                'current_department_id',
                'assigned_employee_id',
                'status',
                'received_at',
                'completed_at',
            ])
            ->where('id', $transactionId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(WorkflowTransaction::class, [$transactionId]);
        }

        $currentDepartment = $connection->table('departments')
            ->select(['id', 'code'])
            ->where('id', (int) $locked->current_department_id)
            ->first();

        if ($action === 'close') {
            $actor = VerifiedCommandActor::verifyOnConnection(
                $connection,
                $actor->userId,
                $actor->officeId,
                $actor->sessionVersion,
                $actor->role,
            );
        }

        $this->authorizeTransitionOnConnection(
            $actor,
            $locked,
            $currentDepartment !== null ? (string) $currentDepartment->code : null,
            $action,
        );

        $definition = $this->definitions->resolve((string) $locked->transaction_type);
        $currentStatus = (string) $locked->status;
        if ($definition->isTerminal($currentStatus)) {
            throw ValidationException::withMessages([
                'action' => 'This transaction is already in a terminal state.',
            ]);
        }

        $rule = $definition->transition($action);
        if (! $rule->allowsFrom($currentStatus)) {
            throw ValidationException::withMessages([
                'action' => "The [{$action}] action is not valid from status [{$currentStatus}].",
            ]);
        }

        $fromDepartmentId = (int) $locked->current_department_id;
        $previousAssignment = $locked->assigned_employee_id !== null ? (int) $locked->assigned_employee_id : null;
        $assignment = $this->resolveAssignmentOnConnection(
            $connection,
            $rule,
            $fromDepartmentId,
            $assignedEmployeeId,
            $previousAssignment,
        );
        $toDepartmentId = $this->resolveDestinationOnConnection(
            $connection,
            $rule,
            $fromDepartmentId,
            (int) $locked->origin_department_id,
            $targetDepartmentId,
        );
        $remarks = $this->validateCompletionRemarks($action, $remarks);
        $eventRemarks = $this->eventRemarksOnConnection($connection, $rule, $assignment, $remarks);
        $newStatus = $rule->status ?? $currentStatus;

        $now = now();
        $timestamp = $now->format('Y-m-d H:i:sP');

        $connection->table('transactions')
            ->where('id', $transactionId)
            ->update([
                'current_department_id' => $toDepartmentId,
                'assigned_employee_id' => $assignment,
                'status' => $newStatus,
                'received_at' => $rule->refreshReceivedAt ? $timestamp : $locked->received_at,
                'completed_at' => $rule->completes ? $timestamp : $locked->completed_at,
                'updated_at' => $timestamp,
            ]);

        $eventId = (int) $connection->table('transaction_events')->insertGetId([
            'transaction_id' => $transactionId,
            'actor_user_id' => $actor->userId,
            'from_department_id' => $fromDepartmentId,
            'to_department_id' => $toDepartmentId,
            'from_assigned_employee_id' => $previousAssignment,
            'to_assigned_employee_id' => $assignment,
            'action' => $action,
            'previous_status' => $currentStatus,
            'new_status' => $newStatus,
            'remarks' => $eventRemarks,
            'created_at' => $timestamp,
        ]);

        $auditId = ($this->audit ?? app(AuditLogger::class))->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'transaction.'.$action,
            summary: sprintf(
                '%s changed from %s to %s.',
                (string) $locked->reference_no,
                $currentStatus,
                $newStatus,
            ),
            correlationId: $correlationId,
            entityType: WorkflowTransaction::class,
            entityId: $transactionId,
            createdAt: $now,
        );

        return new ProducedSourceEvent(
            sourceKind: 'transaction',
            sourceId: $transactionId,
            eventId: $eventId,
            eventAction: $action,
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
            auditId: $action === 'close' ? $auditId : null,
        );
    }

    private function authorizeTransitionOnConnection(
        VerifiedCommandActor $actor,
        object $lockedTransaction,
        ?string $resourceOfficeCode,
        string $action,
    ): void {
        $capabilities = ($this->capabilities ?? app(TransactionCapabilities::class))->resolve([$actor->role]);
        $access = $this->access ?? app(TransactionAccessDecider::class);

        $buildContext = static fn (string $requestedAction): AuthorizationContext => new AuthorizationContext(
            actorUserId: $actor->userId,
            actorEmployeeId: $actor->employeeId,
            actorActive: true,
            actorRoles: [$actor->role],
            capabilities: $capabilities,
            actorOfficeId: $actor->officeId,
            actorOfficeCode: $actor->officeCode,
            delegatedOfficeIds: [],
            resourceOfficeId: (int) $lockedTransaction->current_department_id,
            resourceOfficeCode: $resourceOfficeCode,
            resourceOriginOfficeId: (int) $lockedTransaction->origin_department_id,
            resourceAssignedEmployeeId: $lockedTransaction->assigned_employee_id !== null
                ? (int) $lockedTransaction->assigned_employee_id
                : null,
            classification: null,
            workflowState: (string) $lockedTransaction->status,
            requestedAction: $requestedAction,
            actionRequired: $lockedTransaction->action_required,
        );

        $allowed = match ($action) {
            'close' => $access->allows($buildContext(TransactionAccessDecider::CLOSE)),
            'assign' => $access->allows($buildContext(TransactionAccessDecider::ASSIGN)),
            'approve', 'disapprove' => $access->allows($buildContext(TransactionAccessDecider::MAYOR_DECISION)),
            'request_information' => $access->allows($buildContext(TransactionAccessDecider::MAYOR_DECISION))
                || $access->allows($buildContext(TransactionAccessDecider::TRANSITION)),
            default => $access->allows($buildContext(TransactionAccessDecider::TRANSITION)),
        };

        if (! $allowed) {
            throw new AuthorizationException("You are not authorized to perform [{$action}] on this transaction.");
        }
    }

    private function resolveDestinationOnConnection(
        ConnectionInterface $connection,
        WorkflowTransitionRule $rule,
        int $currentDepartmentId,
        int $originDepartmentId,
        ?int $targetDepartmentId,
    ): int {
        return match ($rule->destination) {
            WorkflowTransitionRule::DESTINATION_CURRENT => $currentDepartmentId,
            WorkflowTransitionRule::DESTINATION_ORIGIN => $originDepartmentId,
            WorkflowTransitionRule::DESTINATION_TARGET => $this->resolveTargetDepartmentOnConnection(
                $connection,
                $currentDepartmentId,
                $targetDepartmentId,
            ),
            WorkflowTransitionRule::DESTINATION_OFFICE => $this->resolveOfficeByCodeOnConnection(
                $connection,
                $rule->officeCode,
            ),
            default => throw new LogicException("Unknown workflow destination mode [{$rule->destination}]."),
        };
    }

    private function resolveTargetDepartmentOnConnection(
        ConnectionInterface $connection,
        int $currentDepartmentId,
        ?int $targetDepartmentId,
    ): int {
        if (! $targetDepartmentId || $targetDepartmentId === $currentDepartmentId) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Choose a different receiving office.',
            ]);
        }

        $exists = $connection->table('departments')
            ->where('id', $targetDepartmentId)
            ->where('is_active', true)
            ->where('is_routable', true)
            ->limit(1)
            ->value('id') !== null;

        if (! $exists) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Choose an active routable receiving office.',
            ]);
        }

        return $targetDepartmentId;
    }

    private function resolveOfficeByCodeOnConnection(
        ConnectionInterface $connection,
        ?string $officeCode,
    ): int {
        if (! $officeCode) {
            throw new LogicException('Workflow office destination requires an office code.');
        }

        $office = $connection->table('departments')
            ->select(['id'])
            ->where('code', $officeCode)
            ->where('is_active', true)
            ->where('is_routable', true)
            ->first();

        if ($office === null) {
            throw (new ModelNotFoundException)->setModel(Department::class, [$officeCode]);
        }

        return (int) $office->id;
    }

    private function resolveAssignmentOnConnection(
        ConnectionInterface $connection,
        WorkflowTransitionRule $rule,
        int $departmentId,
        ?int $assignedEmployeeId,
        ?int $currentAssignmentId,
    ): ?int {
        if (! $rule->requiresAssignment) {
            return $rule->clearAssignment ? null : $currentAssignmentId;
        }

        if (! $assignedEmployeeId) {
            throw ValidationException::withMessages([
                'assigned_employee_id' => 'Choose an employee from the current office.',
            ]);
        }

        $employee = $connection->table('employees')
            ->select(['id'])
            ->where('id', $assignedEmployeeId)
            ->where('department_id', $departmentId)
            ->where('employment_status', 'active')
            ->first();

        if ($employee === null) {
            throw (new ModelNotFoundException)->setModel(Employee::class, [$assignedEmployeeId]);
        }

        return (int) $employee->id;
    }

    private function eventRemarksOnConnection(
        ConnectionInterface $connection,
        WorkflowTransitionRule $rule,
        ?int $assignmentId,
        ?string $remarks,
    ): ?string {
        if (! $rule->requiresAssignment || ! $assignmentId) {
            return $remarks;
        }

        $employee = $connection->table('employees')
            ->select(['full_name'])
            ->where('id', $assignmentId)
            ->first();

        if ($employee === null) {
            throw (new ModelNotFoundException)->setModel(Employee::class, [$assignmentId]);
        }

        return trim(($remarks ? $remarks.' ' : '')."Assigned to {$employee->full_name}.");
    }

    private function validateCompletionRemarks(string $action, ?string $remarks): ?string
    {
        if ($action !== 'close') {
            return $remarks;
        }

        $outcome = trim($remarks ?? '');
        if ($outcome === '' || mb_strlen($outcome) > 2000) {
            throw ValidationException::withMessages([
                'remarks' => 'Enter a completion outcome of 1 to 2000 characters.',
            ]);
        }

        return $outcome;
    }

    private function authorizeTransition(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
    ): void {
        $ability = match ($action) {
            'close' => 'close',
            'assign' => 'assign',
            'approve', 'disapprove' => 'mayorDecision',
            'request_information' => Gate::forUser($actor)->allows('mayorDecision', $transaction)
                ? 'mayorDecision'
                : 'transition',
            default => 'transition',
        };

        Gate::forUser($actor)->authorize($ability, $transaction);
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array{transaction: WorkflowTransaction, event: TransactionEvent}
     */
    private function createWithinTransactionWithEvent(
        User $actor,
        array $data,
        int $originDepartmentId,
        Department $targetDepartment,
    ): array {
        $definition = $this->definitions->resolve($data['transaction_type']);
        $transaction = $this->persistTransaction(
            $actor,
            $data,
            $definition,
            $originDepartmentId,
            $targetDepartment,
        );
        $event = $this->recordCreatedEvent(
            $transaction,
            $actor,
            $originDepartmentId,
            (int) $targetDepartment->id,
            $data['remarks'] ?? null,
        );

        event(new WorkflowTransactionCreated(
            transactionId: $transaction->id,
            transactionEventId: $event->id,
            actorUserId: $actor->id,
        ));

        return [
            'transaction' => $this->freshTransaction($transaction),
            'event' => $event,
        ];
    }

    /**
     * @return array{transaction: WorkflowTransaction, event: TransactionEvent}
     */
    private function transitionWithinTransactionWithEvent(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
        ?int $targetDepartmentId,
        ?int $assignedEmployeeId,
        ?string $remarks,
    ): array {
        // Defense in depth for callers already inside a legacy DB transaction.
        if ($action === 'close') {
            throw ValidationException::withMessages([
                'action' => 'Work Request completion requires the verified N03 custody path.',
            ]);
        }

        $locked = WorkflowTransaction::query()->lockForUpdate()->findOrFail($transaction->id);
        $this->authorizeTransition($actor, $locked, $action);
        $definition = $this->definitions->resolve($locked);
        $this->assertMutable($locked, $definition);

        $rule = $definition->transition($action);
        if (! $rule->allowsFrom($locked->status)) {
            throw ValidationException::withMessages([
                'action' => "The [{$action}] action is not valid from status [{$locked->status}].",
            ]);
        }

        $remarks = $this->validateCompletionRemarks($action, $remarks);
        $resolved = $this->resolveTransition(
            $locked,
            $rule,
            $targetDepartmentId,
            $assignedEmployeeId,
            $remarks,
        );

        $this->applyTransition($locked, $rule, $resolved);
        $event = $this->recordTransitionEvent($locked, $actor, $action, $resolved);

        event(new WorkflowTransactionTransitioned(
            transactionId: $locked->id,
            transactionEventId: $event->id,
            actorUserId: $actor->id,
            action: $action,
            assignmentEmployeeId: $resolved->assignmentEmployeeId,
        ));

        return [
            'transaction' => $this->freshTransaction($locked),
            'event' => $event,
        ];
    }

    private function persistTransaction(
        User $actor,
        array $data,
        WorkflowDefinition $definition,
        int $originDepartmentId,
        Department $targetDepartment,
    ): WorkflowTransaction {
        $assignedEmployeeId = $this->initialAssignmentId(
            isset($data['assigned_employee_id']) ? (int) $data['assigned_employee_id'] : null,
            (int) $targetDepartment->id,
        );

        $transaction = WorkflowTransaction::query()->create([
            'transaction_type' => $data['transaction_type'],
            'request_category' => $data['request_category'] ?? null,
            'request_type' => $data['request_type'] ?? null,
            'action_required' => $data['action_required'] ?? null,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'priority' => $data['priority'],
            'origin_department_id' => $originDepartmentId,
            'current_department_id' => $targetDepartment->id,
            'created_by_user_id' => $actor->id,
            'assigned_employee_id' => $assignedEmployeeId,
            'status' => $definition->initialStatus(),
            'received_at' => now(),
            'due_at' => $this->sla->resolve($data['priority'], $data['due_at'] ?? null),
        ]);

        $transaction->update([
            'reference_no' => sprintf('TAL-%s-%06d', now()->format('Y'), $transaction->id),
        ]);

        return $transaction;
    }

    private function initialAssignmentId(?int $assignedEmployeeId, int $departmentId): ?int
    {
        if (! $assignedEmployeeId) {
            return null;
        }

        $employee = Employee::query()
            ->whereKey($assignedEmployeeId)
            ->where('department_id', $departmentId)
            ->where('employment_status', 'active')
            ->first();

        if (! $employee) {
            throw ValidationException::withMessages([
                'assigned_employee_id' => 'Select an active employee from the receiving office.',
            ]);
        }

        return (int) $employee->id;
    }

    private function resolveTransition(
        WorkflowTransaction $transaction,
        WorkflowTransitionRule $rule,
        ?int $targetDepartmentId,
        ?int $assignedEmployeeId,
        ?string $remarks,
    ): ResolvedWorkflowTransition {
        $fromDepartmentId = (int) $transaction->current_department_id;
        $assignment = $this->resolveAssignment(
            $rule,
            $fromDepartmentId,
            $assignedEmployeeId,
            $transaction->assigned_employee_id,
        );

        return new ResolvedWorkflowTransition(
            previousStatus: $transaction->status,
            newStatus: $rule->status ?? $transaction->status,
            fromDepartmentId: $fromDepartmentId,
            toDepartmentId: $this->destinations->resolve($rule, $transaction, $targetDepartmentId),
            previousAssignmentEmployeeId: $transaction->assigned_employee_id,
            assignmentEmployeeId: $assignment,
            remarks: $this->eventRemarks($rule, $assignment, $remarks),
        );
    }

    private function applyTransition(
        WorkflowTransaction $transaction,
        WorkflowTransitionRule $rule,
        ResolvedWorkflowTransition $resolved,
    ): void {
        $transaction->update([
            'current_department_id' => $resolved->toDepartmentId,
            'assigned_employee_id' => $resolved->assignmentEmployeeId,
            'status' => $resolved->newStatus,
            'received_at' => $rule->refreshReceivedAt ? now() : $transaction->received_at,
            'completed_at' => $rule->completes ? now() : $transaction->completed_at,
        ]);
    }

    private function originDepartmentId(User $actor): int
    {
        $originDepartmentId = $actor->employee?->department_id;

        if (! $originDepartmentId || ! Department::query()->activeRoutable()->whereKey($originDepartmentId)->exists()) {
            throw ValidationException::withMessages([
                'department' => 'An active routable employee office is required.',
            ]);
        }

        return (int) $originDepartmentId;
    }

    private function receivingDepartment(int $targetDepartmentId, int $originDepartmentId): Department
    {
        if ($targetDepartmentId === $originDepartmentId) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Select a different receiving office.',
            ]);
        }

        $targetDepartment = Department::query()->activeRoutable()->whereKey($targetDepartmentId)->first();
        if (! $targetDepartment) {
            throw ValidationException::withMessages([
                'target_department_id' => 'Select an active routable receiving office.',
            ]);
        }

        return $targetDepartment;
    }

    private function assertMutable(
        WorkflowTransaction $transaction,
        WorkflowDefinition $definition,
    ): void {
        if ($definition->isTerminal($transaction->status)) {
            throw ValidationException::withMessages([
                'action' => 'This transaction is already in a terminal state.',
            ]);
        }
    }

    private function resolveAssignment(
        WorkflowTransitionRule $rule,
        int $departmentId,
        ?int $assignedEmployeeId,
        ?int $currentAssignmentId,
    ): ?int {
        if (! $rule->requiresAssignment) {
            return $rule->clearAssignment ? null : $currentAssignmentId;
        }

        if (! $assignedEmployeeId) {
            throw ValidationException::withMessages([
                'assigned_employee_id' => 'Choose an employee from the current office.',
            ]);
        }

        return Employee::query()
            ->whereKey($assignedEmployeeId)
            ->where('department_id', $departmentId)
            ->where('employment_status', 'active')
            ->firstOrFail()
            ->id;
    }

    private function eventRemarks(
        WorkflowTransitionRule $rule,
        ?int $assignmentId,
        ?string $remarks,
    ): ?string {
        if (! $rule->requiresAssignment || ! $assignmentId) {
            return $remarks;
        }

        $employee = Employee::query()->findOrFail($assignmentId);

        return trim(($remarks ? $remarks.' ' : '')."Assigned to {$employee->full_name}.");
    }

    private function recordCreatedEvent(
        WorkflowTransaction $transaction,
        User $actor,
        int $fromDepartmentId,
        int $toDepartmentId,
        ?string $remarks,
    ): TransactionEvent {
        return $this->recordEvent(
            $transaction,
            $actor,
            'submitted',
            'draft',
            $transaction->status,
            $fromDepartmentId,
            $toDepartmentId,
            null,
            $transaction->assigned_employee_id,
            $remarks,
        );
    }

    private function recordTransitionEvent(
        WorkflowTransaction $transaction,
        User $actor,
        string $action,
        ResolvedWorkflowTransition $resolved,
    ): TransactionEvent {
        return $this->recordEvent(
            $transaction,
            $actor,
            $action,
            $resolved->previousStatus,
            $resolved->newStatus,
            $resolved->fromDepartmentId,
            $resolved->toDepartmentId,
            $resolved->previousAssignmentEmployeeId,
            $resolved->assignmentEmployeeId,
            $resolved->remarks,
        );
    }

    private function recordEvent(
        WorkflowTransaction $transaction,
        User $actor,
        string $action,
        string $previousStatus,
        string $newStatus,
        int $fromDepartmentId,
        int $toDepartmentId,
        ?int $fromAssignedEmployeeId,
        ?int $toAssignedEmployeeId,
        ?string $remarks,
    ): TransactionEvent {
        return TransactionEvent::query()->create([
            'transaction_id' => $transaction->id,
            'actor_user_id' => $actor->id,
            'from_department_id' => $fromDepartmentId,
            'to_department_id' => $toDepartmentId,
            'from_assigned_employee_id' => $fromAssignedEmployeeId,
            'to_assigned_employee_id' => $toAssignedEmployeeId,
            'action' => $action,
            'previous_status' => $previousStatus,
            'new_status' => $newStatus,
            'remarks' => $remarks,
            'created_at' => now(),
        ]);
    }

    private function freshTransaction(WorkflowTransaction $transaction): WorkflowTransaction
    {
        return $transaction->fresh([
            'originDepartment',
            'currentDepartment',
            'creator',
            'assignedEmployee',
        ]);
    }
}
