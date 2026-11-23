<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\DesignatedPlanningStaff;
use App\Models\Employee;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

final class DesignatedPlanningStaffController extends Controller
{
    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $actor = $request->user();
        $perms = $this->authorization->authorizeStaffDesignation($actor);

        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'can_manage_plans' => ['nullable', 'boolean'],
            'can_manage_ppas' => ['nullable', 'boolean'],
            'can_manage_maps' => ['nullable', 'boolean'],
        ]);

        $employee = Employee::query()
            ->with(['user', 'department'])
            ->findOrFail((int) $data['employee_id']);

        if ($employee->employment_status !== 'active'
            || ! $employee->user
            || ! $employee->user->is_active
            || ! $employee->department
            || ! in_array(strtoupper((string) $employee->department->code), PlanningAuthorizationService::MPDO_CODES, true)
            || $employee->user->role === 'system_admin') {
            throw ValidationException::withMessages([
                'employee_id' => 'Choose an active MPDC / MPDO staff member to designate.',
            ]);
        }

        // Default granular boolean scopes to FALSE unless explicitly enabled
        $canPlans = (bool) ($data['can_manage_plans'] ?? false);
        $canPpas = (bool) ($data['can_manage_ppas'] ?? false);
        $canMaps = (bool) ($data['can_manage_maps'] ?? false);

        $existing = DesignatedPlanningStaff::query()
            ->where('user_id', $employee->user_id)
            ->whereNull('revoked_at')
            ->first();

        if ($existing) {
            $existing->update([
                'can_manage_plans' => $canPlans,
                'can_manage_ppas' => $canPpas,
                'can_manage_maps' => $canMaps,
                'designated_by_user_id' => $actor->id,
            ]);
            $designation = $existing;
        } else {
            $designation = DesignatedPlanningStaff::query()->create([
                'user_id' => $employee->user_id,
                'employee_id' => $employee->id,
                'department_id' => $perms['actorDepartmentId'] ?? $employee->department_id,
                'can_manage_plans' => $canPlans,
                'can_manage_ppas' => $canPpas,
                'can_manage_maps' => $canMaps,
                'designated_by_user_id' => $actor->id,
            ]);
        }

        $this->audit->record(
            actor: $actor,
            action: 'planning.staff.designated',
            summary: sprintf(
                'Designated MPDC staff %s (plans=%s, ppas=%s, maps=%s).',
                $employee->full_name,
                $canPlans ? 'true' : 'false',
                $canPpas ? 'true' : 'false',
                $canMaps ? 'true' : 'false',
            ),
            entityType: DesignatedPlanningStaff::class,
            entityId: $designation->id,
        );

        return back()->with('status', "Updated planning staff scopes for {$employee->full_name}.");
    }

    public function update(Request $request, DesignatedPlanningStaff $staff): RedirectResponse
    {
        $actor = $request->user();
        $this->authorization->authorizeStaffDesignation($actor);

        $data = $request->validate([
            'can_manage_plans' => ['required', 'boolean'],
            'can_manage_ppas' => ['required', 'boolean'],
            'can_manage_maps' => ['required', 'boolean'],
        ]);

        $staff->update([
            'can_manage_plans' => (bool) $data['can_manage_plans'],
            'can_manage_ppas' => (bool) $data['can_manage_ppas'],
            'can_manage_maps' => (bool) $data['can_manage_maps'],
            'designated_by_user_id' => $actor->id,
        ]);

        $this->audit->record(
            actor: $actor,
            action: 'planning.staff.scopes_updated',
            summary: sprintf(
                'Updated MPDC staff #%d scopes (plans=%s, ppas=%s, maps=%s).',
                $staff->id,
                $staff->can_manage_plans ? 'true' : 'false',
                $staff->can_manage_ppas ? 'true' : 'false',
                $staff->can_manage_maps ? 'true' : 'false',
            ),
            entityType: DesignatedPlanningStaff::class,
            entityId: $staff->id,
        );

        return back()->with('status', 'Updated designated planning staff scopes.');
    }

    public function destroy(Request $request, DesignatedPlanningStaff $staff): RedirectResponse
    {
        $actor = $request->user();
        $this->authorization->authorizeStaffDesignation($actor);

        $staff->update([
            'can_manage_plans' => false,
            'can_manage_ppas' => false,
            'can_manage_maps' => false,
            'revoked_at' => now(),
            'revoked_by_user_id' => $actor->id,
        ]);

        $this->audit->record(
            actor: $actor,
            action: 'planning.staff.revoked',
            summary: "Revoked MPDC planning designation #{$staff->id}.",
            entityType: DesignatedPlanningStaff::class,
            entityId: $staff->id,
        );

        return back()->with('status', 'Revoked planning staff designation.');
    }
}
