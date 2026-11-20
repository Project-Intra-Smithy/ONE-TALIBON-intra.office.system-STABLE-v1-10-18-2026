<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use LogicException;

class CorrespondenceLifecycleService
{
    private const REGISTER_ROLES = [
        'department_head',
        'department_staff',
        'mayor_approver',
        'mayor_staff',
        'hr_officer',
        'legislative_staff',
    ];

    private const CLASSIFY_ROLES = [
        'department_head',
        'mayor_approver',
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
        private readonly CorrespondenceReferenceNumberService $references,
        private readonly CorrespondenceEventRecorder $events,
        private readonly TransactionalOutbox $outbox,
        private readonly AuditLogger $audit,
    ) {}

    public function register(
        User $actor,
        CorrespondenceRecord $correspondence,
        string $correlationId,
    ): CorrespondenceRecord {
        return $this->registerWithEvent($actor, $correspondence, $correlationId)['record'];
    }

    /**
     * @return array{record: CorrespondenceRecord, event: CorrespondenceEvent}
     */
    public function registerWithEvent(
        User $actor,
        CorrespondenceRecord $correspondence,
        string $correlationId,
    ): array {
        return DB::transaction(function () use ($actor, $correspondence, $correlationId): array {
            $locked = CorrespondenceRecord::query()->lockForUpdate()->findOrFail($correspondence->id);

            if ($locked->lifecycle_state !== CorrespondenceLifecycleState::Received) {
                throw ValidationException::withMessages([
                    'correspondence' => 'Only received correspondence can be registered.',
                ]);
            }

            if (! $this->access->canRegister($actor, $locked)) {
                throw new AuthorizationException('You are not authorized to register this correspondence.');
            }

            $actor->loadMissing('employee');
            $departmentId = (int) $actor->employee->department_id;
            $registeredAt = now();
            $reference = $this->references->next((int) $registeredAt->format('Y'));

            $locked->forceFill([
                'receiving_department_id' => $departmentId,
                'municipal_reference_no' => $reference,
                'registered_by_user_id' => $actor->id,
                'registered_at' => $registeredAt,
                'lifecycle_state' => CorrespondenceLifecycleState::Registered,
            ])->save();

            $event = $this->events->record(
                $locked,
                'registered',
                CorrespondenceLifecycleState::Received,
                CorrespondenceLifecycleState::Registered,
                actor: $actor,
                officeDepartmentId: $departmentId,
                metadata: ['municipal_reference_no' => $reference],
                correlationId: $correlationId,
                occurredAt: $registeredAt,
            );

            $this->outbox->record(
                'correspondence.registered',
                'correspondence_record',
                $locked->public_id,
                [
                    'correspondence_public_id' => $locked->public_id,
                    'municipal_reference_no' => $reference,
                    'lifecycle_state' => CorrespondenceLifecycleState::Registered->value,
                    'receiving_department_id' => $departmentId,
                ],
                $registeredAt,
            );

            $this->audit->record(
                $actor,
                'correspondence.registered',
                'Human municipal actor registered received correspondence.',
                entityType: 'correspondence_record',
                entityId: $locked->id,
            );

            return [
                'record' => $locked->fresh(),
                'event' => $event,
            ];
        });
    }

