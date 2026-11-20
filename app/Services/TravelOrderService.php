<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Custody\ProducedSourceEvent;
use App\Domain\Custody\VerifiedCommandActor;
use App\Domain\TravelOrders\TravelOrderStatus;
use App\Models\Employee;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use LogicException;
use Throwable;

final class TravelOrderService
{
    public function __construct(
        private readonly TravelOrderAccess $access,
        private readonly DocumentAttachmentService $attachments,
        private readonly AuditLogger $audit,
    ) {}

    /**
     * Record an already-approved Travel Order. This service intentionally does not model
     * request, review, booking, liquidation, reimbursement, payroll, or leave workflows.
     *
     * @param  array<string, mixed>  $data
     * @param  array<int, UploadedFile>  $files
     */
    public function recordApproved(User $actor, array $data, array $files = []): TravelOrder
    {
        if (! $this->access->canRecordApproved($actor)) {
            throw new AuthorizationException('You are not authorized to record approved Travel Orders.');
        }

        if ($files !== []) {
            $this->attachments->assertValidUploads($files);
        }

        $employeeIds = array_values(array_unique(array_map('intval', $data['employee_ids'] ?? [])));
        if ($employeeIds === []) {
            throw ValidationException::withMessages([
                'employee_ids' => 'At least one issued-to employee is required.',
            ]);
        }

        $existingEmployeeIds = Employee::query()
            ->whereIn('id', $employeeIds)
            ->pluck('id')
            ->map(fn ($id): int => (int) $id)
            ->all();

        sort($employeeIds);
        sort($existingEmployeeIds);
        if ($employeeIds !== $existingEmployeeIds) {
            throw ValidationException::withMessages([
                'employee_ids' => 'Every issued-to employee must exist in the municipal employee registry.',
            ]);
        }

        $travelStart = CarbonImmutable::parse($data['travel_start_date'], (string) config('app.timezone'))->toDateString();
        $travelEnd = CarbonImmutable::parse($data['travel_end_date'], (string) config('app.timezone'))->toDateString();
        if ($travelStart > $travelEnd) {
            throw ValidationException::withMessages([
                'travel_end_date' => 'The inclusive travel end date must be on or after the start date.',
            ]);
        }

        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $data, $files, $employeeIds, $travelStart, $travelEnd, &$attached): TravelOrder {
                $travelOrder = TravelOrder::query()->create([
                    'reference_number' => trim((string) $data['reference_number']),
                    'issuance_date' => $data['issuance_date'],
                    'purpose' => trim((string) $data['purpose']),
                    'destination' => trim((string) $data['destination']),
                    'department_id' => (int) $data['department_id'],
                    'travel_start_date' => $travelStart,
                    'travel_end_date' => $travelEnd,
                    'status' => TravelOrderStatus::Approved,
                    'recorded_by_user_id' => $actor->id,
                ]);

                $travelOrder->issuedTo()->sync($employeeIds);
                $event = $this->appendEvent(
                    $travelOrder,
                    $actor,
                    'recorded_approved',
                    null,
                    TravelOrderStatus::Approved,
                    'Approved Travel Order recorded in the Core Portal.',
                );

                if ($files !== []) {
                    $attached = $this->attachments->attach($actor, $files, [
                        ['model' => $travelOrder, 'relationship' => 'supporting_document'],
                        ['model' => $event, 'relationship' => 'action_evidence'],
                    ]);
                }

                $this->audit->record(
                    $actor,
                    'travel_order.recorded',
                    'Recorded an already-approved Travel Order.',
                    entityType: 'travel_order',
                    entityId: $travelOrder->id,
                );

                return $travelOrder->load('department', 'issuedTo.department', 'events.actor');
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /** @param array<int, UploadedFile> $files */
    public function changeStatus(
        User $actor,
        TravelOrder $travelOrder,
        TravelOrderStatus $next,
        ?string $remarks = null,
        array $files = [],
    ): TravelOrder {
        if (! $this->access->canUpdateState($actor)) {
            throw new AuthorizationException('You are not authorized to update Travel Order state.');
        }

        if ($files !== []) {
            $this->attachments->assertValidUploads($files);
        }

        $attached = [];

        try {
            return DB::transaction(function () use ($actor, $travelOrder, $next, $remarks, $files, &$attached): TravelOrder {
                $locked = TravelOrder::query()->lockForUpdate()->findOrFail($travelOrder->id);
                $current = $locked->status;

                if (! $current->canTransitionTo($next)) {
                    throw ValidationException::withMessages([
                        'status' => "Travel Order state cannot move from {$current->value} to {$next->value}.",
                    ]);
                }

                $locked->forceFill([
                    'status' => $next,
                    'status_updated_by_user_id' => $actor->id,
                ])->save();

                $event = $this->appendEvent(
                    $locked,
                    $actor,
                    'status_changed',
                    $current,
                    $next,
                    $remarks,
                );

                if ($files !== []) {
                    $attached = $this->attachments->attach($actor, $files, [[
                        'model' => $event,
                        'relationship' => 'action_evidence',
                    ]]);
                }

                $this->audit->record(
                    $actor,
                    'travel_order.status_changed',
                    "Travel Order state changed from {$current->value} to {$next->value}.",
                    entityType: 'travel_order',
                    entityId: $locked->id,
                );

                return $locked->load('department', 'issuedTo.department', 'events.actor');
            });
        } catch (Throwable $exception) {
            $this->attachments->cleanupDocuments($attached);
            throw $exception;
        }
    }

    /**
     * Record an already-approved Travel Order strictly on an active custody connection.
     *
     * @param  array<string, mixed>  $data
     */
    public function recordApprovedOnCustodyConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        array $data,
        string $correlationId,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Travel Order custody recording requires an active database transaction.');
        }

