<?php

namespace App\Http\Controllers;

use App\Models\AuditLog;
use App\Models\Department;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()->isRole('system_admin', 'mayor_approver'), 403);

        $filters = $request->validate([
            'outcome' => ['nullable', Rule::in(['allowed', 'denied'])],
            'action' => ['nullable', 'string', 'max:100'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $query = AuditLog::query()
            ->with([
                'actor:id,name',
                'actorDepartment:id,name,short_name',
            ]);

        if (! empty($filters['outcome'])) {
            $query->where('outcome', $filters['outcome']);
        }
        if (! empty($filters['action'])) {
            $query->where('action', 'like', '%'.$filters['action'].'%');
        }
        if (! empty($filters['department_id'])) {
            $query->where('actor_department_id', $filters['department_id']);
        }

        return Inertia::render('Audit/Index', [
            'events' => $query->latest('created_at')->limit(250)->get()->map(fn (AuditLog $event): array => [
                'id' => $event->id,
                'action' => $event->action,
                'outcome' => $event->outcome,
                'summary' => $event->summary,
                'created_at' => $event->created_at?->toISOString(),
                'actor' => $event->actor ? ['name' => $event->actor->name] : null,
                'actor_department' => $event->actorDepartment ? [
                    'id' => $event->actorDepartment->id,
                    'name' => $event->actorDepartment->name,
                    'short_name' => $event->actorDepartment->short_name,
                ] : null,
            ]),
            'summary' => [
                'events24h' => AuditLog::query()->where('created_at', '>=', now()->subDay())->count(),
                'denied24h' => AuditLog::query()->where('outcome', 'denied')->where('created_at', '>=', now()->subDay())->count(),
                'events7d' => AuditLog::query()->where('created_at', '>=', now()->subDays(7))->count(),
                'distinctActors7d' => AuditLog::query()->whereNotNull('actor_user_id')->where('created_at', '>=', now()->subDays(7))->distinct('actor_user_id')->count('actor_user_id'),
            ],
            'filters' => [
                'outcome' => $filters['outcome'] ?? '',
                'action' => $filters['action'] ?? '',
                'department_id' => $filters['department_id'] ?? '',
            ],
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
        ]);
    }
}
