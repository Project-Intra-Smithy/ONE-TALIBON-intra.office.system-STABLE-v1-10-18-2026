<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Services\AuditLogger;
use App\Services\CalendarManualEventAccess;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

final class CalendarManualEventController extends Controller
{
    private const ZONE = 'Asia/Manila';

    public function __construct(
        private readonly CalendarManualEventAccess $access,
        private readonly AuditLogger $audit,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $actor = $this->access->authorizeCreate($request->user(), $data['scope']);
        [$start, $end] = $this->dates($data);
        $office = $data['scope'] === 'office';

        DB::transaction(function () use ($actor, $data, $start, $end, $office): void {
            // Live role/office entitlement is re-evaluated at the write boundary.
            $actor = $this->access->authorizeCreate($actor, $data['scope']);

            $event = CalendarEvent::query()->create([
                'event_key' => 'manual-'.Str::uuid(),
                'event_type' => 'manual_event',
                'source_domain' => 'calendar_manual',
                'source_type' => null,
                'source_id' => null,
                'scope' => $office ? 'department' : 'personal',
                'department_id' => $office ? $actor->employee->department_id : null,
                'user_id' => $office ? null : $actor->id,
                'title' => trim($data['title']),
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'normal',
                'location' => $data['location'] ?? null,
                'starts_at' => $start,
                'ends_at' => $end,
                'all_day' => $data['all_day'] ?? false,
                'action_url' => null,
                'status' => 'scheduled',
                'manual_version' => 1,
                'created_by_user_id' => $actor->id,
            ]);

            $this->audit->record(
                $actor, 'calendar.manual.created', 'Created a personal or office calendar entry.',
                entityType: 'calendar_event', entityId: $event->id,
            );
        });

        return redirect()->route('calendar.index', [
            'date' => $start->setTimezone(self::ZONE)->toDateString(),
        ]);
    }

    public function update(Request $request, CalendarEvent $event): RedirectResponse
    {
        $data = $this->validated($request, true);
        [$start, $end] = $this->dates($data);

        DB::transaction(function () use ($request, $event, $data, $start, $end): void {
            $locked = CalendarEvent::query()->lockForUpdate()->findOrFail($event->getKey());
            $actor = $this->access->authorizeMutation($request->user(), $locked);
            $expected = $locked->scope === 'department' ? 'office' : 'personal';

            if ($data['scope'] !== $expected) {
                throw ValidationException::withMessages(['scope' => 'Calendar scope cannot be changed.']);
            }

            $this->assertCurrentRevision($locked, $data['expected_revision']);
            $locked->update([
                'title' => trim($data['title']),
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'normal',
                'location' => $data['location'] ?? null,
                'starts_at' => $start,
                'ends_at' => $end,
                'all_day' => $data['all_day'] ?? false,
                'manual_version' => (int) $locked->manual_version + 1,
            ]);
            $this->audit->record(
                $actor, 'calendar.manual.updated', 'Updated an authorized calendar entry.',
                entityType: 'calendar_event', entityId: $locked->id,
            );
        });

        return redirect()->route('calendar.index', [
            'date' => $start->setTimezone(self::ZONE)->toDateString(),
        ]);
    }

    public function destroy(Request $request, CalendarEvent $event): RedirectResponse
    {
        DB::transaction(function () use ($request, $event): void {
            $locked = CalendarEvent::query()->lockForUpdate()->findOrFail($event->getKey());
            $actor = $this->access->authorizeMutation($request->user(), $locked);
            $data = $request->validate(['expected_revision' => ['required', 'integer', 'min:1']]);
            $this->assertCurrentRevision($locked, (int) $data['expected_revision']);

            // Keep the original event, source identity, and ownership intact.
            $locked->update([
                'status' => 'cancelled',
                'manual_version' => (int) $locked->manual_version + 1,
            ]);
            $this->audit->record(
                $actor, 'calendar.manual.cancelled', 'Cancelled an authorized calendar entry.',
                entityType: 'calendar_event', entityId: $locked->id,
            );
        });

        return redirect()->route('calendar.index');
    }

    private function validated(Request $request, bool $updating = false): array
    {
        return $request->validate([
            'scope' => ['required', Rule::in(['personal', 'office'])],
            'title' => ['required', 'string', 'max:190', function ($field, $value, $fail): void {
                if (is_string($value) && trim($value) === '') {
                    $fail('Title cannot be blank.');
                }
            }],
            'description' => ['nullable', 'string', 'max:2000'],
            'location' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['normal', 'high', 'urgent'])],
            'starts_at' => ['required', 'string', 'max:40'],
            'ends_at' => ['nullable', 'string', 'max:40'],
            'all_day' => ['required', 'boolean'],
            'expected_revision' => [$updating ? 'required' : 'sometimes', 'integer', 'min:1'],
        ]);
    }

    /** @return array{CarbonImmutable, ?CarbonImmutable} */
    private function dates(array $data): array
    {
        $allDay = (bool) $data['all_day'];
        $start = $this->parseDate($data['starts_at'], $allDay, 'starts_at', false);
        $end = isset($data['ends_at'])
            ? $this->parseDate($data['ends_at'], $allDay, 'ends_at', true)
            : ($allDay ? $start->endOfDay() : null);

        if ($end !== null && $end->lessThan($start)) {
            throw ValidationException::withMessages(['ends_at' => 'End must not precede start.']);
        }

        return [$start, $end];
    }

    private function parseDate(string $value, bool $allDay, string $field, bool $end): CarbonImmutable
    {
        if ($allDay && preg_match('/^\d{4}-\d{2}-\d{2}$/D', $value)) {
            $date = CarbonImmutable::createFromFormat('!Y-m-d', $value, self::ZONE);
            if ($date && $date->format('Y-m-d') === $value) {
                return $end ? $date->endOfDay() : $date->startOfDay();
            }
        }

        // An explicit +08:00 offset prevents browser-local timezone drift.
        if (preg_match('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\+08:00$/D', $value)) {
            $date = CarbonImmutable::createFromFormat('!Y-m-d\TH:i:sP', $value);
            if ($date && $date->format('Y-m-d\TH:i:sP') === $value) {
                $date = $date->setTimezone(self::ZONE);
                return $allDay ? ($end ? $date->endOfDay() : $date->startOfDay()) : $date;
            }
        }

        throw ValidationException::withMessages([
            $field => 'Enter a valid Manila-local '.($allDay ? 'date' : 'date and time').'.',
        ]);
    }

    private function assertCurrentRevision(CalendarEvent $event, int $expected): void
    {
        // A row lock serializes competing writes; the client revision rejects
        // stale edit/cancel attempts even within the same database second.
        abort_unless((int) $event->manual_version === $expected, 409, 'Calendar event has changed. Refresh before editing.');
    }
}