        if (! $actor->isRole('mayor_approver') || ! $actor->isMayorOffice()) {
            throw new AuthorizationException('You are not authorized to record approved Travel Orders.');
        }

        $employeeIds = array_values(array_unique(array_map('intval', $data['employee_ids'] ?? [])));
        if ($employeeIds === []) {
            throw ValidationException::withMessages([
                'employee_ids' => 'At least one issued-to employee is required.',
            ]);
        }

        $existingEmployeeIds = $connection->table('employees')
            ->whereIn('id', $employeeIds)
            ->pluck('id')
            ->map(static fn ($id): int => (int) $id)
            ->all();

        sort($employeeIds);
        sort($existingEmployeeIds);
        if ($employeeIds !== $existingEmployeeIds) {
            throw ValidationException::withMessages([
                'employee_ids' => 'Every issued-to employee must exist in the municipal employee registry.',
            ]);
        }

        $departmentId = (int) ($data['department_id'] ?? 0);
        if ($departmentId <= 0
            || $connection->table('departments')->where('id', $departmentId)->where('is_active', true)->limit(1)->value('id') === null) {
            throw ValidationException::withMessages([
                'department_id' => 'Select an active municipal department.',
            ]);
        }

        $travelStart = CarbonImmutable::parse((string) $data['travel_start_date'], (string) config('app.timezone'))->toDateString();
        $travelEnd = CarbonImmutable::parse((string) $data['travel_end_date'], (string) config('app.timezone'))->toDateString();
        if ($travelStart > $travelEnd) {
            throw ValidationException::withMessages([
                'travel_end_date' => 'The inclusive travel end date must be on or after the start date.',
            ]);
        }

        $now = now();
        $timestamp = $now->format('Y-m-d H:i:sP');

        $travelOrderId = (int) $connection->table('travel_orders')->insertGetId([
            'public_id' => (string) Str::uuid(),
            'reference_number' => trim((string) $data['reference_number']),
            'issuance_date' => CarbonImmutable::parse((string) $data['issuance_date'], (string) config('app.timezone'))->toDateString(),
            'purpose' => trim((string) $data['purpose']),
            'destination' => trim((string) $data['destination']),
            'department_id' => $departmentId,
            'travel_start_date' => $travelStart,
            'travel_end_date' => $travelEnd,
            'status' => TravelOrderStatus::Approved->value,
            'recorded_by_user_id' => $actor->userId,
            'created_at' => $timestamp,
            'updated_at' => $timestamp,
        ]);

