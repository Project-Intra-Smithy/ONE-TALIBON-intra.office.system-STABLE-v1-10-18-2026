<?php

namespace App\Services\CommonCoordination;

use App\Models\LeaveRequest;
use App\Models\MemoRecipient;
use App\Models\PlatformNotification;
use Illuminate\Database\Eloquent\Builder;

/**
 * P0 notification context only. A stored notification is a delivery receipt,
 * never independent authorization to disclose its cached title or action URL.
 */
final class NotificationContextReader
{
    /** @return array{leave_updates:list<array<string,mixed>>,memoranda:list<array<string,mixed>>,next_cursor:?int} */
    public function read(CoordinationActor $actor, int $limit = 10, ?int $beforeId = null): array
    {
        $limit = max(1, min(20, $limit));

        $query = PlatformNotification::query()
            ->where('user_id', $actor->userId)
            ->where('source_domain', 'leave')
            ->where('source_type', LeaveRequest::class)
            ->whereIn('source_id', LeaveRequest::query()
                ->select('id')->where('employee_id', $actor->employeeId))
            ->where(function (Builder $expiry): void {
                $expiry->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });

        if ($beforeId !== null) {
            $query->where('id', '<', max(1, $beforeId));
        }

        $rows = $query->orderByDesc('id')->limit($limit + 1)
            ->get(['id', 'source_id', 'priority', 'created_at', 'read_at']);
        $page = $rows->take($limit);
        $sources = LeaveRequest::query()
            ->with('leaveType:id,name')
            ->where('employee_id', $actor->employeeId)
            ->whereIn('id', $page->pluck('source_id'))
            ->get(['id', 'leave_type_id', 'status'])
            ->keyBy('id');

        $updates = [];
        foreach ($page as $receipt) {
            $leave = $sources->get($receipt->source_id);
            if (! $leave) {
                continue;
            }

            $updates[] = [
                'id' => $receipt->id,
                'type' => 'leave',
                'title' => 'Leave request update',
                'message' => ($leave->leaveType?->name ?? 'Leave request').' · '.str_replace('_', ' ', $leave->status),
                'priority' => $receipt->priority,
                'read' => $receipt->read_at !== null,
                'created_at' => $receipt->created_at?->toIso8601String(),
                'url' => '/hris',
            ];
        }

        $memoranda = MemoRecipient::query()
            ->where('user_id', $actor->userId)
            ->whereHas('memorandum', function (Builder $memo): void {
                $memo->where('status', 'published')
                    ->whereNotNull('published_at')
                    ->where(function (Builder $expiry): void {
                        $expiry->whereNull('expires_at')->orWhere('expires_at', '>', now());
                    });
            })
            ->with('memorandum:id,memo_number,title')
            ->orderByDesc('delivered_at')
            ->orderByDesc('id')
            ->limit($limit)
            ->get()
            ->map(fn (MemoRecipient $recipient): array => [
                'id' => $recipient->id,
                'type' => 'memorandum',
                'title' => $recipient->memorandum->title,
                'reference' => $recipient->memorandum->memo_number,
                'read' => $recipient->viewed_at !== null,
                'delivered_at' => $recipient->delivered_at?->toIso8601String(),
                'url' => '/memoranda/'.$recipient->memorandum_id,
            ])
            ->all();

        return [
            'leave_updates' => $updates,
            'memoranda' => array_values($memoranda),
            'next_cursor' => $rows->count() > $limit ? (int) $page->last()->id : null,
        ];
    }
}