    public function registerWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $correspondenceId,
        string $correlationId,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Correspondence custody registration requires an active database transaction.');
        }

        $locked = $connection->table('correspondence_records')
            ->select([
                'id',
                'lifecycle_state',
                'classification',
                'receiving_department_id',
                'workflow_transaction_id',
            ])
            ->where('id', $correspondenceId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(CorrespondenceRecord::class, [$correspondenceId]);
        }

        if ((string) $locked->lifecycle_state !== CorrespondenceLifecycleState::Received->value) {
            throw ValidationException::withMessages([
                'correspondence' => 'Only received correspondence can be registered.',
            ]);
        }

        if (! $this->canRegisterOnConnection($connection, $actor, $locked)) {
            throw new AuthorizationException('You are not authorized to register this correspondence.');
        }

        $registeredAt = now();
        $timestamp = $registeredAt->format('Y-m-d H:i:sP');
        $reference = $this->nextReferenceOnConnection($connection, (int) $registeredAt->format('Y'), $timestamp);

        $connection->table('correspondence_records')
            ->where('id', $correspondenceId)
            ->update([
                'receiving_department_id' => $actor->officeId,
                'municipal_reference_no' => $reference,
                'registered_by_user_id' => $actor->userId,
                'registered_at' => $timestamp,
                'lifecycle_state' => CorrespondenceLifecycleState::Registered->value,
                'updated_at' => $timestamp,
            ]);

        $eventId = (int) $connection->table('correspondence_events')->insertGetId([
            'correspondence_record_id' => $correspondenceId,
            'event' => 'registered',
            'previous_lifecycle_state' => CorrespondenceLifecycleState::Received->value,
            'new_lifecycle_state' => CorrespondenceLifecycleState::Registered->value,
            'actor_user_id' => $actor->userId,
            'office_department_id' => $actor->officeId,
            'remarks' => null,
            'metadata' => json_encode(['municipal_reference_no' => $reference], JSON_THROW_ON_ERROR),
            'correlation_id' => $correlationId,
            'occurred_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'correspondence.registered',
            summary: 'Human municipal actor registered received correspondence.',
            correlationId: $correlationId,
            entityType: 'correspondence_record',
            entityId: $correspondenceId,
            createdAt: $registeredAt,
        );

        return new ProducedSourceEvent(
            sourceKind: 'correspondence',
            sourceId: $correspondenceId,
            eventId: $eventId,
            eventAction: 'registered',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
            classification: is_string($locked->classification) && $locked->classification !== ''
                ? $locked->classification
                : 'internal',
        );
    }

    public function classify(
        User $actor,
        CorrespondenceRecord $correspondence,
        CorrespondenceClassification $classification,
        string $correlationId,
        ?string $remarks = null,
    ): CorrespondenceRecord {
        return $this->classifyWithEvent(
            $actor,
            $correspondence,
            $classification,
            $correlationId,
            $remarks,
        )['record'];
    }

    /**
     * @return array{record: CorrespondenceRecord, event: CorrespondenceEvent}
     */
    public function classifyWithEvent(
        User $actor,
        CorrespondenceRecord $correspondence,
        CorrespondenceClassification $classification,
        string $correlationId,
        ?string $remarks = null,
    ): array {
        return DB::transaction(function () use ($actor, $correspondence, $classification, $correlationId, $remarks): array {
            $locked = CorrespondenceRecord::query()->lockForUpdate()->findOrFail($correspondence->id);

            if ($locked->lifecycle_state !== CorrespondenceLifecycleState::Registered) {
                throw ValidationException::withMessages([
                    'correspondence' => 'Only registered correspondence can be classified.',
                ]);
            }

            if (! $this->access->canClassify($actor, $locked)) {
                throw new AuthorizationException('You are not authorized to classify this correspondence.');
            }

            $actor->loadMissing('employee');
            $departmentId = (int) $actor->employee->department_id;
            $classifiedAt = now();

            $locked->forceFill([
                'classification' => $classification,
                'classified_by_user_id' => $actor->id,
                'classified_at' => $classifiedAt,
                'lifecycle_state' => CorrespondenceLifecycleState::Classified,
            ])->save();

            $event = $this->events->record(
                $locked,
                'classified',
                CorrespondenceLifecycleState::Registered,
                CorrespondenceLifecycleState::Classified,
                actor: $actor,
                officeDepartmentId: $departmentId,
                remarks: $remarks,
                metadata: ['classification' => $classification->value],
                correlationId: $correlationId,
                occurredAt: $classifiedAt,
            );

            $this->outbox->record(
                'correspondence.classified',
                'correspondence_record',
                $locked->public_id,
                [
                    'correspondence_public_id' => $locked->public_id,
                    'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
                    'classification' => $classification->value,
                    'receiving_department_id' => $departmentId,
                ],
                $classifiedAt,
            );

            $this->audit->record(
                $actor,
                'correspondence.classified',
                'Human municipal actor classified registered correspondence.',
                entityType: 'correspondence_record',
                entityId: $locked->id,
            );

            return [
                'record' => $locked->fresh(),
                'event' => $event,
            ];
        });
    }

    public function classifyWithEventOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $correspondenceId,
        CorrespondenceClassification $classification,
        string $correlationId,
        ?string $remarks = null,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Correspondence custody classification requires an active database transaction.');
        }

        $locked = $connection->table('correspondence_records')
            ->select([
                'id',
                'lifecycle_state',
                'classification',
                'receiving_department_id',
                'workflow_transaction_id',
            ])
            ->where('id', $correspondenceId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(CorrespondenceRecord::class, [$correspondenceId]);
        }

        if ((string) $locked->lifecycle_state !== CorrespondenceLifecycleState::Registered->value) {
            throw ValidationException::withMessages([
                'correspondence' => 'Only registered correspondence can be classified.',
            ]);
        }

        if (! in_array($actor->role, self::CLASSIFY_ROLES, true)
            || ! $this->canViewOnConnection($connection, $actor, $locked)) {
            throw new AuthorizationException('You are not authorized to classify this correspondence.');
        }

        $classifiedAt = now();
        $timestamp = $classifiedAt->format('Y-m-d H:i:sP');

        $connection->table('correspondence_records')
            ->where('id', $correspondenceId)
            ->update([
                'classification' => $classification->value,
                'classified_by_user_id' => $actor->userId,
                'classified_at' => $timestamp,
                'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
                'updated_at' => $timestamp,
            ]);

        $eventId = (int) $connection->table('correspondence_events')->insertGetId([
            'correspondence_record_id' => $correspondenceId,
            'event' => 'classified',
            'previous_lifecycle_state' => CorrespondenceLifecycleState::Registered->value,
            'new_lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
            'actor_user_id' => $actor->userId,
            'office_department_id' => $actor->officeId,
            'remarks' => $remarks,
            'metadata' => json_encode(['classification' => $classification->value], JSON_THROW_ON_ERROR),
            'correlation_id' => $correlationId,
            'occurred_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'correspondence.classified',
            summary: 'Human municipal actor classified registered correspondence.',
            correlationId: $correlationId,
            entityType: 'correspondence_record',
            entityId: $correspondenceId,
            createdAt: $classifiedAt,
        );

        return new ProducedSourceEvent(
            sourceKind: 'correspondence',
            sourceId: $correspondenceId,
            eventId: $eventId,
            eventAction: 'classified',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
            classification: $classification->value,
        );
    }

    private function nextReferenceOnConnection(
        ConnectionInterface $connection,
        int $year,
        string $timestamp,
    ): string {
        $connection->table('correspondence_reference_counters')->insertOrIgnore([
            'year' => $year,
            'last_value' => 0,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        $counter = $connection->table('correspondence_reference_counters')
            ->select(['year', 'last_value'])
            ->where('year', $year)
            ->lockForUpdate()
            ->first();

        if ($counter === null) {
            throw new LogicException('Correspondence reference counter could not be initialized.');
        }

        $nextValue = (int) $counter->last_value + 1;

        $connection->table('correspondence_reference_counters')
            ->where('year', $year)
            ->update([
                'last_value' => $nextValue,
                'updated_at' => $timestamp,
            ]);

        return sprintf('TAL-COR-%d-%06d', $year, $nextValue);
    }

    private function canRegisterOnConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        object $record,
    ): bool {
        if (! in_array($actor->role, self::REGISTER_ROLES, true)) {
            return false;
        }

        if ($record->classification === null
            && $record->receiving_department_id === null
            && $record->workflow_transaction_id === null) {
            return true;
        }

        return $this->canViewOnConnection($connection, $actor, $record);
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
            return in_array($actor->role, self::REGISTER_ROLES, true);
        }

        if ($classification === CorrespondenceClassification::Confidential->value) {
            return in_array($actor->role, self::CONFIDENTIAL_VIEW_ROLES, true);
        }

        return in_array($actor->role, self::RESTRICTED_VIEW_ROLES, true);
    }
}