        foreach ($employeeIds as $employeeId) {
            $connection->table('travel_order_employee')->insert([
                'travel_order_id' => $travelOrderId,
                'employee_id' => $employeeId,
                'created_at' => $timestamp,
                'updated_at' => $timestamp,
            ]);
        }

        $eventId = (int) $connection->table('travel_order_events')->insertGetId([
            'travel_order_id' => $travelOrderId,
            'actor_user_id' => $actor->userId,
            'event' => 'recorded_approved',
            'from_status' => null,
            'to_status' => TravelOrderStatus::Approved->value,
            'remarks' => 'Approved Travel Order recorded in the Core Portal.',
            'occurred_at' => $timestamp,
            'created_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'travel_order.recorded',
            summary: 'Recorded an already-approved Travel Order.',
            correlationId: $correlationId,
            entityType: 'travel_order',
            entityId: $travelOrderId,
            createdAt: $now,
        );

        return new ProducedSourceEvent(
            sourceKind: 'travel',
            sourceId: $travelOrderId,
            eventId: $eventId,
            eventAction: 'recorded_approved',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
        );
    }

    public function changeStatusOnCustodyConnection(
        ConnectionInterface $connection,
        VerifiedCommandActor $actor,
        int $travelOrderId,
        TravelOrderStatus $next,
        string $correlationId,
        ?string $remarks = null,
    ): ProducedSourceEvent {
        if ($connection->transactionLevel() < 1) {
            throw new LogicException('Travel Order custody status update requires an active database transaction.');
        }

        if (! $actor->isRole('mayor_approver') || ! $actor->isMayorOffice()) {
            throw new AuthorizationException('You are not authorized to update Travel Order state.');
        }

        $locked = $connection->table('travel_orders')
            ->select(['id', 'status'])
            ->where('id', $travelOrderId)
            ->lockForUpdate()
            ->first();

        if ($locked === null) {
            throw (new ModelNotFoundException)->setModel(TravelOrder::class, [$travelOrderId]);
        }

        $current = TravelOrderStatus::from((string) $locked->status);
        if (! $current->canTransitionTo($next)) {
            throw ValidationException::withMessages([
                'status' => "Travel Order state cannot move from {$current->value} to {$next->value}.",
            ]);
        }

        $now = now();
        $timestamp = $now->format('Y-m-d H:i:sP');

        $connection->table('travel_orders')
            ->where('id', $travelOrderId)
            ->update([
                'status' => $next->value,
                'status_updated_by_user_id' => $actor->userId,
                'updated_at' => $timestamp,
            ]);

        $eventId = (int) $connection->table('travel_order_events')->insertGetId([
            'travel_order_id' => $travelOrderId,
            'actor_user_id' => $actor->userId,
            'event' => 'status_changed',
            'from_status' => $current->value,
            'to_status' => $next->value,
            'remarks' => $remarks !== null && trim($remarks) !== '' ? trim($remarks) : null,
            'occurred_at' => $timestamp,
            'created_at' => $timestamp,
        ]);

        $this->audit->recordOnConnection(
            connection: $connection,
            actorUserId: $actor->userId,
            actorDepartmentId: $actor->officeId,
            action: 'travel_order.status_changed',
            summary: "Travel Order state changed from {$current->value} to {$next->value}.",
            correlationId: $correlationId,
            entityType: 'travel_order',
            entityId: $travelOrderId,
            createdAt: $now,
        );

        return new ProducedSourceEvent(
            sourceKind: 'travel',
            sourceId: $travelOrderId,
            eventId: $eventId,
            eventAction: 'status_changed',
            actorUserId: $actor->userId,
            officeId: $actor->officeId,
            correlationId: $correlationId,
        );
    }

    private function appendEvent(
        TravelOrder $travelOrder,
        User $actor,
        string $event,
        ?TravelOrderStatus $from,
        TravelOrderStatus $to,
        ?string $remarks,
    ): TravelOrderEvent {
        $now = now();

        return TravelOrderEvent::query()->create([
            'travel_order_id' => $travelOrder->id,
            'actor_user_id' => $actor->id,
            'event' => $event,
            'from_status' => $from,
            'to_status' => $to,
            'remarks' => $remarks ? trim($remarks) : null,
            'occurred_at' => $now,
            'created_at' => $now,
        ]);
    }
}
