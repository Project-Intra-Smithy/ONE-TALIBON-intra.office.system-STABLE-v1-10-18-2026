<?php

namespace App\Services;

use App\Models\Department;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\DB;

class PlatformNotificationService
{
    public function notifyUser(User $recipient, array $payload): ?PlatformNotification
    {
        return DB::transaction(fn () => $this->notifyLocked($recipient, $payload), attempts: 3);
    }

    private function notifyLocked(User $recipient, array $payload): ?PlatformNotification
    {
        try {
            $recipient = app(AccountSessionEligibility::class)->lock($recipient);
        } catch (AuthorizationException) {
            return null;
        }
        if (! $recipient || $recipient->suspended_at !== null) {
            return null;
        }
        $recipient->load('employee.department');
        if (isset($payload['department_id'])) {
            // The canonical identity lock holds this office row through delivery.
            $office = $recipient->employee?->department;
            if (! $office || (int) $office->id !== (int) $payload['department_id'] || ! $office->is_active || ! $office->is_routable) {
                return null;
            }
        }
        if (($payload['source_type'] ?? null) === WorkflowTransaction::class) {
            $source = WorkflowTransaction::query()->lockForUpdate()->find($payload['source_id'] ?? null);
            if (! $source || ! $recipient->can('view', $source)) {
                return null;
            }
        }

        return PlatformNotification::query()->firstOrCreate(
            [
                'user_id' => $recipient->id,
                'event_key' => $payload['event_key'],
            ],
            [
                'department_id' => $payload['department_id'] ?? $recipient->employee?->department_id,
                'source_domain' => $payload['source_domain'],
                'source_type' => $payload['source_type'] ?? null,
                'source_id' => $payload['source_id'] ?? null,
                'priority' => $payload['priority'] ?? 'info',
                'title' => $payload['title'],
                'message' => $payload['message'],
                'action_url' => $payload['action_url'] ?? null,
                'requires_acknowledgement' => $payload['requires_acknowledgement'] ?? false,
                'expires_at' => $payload['expires_at'] ?? null,
            ],
        );
    }

    public function notifyDepartment(Department $department, array $payload): int
    {
        $department = Department::query()->find($department->id);
        if (! $department || ! $department->is_active || ! $department->is_routable) {
            return 0;
        }

        $recipients = User::query()
            ->where('is_active', true)
            ->where('account_status', 'active')
            ->whereNull('suspended_at')
            ->whereHas('employee', fn ($query) => $query
                ->where('department_id', $department->id)
                ->where('employment_status', 'active')->whereNull('separation_date'))
            ->with('employee:id,user_id,department_id')
            ->get();

        $delivered = 0;
        foreach ($recipients as $recipient) {
            if ($this->notifyUser($recipient, [...$payload, 'department_id' => $department->id]) !== null) {
                $delivered++;
            }
        }

        return $delivered;
    }
}
