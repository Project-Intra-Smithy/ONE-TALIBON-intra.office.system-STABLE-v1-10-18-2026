<?php

namespace App\Services\CommonCoordination;

use App\Models\CalendarEvent;
use App\Models\LeaveRequest;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Throwable;

/**
 * Bounded personal leave calendar context; never publishes cached event titles,
 * office participants or URLs without rechecking the current source.
 */
final class CalendarResponsibilityReader
{
    /** @return array{range_start:string,range_end:string,timezone:string,events:list<array<string,mixed>>,truncated:bool} */
    public function read(CoordinationActor $actor, ?string $date = null, int $limit = 20): array
    {
        $timezone = (string) config('app.timezone', 'Asia/Manila');
        $start = $this->start($date, $timezone);
        $end = $start->addDays(30)->endOfDay();
        $limit = max(1, min(50, $limit));

        $rows = CalendarEvent::query()
            ->where('user_id', $actor->userId)
            ->where('source_domain', 'leave')
            ->where('source_type', LeaveRequest::class)
            ->where('status', 'scheduled')
            ->whereIn('source_id', LeaveRequest::query()->select('id')
                ->where('employee_id', $actor->employeeId)
                ->where('status', 'approved'))
            ->where('starts_at', '<=', $end)
            ->where(function (Builder $range) use ($start): void {
                $range->where(function (Builder $open) use ($start): void {
                    $open->whereNull('ends_at')->where('starts_at', '>=', $start);
                })->orWhere('ends_at', '>=', $start);
            })
            ->orderBy('starts_at')
            ->orderBy('id')
            ->limit($limit + 1)
            ->get(['id', 'source_id', 'starts_at', 'ends_at', 'all_day']);

        $page = $rows->take($limit);
        $sources = LeaveRequest::query()
            ->with('leaveType:id,name')
            ->where('employee_id', $actor->employeeId)
            ->where('status', 'approved')
            ->whereIn('id', $page->pluck('source_id'))
            ->get(['id', 'leave_type_id'])
            ->keyBy('id');

        $events = [];
        foreach ($page as $event) {
            $leave = $sources->get($event->source_id);
            if (! $leave) {
                continue;
            }

            $startsAt = CarbonImmutable::instance($event->starts_at)->setTimezone($timezone);
            $endsAt = $event->ends_at
                ? CarbonImmutable::instance($event->ends_at)->setTimezone($timezone)
                : null;

            $events[] = [
                'id' => $event->id,
                'type' => 'approved_leave',
                'title' => $leave->leaveType?->name ?? 'Approved leave',
                'starts_at' => $startsAt->toIso8601String(),
                'ends_at' => $endsAt?->toIso8601String(),
                'start_date' => $startsAt->toDateString(),
                'end_date' => $endsAt?->toDateString(),
                'all_day' => (bool) $event->all_day,
                'status' => 'approved',
                'url' => '/hris',
            ];
        }

        return [
            'range_start' => $start->toIso8601String(),
            'range_end' => $end->toIso8601String(),
            'timezone' => $timezone,
            'events' => $events,
            'truncated' => $rows->count() > $limit,
        ];
    }

    private function start(?string $date, string $timezone): CarbonImmutable
    {
        if ($date !== null && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $date)) {
            try {
                $parsed = CarbonImmutable::createFromFormat('!Y-m-d', $date, $timezone);
                if ($parsed && $parsed->toDateString() === $date) {
                    return $parsed->startOfDay();
                }
            } catch (Throwable) {
                // Invalid dates use the municipal current date.
            }
        }

        return CarbonImmutable::now($timezone)->startOfDay();
    }
}
