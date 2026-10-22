<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Services\CalendarManualEventAccess;
use Carbon\CarbonImmutable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

final class CalendarManualEventController extends Controller
{
    public function __construct(private readonly CalendarManualEventAccess $access) {}

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $actor = $this->access->authorizeCreate($request->user(), $data['scope']);
        $this->assertChronology($data);

        $office = $data['scope'] === 'office';
        CalendarEvent::query()->create([
            'event_key' => 'manual-'.Str::uuid(),
            'event_type' => 'manual_event',
            'source_domain' => 'calendar_manual',
            'source_type' => null,
            'source_id' => null,
            'scope' => $office ? 'department' : 'personal',
            'department_id' => $office ? $actor->employee->department_id : null,
            'user_id' => $office ? null : $actor->id,
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'priority' => $data['priority'] ?? 'normal',
            'location' => $data['location'] ?? null,
            'starts_at' => $data['starts_at'],
            'ends_at' => $data['ends_at'] ?? null,
            'all_day' => $data['all_day'] ?? false,
            'action_url' => null,
            'status' => 'scheduled',
            'created_by_user_id' => $actor->id,
        ]);

        return redirect()->route('calendar.index', [
            'date' => CarbonImmutable::parse($data['starts_at'])->setTimezone('Asia/Manila')->toDateString(),
        ]);
    }

    public function update(Request $request, CalendarEvent $event): RedirectResponse
    {
        $data = $this->validated($request);
        $this->assertChronology($data);

        DB::transaction(function () use ($request, $event, $data): void {
            $locked = CalendarEvent::query()->lockForUpdate()->findOrFail($event->getKey());
            $this->access->authorizeMutation($request->user(), $locked);
            $expected = $locked->scope === 'department' ? 'office' : 'personal';
            abort_unless($data['scope'] === $expected, 422, 'Calendar scope cannot be changed.');

            $locked->update([
                'title' => $data['title'],
                'description' => $data['description'] ?? null,
                'priority' => $data['priority'] ?? 'normal',
                'location' => $data['location'] ?? null,
                'starts_at' => $data['starts_at'],
                'ends_at' => $data['ends_at'] ?? null,
                'all_day' => $data['all_day'] ?? false,
            ]);
        });

        return redirect()->route('calendar.index', [
            'date' => CarbonImmutable::parse($data['starts_at'])->setTimezone('Asia/Manila')->toDateString(),
        ]);
    }

    public function destroy(Request $request, CalendarEvent $event): RedirectResponse
    {
        DB::transaction(function () use ($request, $event): void {
            $locked = CalendarEvent::query()->lockForUpdate()->findOrFail($event->getKey());
            $this->access->authorizeMutation($request->user(), $locked);
            // Preserve an event record for auditability; do not hard-delete.
            $locked->update(['status' => 'cancelled']);
        });

        return redirect()->route('calendar.index');
    }

    private function validated(Request $request): array
    {
        return $request->validate([
            'scope' => ['required', Rule::in(['personal', 'office'])],
            'title' => ['required', 'string', 'max:190'],
            'description' => ['nullable', 'string', 'max:2000'],
            'location' => ['nullable', 'string', 'max:255'],
            'priority' => ['nullable', Rule::in(['normal', 'high', 'urgent'])],
            'starts_at' => ['required', 'date'],
            'ends_at' => ['nullable', 'date'],
            'all_day' => ['nullable', 'boolean'],
        ]);
    }

    private function assertChronology(array $data): void
    {
        if (isset($data['ends_at'])
            && CarbonImmutable::parse($data['ends_at'])->lessThan(CarbonImmutable::parse($data['starts_at']))) {
            abort(422, 'End must not precede start.');
        }
    }
}
