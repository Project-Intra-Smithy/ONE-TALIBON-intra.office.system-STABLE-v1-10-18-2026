<?php

namespace App\Services;

use App\Domain\Workflow\Authorization\TransactionActorEligibility;
use App\Models\CalendarEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Carbon\CarbonImmutable;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Builder;
use Throwable;

final class CalendarWorkspaceQueryService
{
    public function __construct(
        private readonly TransactionVisibilityQuery $workRequests,
        private readonly TransactionActorEligibility $eligibility,
    ) {}

    private const VIEWS = ['month', 'week', 'day', 'schedule'];

    public function workspace(User $user, ?string $requestedView, ?string $requestedDate): array
    {
        $current = $this->eligibility->resolve($user);
        $timezone = (string) config('app.timezone', 'Asia/Manila');
        $view = in_array($requestedView, self::VIEWS, true) ? $requestedView : 'month';
        $anchor = $this->date($requestedDate, $timezone);
        [$rangeStart, $rangeEnd] = $this->range($view, $anchor);
        // Current office only: a cached Employee relation cannot confer access.
        $departmentId = $current['office_id'] ?? null;

        if ($current === null) {
            return [
                'events' => collect(),
                'calendar' => [
                    'view' => $view,
                    'anchor_date' => $anchor->toDateString(),
                    'today' => CarbonImmutable::now($timezone)->toDateString(),
                    'range_start' => $rangeStart->toIso8601String(),
                    'range_end' => $rangeEnd->toIso8601String(),
                    'timezone' => $timezone,
                ],
            ];
        }

        $events = CalendarEvent::query()
            ->with('department:id,code,name,short_name')
            ->where(function (Builder $query) use ($user, $departmentId): void {
                $query->where('scope', 'municipality')
                    ->orWhere('user_id', $user->id);

                if ($departmentId) {
                    $query->orWhere('department_id', $departmentId);
                }
            })
            // Source-specific authorization still applies when a calendar
            // entry caches a Work Request title/URL. Other calendar domains
            // retain their existing independent scope and lifecycle.
            ->where(function (Builder $source) use ($user): void {
                $source->where(function (Builder $other): void {
                    // Unrelated calendar sources keep their existing scope,
                    // but no malformed/legacy tuple or cached transaction
                    // link may impersonate an authorized Work Request.
                    $other->where(function (Builder $domain): void {
                        $domain->whereNull('source_domain')
                            ->orWhereNotIn('source_domain', ['transaction', 'work_request']);
                    })->where(function (Builder $type): void {
                        $type->whereNull('source_type')
                            ->orWhere('source_type', '<>', WorkflowTransaction::class);
                    })->where(function (Builder $url): void {
                        $url->whereNull('action_url')
                            ->orWhere('action_url', 'not like', '%/transactions/%');
                    });
                })->orWhere(function (Builder $transaction) use ($user): void {
                    $transaction->where('source_domain', 'transaction')
                        ->where('source_type', WorkflowTransaction::class)
                        ->whereIn('source_id', $this->workRequests->scope($user)->select('transactions.id'));
                });
            })
            ->where('starts_at', '<=', $rangeEnd)
            ->where(function (Builder $query) use ($rangeStart): void {
                $query->where(function (Builder $openEnded) use ($rangeStart): void {
                    $openEnded->whereNull('ends_at')->where('starts_at', '>=', $rangeStart);
                })->orWhere('ends_at', '>=', $rangeStart);
            })
            ->orderBy('starts_at')
            ->orderBy('id')
            ->get()
            ->map(fn (CalendarEvent $event): array => $this->project($event, $user->id, $departmentId, $timezone))
            ->values();

        return [
            'events' => $events,
            'calendar' => [
                'view' => $view,
                'anchor_date' => $anchor->toDateString(),
                'today' => CarbonImmutable::now($timezone)->toDateString(),
                'range_start' => $rangeStart->toIso8601String(),
                'range_end' => $rangeEnd->toIso8601String(),
                'timezone' => $timezone,
            ],
        ];
    }

    private function date(?string $value, string $timezone): CarbonImmutable
    {
        if (is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value)) {
            try {
                $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, $timezone);
                if ($date && $date->toDateString() === $value) {
                    return $date;
                }
            } catch (Throwable) {
                // Fall through to today.
            }
        }

        return CarbonImmutable::now($timezone)->startOfDay();
    }

    private function range(string $view, CarbonImmutable $anchor): array
    {
        return match ($view) {
            'week' => [$anchor->startOfWeek(CarbonInterface::SUNDAY), $anchor->startOfWeek(CarbonInterface::SUNDAY)->addDays(6)->endOfDay()],
            'day' => [$anchor->startOfDay(), $anchor->endOfDay()],
            'schedule' => [$anchor->startOfDay(), $anchor->addDays(30)->endOfDay()],
            default => $this->monthRange($anchor),
        };
    }

    private function monthRange(CarbonImmutable $anchor): array
    {
        $start = $anchor->startOfMonth()->startOfWeek(CarbonInterface::SUNDAY);

        return [$start, $start->addDays(41)->endOfDay()];
    }

    private function project(CalendarEvent $event, int $userId, ?int $departmentId, string $timezone): array
    {
        $start = CarbonImmutable::instance($event->starts_at)->setTimezone($timezone);
        $end = $event->ends_at ? CarbonImmutable::instance($event->ends_at)->setTimezone($timezone) : null;
        $bucket = $event->user_id === $userId
            ? 'personal'
            : ($departmentId && $event->department_id === $departmentId ? 'office' : 'municipality');

        return [
            'id' => $event->id,
            'event_key' => $event->event_key,
            'event_type' => $event->event_type,
            'title' => $event->title,
            'description' => $event->description,
            'priority' => $event->priority,
            'starts_at' => $start->toIso8601String(),
            'ends_at' => $end?->toIso8601String(),
            'all_day' => (bool) $event->all_day,
            'start_date' => $start->toDateString(),
            'end_date' => $end?->toDateString(),
            'start_time' => $event->all_day ? null : $start->format('H:i'),
            'end_time' => $event->all_day || ! $end ? null : $end->format('H:i'),
            'location' => $event->location,
            'action_url' => $event->source_domain === 'transaction'
                && $event->source_type === WorkflowTransaction::class
                    ? '/transactions/'.$event->source_id
                    : $event->action_url,
            'status' => $event->status,
            'department' => $event->department ? [
                'code' => $event->department->code,
                'name' => $event->department->name,
                'short_name' => $event->department->short_name,
            ] : null,
            'calendar_bucket' => $bucket,
        ];
    }
}
