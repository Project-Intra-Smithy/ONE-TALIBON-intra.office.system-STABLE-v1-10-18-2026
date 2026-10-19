<?php

namespace App\Services;

use App\Domain\Workflow\Authorization\TransactionActorEligibility;
use App\Models\Employee;
use App\Models\EmployeeDevelopmentRecord;
use App\Models\EmployeeHealthAccessGrant;
use App\Models\EmployeeMovement;
use App\Models\LeaveRequest;
use App\Models\MemoRecipient;
use App\Models\OffboardingCase;
use App\Models\OnboardingCase;
use App\Models\PerformanceRecord;
use App\Models\PlatformNotification;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;

final class NotificationFeedQuery
{
    public function __construct(
        private readonly TransactionActorEligibility $eligibility,
        private readonly TransactionVisibilityQuery $workRequests,
    ) {}

    /** @return array<string, mixed> */
    public static function emptyFeed(): array
    {
        return [
            'pendingMemo' => null,
            'unreadMemoCount' => 0,
            'unreadPlatformNotificationCount' => 0,
            'notifications' => [],
            'notificationCount' => 0,
        ];
    }

    /** @return array<string, mixed> */
    public function feed(User $user): array
    {
        // All returned cached content (including counts and memo previews) is
        // private to a currently eligible municipal employee. Cached Eloquent
        // relations and privileged role labels are not revocation evidence.
        $current = $this->eligibility->resolve($user);
        if ($current === null) {
            return self::emptyFeed();
        }

        $user = User::query()->findOrFail($current['user_id']);

        $recipientQuery = MemoRecipient::query()
            ->where('user_id', $user->id)
            ->whereHas('memorandum', function ($query): void {
                $query->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->where(function ($expiry): void {
                        $expiry->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    });
            });

        $unreadMemoRecipients = (clone $recipientQuery)
            ->whereNull('viewed_at')
            ->select('memo_recipients.*')
            ->selectRaw('COUNT(*) OVER() AS unread_total')
            ->with([
                'memorandum.issuer:id,name',
                'memorandum.issuingDepartment:id,name,short_name',
            ])
            ->latest('delivered_at')
            ->limit(4)
            ->get();

        $unreadMemoCount = (int) ($unreadMemoRecipients->first()?->getAttribute('unread_total') ?? 0);
        $pendingMemo = $this->pendingMemo($unreadMemoRecipients->first());
        $memoNotifications = $this->memoNotifications($unreadMemoRecipients);

        $employeeId = $current['employee_id'];
        $officeId = $current['office_id'];
        $role = $current['role'];
        $isHr = $role === 'hr_officer' && $current['office_code'] === 'HRMO';

        // A platform notification is a cached projection, not its own authority.
        // Every permitted family must validate domain, concrete model type and
        // source ID together, then recheck the underlying record's ownership.
        // Legacy/null/malformed tuples are concealed instead of guessed.
        $platformBase = PlatformNotification::query()
            ->where('user_id', $user->id)
            ->where(function ($sources) use ($user, $employeeId, $officeId, $role, $isHr): void {
                $sources->where(function ($transaction) use ($user): void {
                    $transaction->where('source_domain', 'transaction')
                        ->where('source_type', WorkflowTransaction::class)
                        ->whereIn('source_id', $this->workRequests->scope($user)->select('transactions.id'));
                });

                $sources->orWhere(function ($leave) use ($employeeId, $isHr): void {
                    $visible = LeaveRequest::query()->where(function ($q) use ($employeeId, $isHr): void {
                        $q->where('employee_id', $employeeId);
                        if ($isHr) {
                            $q->orWhereNotNull('employee_id');
                        }
                    })->select('id');
                    $leave->where('source_domain', 'leave')->where('source_type', LeaveRequest::class)
                        ->whereIn('source_id', $visible);
                });

                foreach ([
                    ['hr_performance', PerformanceRecord::class, PerformanceRecord::query()->where('employee_id', $employeeId)->select('id')],
                    ['hr_contract', Employee::class, Employee::query()->whereKey($employeeId)->select('id')],
                    ['hr_development', EmployeeDevelopmentRecord::class, EmployeeDevelopmentRecord::query()->where('employee_id', $employeeId)->select('id')],
                ] as [$domain, $type, $ids]) {
                    $sources->orWhere(function ($branch) use ($domain, $type, $ids): void {
                        $branch->where('source_domain', $domain)->where('source_type', $type)
                            ->whereIn('source_id', $ids);
                    });
                }

                $sources->orWhere(function ($onboarding) use ($user, $employeeId, $officeId, $isHr): void {
                    $ids = OnboardingCase::query()->where(function ($q) use ($user, $employeeId, $officeId, $isHr): void {
                        $q->where('started_by_user_id', $user->id)
                            ->orWhere('target_department_id', $officeId)
                            ->orWhereHas('employee', fn ($employee) => $employee->where('user_id', $user->id));
                        if ($isHr) {
                            $q->orWhereNotNull('id');
                        }
                    })->select('id');
                    $onboarding->where('source_domain', 'hr_onboarding')
                        ->where('source_type', OnboardingCase::class)->whereIn('source_id', $ids);
                });

                $sources->orWhere(function ($offboarding) use ($user, $officeId, $isHr): void {
                    $ids = OffboardingCase::query()->where(function ($q) use ($user, $officeId, $isHr): void {
                        $q->where('initiated_by_user_id', $user->id)
                            ->orWhereHas('employee', fn ($employee) => $employee->where('department_id', $officeId));
                        if ($isHr) {
                            $q->orWhereNotNull('id');
                        }
                    })->select('id');
                    $offboarding->where('source_domain', 'hr_offboarding')
                        ->where('source_type', OffboardingCase::class)->whereIn('source_id', $ids);
                });

                $sources->orWhere(function ($movement) use ($user, $officeId, $role): void {
                    $ids = EmployeeMovement::query()->where(function ($q) use ($user, $officeId, $role): void {
                        $q->whereHas('employee', fn ($employee) => $employee->where('user_id', $user->id));
                        if ($role === 'department_head') {
                            $q->orWhere('from_department_id', $officeId)
                                ->orWhere('to_department_id', $officeId);
                        }
                    })->select('id');
                    $movement->where('source_domain', 'hr_movement')
                        ->where('source_type', EmployeeMovement::class)->whereIn('source_id', $ids);
                });

                $sources->orWhere(function ($health) use ($user): void {
                    $ids = EmployeeHealthAccessGrant::query()
                        ->where('user_id', $user->id)
                        ->where('can_view', true)
                        ->whereNull('revoked_at')
                        ->where(function ($q): void {
                            $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
                        })->select('id');
                    $health->where('source_domain', 'hr_health_access')
                        ->where('source_type', EmployeeHealthAccessGrant::class)->whereIn('source_id', $ids);
                });
            })
            ->where(function ($expiry): void {
                $expiry->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        $platformStats = (clone $platformBase)
            ->selectRaw('COUNT(*) AS total_count')
            ->selectRaw('SUM(CASE WHEN read_at IS NULL THEN 1 ELSE 0 END) AS unread_count')
            ->first();
        $hasPlatformHistory = (int) ($platformStats?->total_count ?? 0) > 0;
        $unreadPlatformNotificationCount = (int) ($platformStats?->unread_count ?? 0);
        $platformNotifications = $this->platformNotifications($platformBase);
        $workflowNotifications = $hasPlatformHistory
            ? []
            : $this->workflowFallbackNotifications($user);

        $notifications = collect([
            ...$memoNotifications,
            ...$platformNotifications,
            ...$workflowNotifications,
        ])
            ->sortByDesc('created_at')
            ->take(10)
            ->values()
            ->all();

        return [
            'pendingMemo' => $pendingMemo,
            'unreadMemoCount' => $unreadMemoCount,
            'unreadPlatformNotificationCount' => $unreadPlatformNotificationCount,
            'notifications' => $notifications,
            'notificationCount' => count($notifications),
        ];
    }

    private function pendingMemo(?MemoRecipient $recipient): ?array
    {
        if (! $recipient) {
            return null;
        }

        return [
            'id' => $recipient->memorandum->id,
            'memo_number' => $recipient->memorandum->memo_number,
            'title' => $recipient->memorandum->title,
            'issuer' => $recipient->memorandum->issuer?->name,
            'department' => $recipient->memorandum->issuingDepartment?->short_name
                ?? $recipient->memorandum->issuingDepartment?->name,
            'requires_acknowledgement' => $recipient->memorandum->requires_acknowledgement,
        ];
    }

    private function memoNotifications($recipients): array
    {
        return $recipients
            ->map(fn (MemoRecipient $recipient): array => [
                'key' => 'memo-'.$recipient->id,
                'type' => 'memorandum',
                'title' => 'New memorandum',
                'message' => $recipient->memorandum->memo_number.' · '.$recipient->memorandum->title,
                'url' => '/memoranda/'.$recipient->memorandum->id,
                'created_at' => $recipient->delivered_at?->toIso8601String(),
                'urgent' => (bool) $recipient->memorandum->requires_acknowledgement,
                'requires_acknowledgement' => (bool) $recipient->memorandum->requires_acknowledgement,
            ])
            ->all();
    }

    private function platformNotifications($platformBase): array
    {
        return (clone $platformBase)
            ->whereNull('read_at')
            ->select([
                'id',
                'user_id',
                'source_domain',
                'source_type',
                'source_id',
                'priority',
                'title',
                'message',
                'action_url',
                'requires_acknowledgement',
                'created_at',
            ])
            ->latest('created_at')
            ->limit(6)
            ->get()
            ->map(fn (PlatformNotification $notification): array => [
                'id' => $notification->id,
                'key' => 'platform-'.$notification->id,
                'type' => $notification->source_domain,
                'title' => $notification->title,
                'message' => $notification->message,
                // Never turn a cached link into an authorization grant. The
                // target is recomputed from the validated source tuple.
                'url' => $notification->source_domain === 'transaction'
                    ? '/transactions/'.$notification->source_id
                    : $this->safeNonTransactionUrl($notification),
                'read_url' => '/notifications/'.$notification->id.'/read',
                'acknowledgement_url' => $notification->requires_acknowledgement
                    ? '/notifications/'.$notification->id.'/acknowledge'
                    : null,
                'created_at' => $notification->created_at?->toIso8601String(),
                'urgent' => in_array($notification->priority, [
                    'urgent',
                    'critical',
                    'action_required',
                    'acknowledgement_required',
                ], true),
                'requires_acknowledgement' => $notification->requires_acknowledgement,
            ])
            ->all();
    }

    private function safeNonTransactionUrl(PlatformNotification $notification): string
    {
        // The source row has already passed its domain/type/ID ownership
        // predicate. Use stable domain landing routes, never a persisted URL
        // that could refer to a different employee or transaction ID.
        return match ($notification->source_domain) {
            'hr_performance', 'hr_contract', 'hr_development' => '/employees',
            'leave', 'hr_onboarding', 'hr_offboarding', 'hr_movement' => '/hris',
            'hr_health_access' => '/hris',
            default => '/dashboard',
        };
    }

    private function workflowFallbackNotifications(User $user): array
    {
        $current = $this->eligibility->resolve($user);
        $departmentId = $current['office_id'] ?? null;
        if ($departmentId === null) {
            return [];
        }

        return TransactionEvent::query()
            ->with([
                'transaction:id,reference_no,title,priority,status,current_department_id',
                'fromDepartment:id,name,short_name',
            ])
            ->where('to_department_id', $departmentId)
            ->whereColumn('from_department_id', '<>', 'to_department_id')
            ->whereIn('action', [
                'submitted',
                'forward',
                'send_to_mayor',
                'return_origin',
                'request_information',
            ])
            ->where('created_at', '>=', now()->subDay())
            ->whereHas('transaction', function ($query) use ($departmentId, $user): void {
                $query->whereIn('transactions.id', $this->workRequests->scope($user)->select('transactions.id'))
                    ->where('current_department_id', $departmentId)
                    ->whereNotIn('status', ['approved', 'disapproved', 'closed']);
            })
            ->latest('created_at')
            ->limit(5)
            ->get()
            ->map(function (TransactionEvent $event) use ($current): array {
                $transaction = $event->transaction;
                $origin = $event->fromDepartment?->short_name
                    ?? $event->fromDepartment?->name
                    ?? 'another office';

                return [
                    'key' => 'tx-event-'.$event->id,
                    'type' => 'transaction',
                    'title' => $current['office_code'] === 'MAYOR'
                        ? 'New executive request received'
                        : 'New transaction received',
                    'message' => $transaction->reference_no.' · '.$transaction->title.' · from '.$origin,
                    'url' => '/transactions/'.$transaction->id,
                    'created_at' => $event->created_at?->toIso8601String(),
                    'urgent' => in_array($transaction->priority, ['high', 'urgent'], true),
                ];
            })
            ->all();
    }
}
