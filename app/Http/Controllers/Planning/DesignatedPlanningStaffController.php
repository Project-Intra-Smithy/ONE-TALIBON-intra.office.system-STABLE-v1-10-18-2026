<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\DesignatedPlanningStaff;
use App\Models\Employee;
use App\Models\User;
use App\Services\AccountSessionEligibility;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class DesignatedPlanningStaffController extends Controller
{
    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request): RedirectResponse {
            $this->authorization->resolve($request->user());
            $actor = $request->user();
            $perms = $this->authorization->authorizeStaffDesignation($actor);

            $data = $request->validate([
                'employee_id' => ['required', 'integer', 'exists:employees,id'],
                'can_manage_plans' => ['nullable', 'boolean'],
                'can_manage_ppas' => ['nullable', 'boolean'],
                'can_manage_maps' => ['nullable', 'boolean'],
            ]);

            $targetEmployee = Employee::query()->findOrFail((int) $data['employee_id']);
            User::query()->lockForUpdate()->findOrFail($targetEmployee->user_id);
            $this->authorization->authorizeStaffDesignation($actor);

            $employee = Employee::query()
                ->with(['user', 'department'])
                ->findOrFail((int) $data['employee_id']);

            if ($employee->employment_status !== 'active'
                || $employee->separation_date !== null
                || ! $employee->user
                || ! $employee->user->is_active
                || ! app(AccountSessionEligibility::class)->current($employee->user)
                || ! $employee->department
                || ! $employee->department->is_active
                || (int) $employee->department_id !== (int) $perms['actorDepartmentId']
                || $employee->user->role === 'system_admin') {
                throw ValidationException::withMessages([
                    'employee_id' => 'Choose an active staff member in your own office to designate.',
                ]);
            }

            $this->authorization->authorizeDesignationScopes($perms, $data);

            // Default granular boolean scopes to FALSE unless explicitly enabled
            $canPlans = (bool) ($data['can_manage_plans'] ?? false);
            $canPpas = (bool) ($data['can_manage_ppas'] ?? false);
            $canMaps = (bool) ($data['can_manage_maps'] ?? false);

            $existing = DesignatedPlanningStaff::query()
                ->where('user_id', $employee->user_id)
                ->whereNull('revoked_at')
                ->first();

            if ($existing) {
                abort_if((int) $existing->employee_id !== (int) $employee->id
                    || (int) $existing->department_id !== (int) $employee->department_id,
                    409, 'Revoke the previous office designation before granting scopes in the current office.');
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
                    'Designated planning staff %s (plans=%s, ppas=%s, maps=%s).',
                    $employee->full_name,
                    $canPlans ? 'true' : 'false',
                    $canPpas ? 'true' : 'false',
                    $canMaps ? 'true' : 'false',
                ),
                entityType: DesignatedPlanningStaff::class,
                entityId: $designation->id,
            );

            return back()->with('status', "Updated planning staff scopes for {$employee->full_name}.");

        }, attempts: 3);
    }

    public function update(Request $request, DesignatedPlanningStaff $staff): RedirectResponse
    {
        return DB::transaction(function () use ($request, $staff): RedirectResponse {
            $this->authorization->resolve($request->user());
            User::query()->lockForUpdate()->findOrFail($staff->user_id);
            $staff = $staff->newQuery()->lockForUpdate()->findOrFail($staff->id);
            abort_if($staff->revoked_at !== null, 409, 'This planning designation has already been revoked.');
            $actor = $request->user();
            $perms = $this->authorization->authorizeStaffDesignation($actor, $staff);

            $data = $request->validate([
                'can_manage_plans' => ['required', 'boolean'],
                'can_manage_ppas' => ['required', 'boolean'],
                'can_manage_maps' => ['required', 'boolean'],
            ]);

            $this->authorization->authorizeDesignationScopes($perms, $data);
            $employee = Employee::query()->with('user')->findOrFail($staff->employee_id);
            abort_if((int) $employee->department_id !== (int) $staff->department_id
                || (int) $employee->user_id !== (int) $staff->user_id
                || $employee->employment_status !== 'active' || $employee->separation_date !== null
                || ! $employee->user?->is_active || $employee->user?->role === 'system_admin',
                409, 'Revoke the stale designation and select a currently eligible staff member.');

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
                    'Updated planning staff #%d scopes (plans=%s, ppas=%s, maps=%s).',
                    $staff->id,
                    $staff->can_manage_plans ? 'true' : 'false',
                    $staff->can_manage_ppas ? 'true' : 'false',
                    $staff->can_manage_maps ? 'true' : 'false',
                ),
                entityType: DesignatedPlanningStaff::class,
                entityId: $staff->id,
            );

            return back()->with('status', 'Updated designated planning staff scopes.');

        }, attempts: 3);
    }

    public function destroy(Request $request, DesignatedPlanningStaff $staff): RedirectResponse
    {
        return DB::transaction(function () use ($request, $staff): RedirectResponse {
            $this->authorization->resolve($request->user());
            User::query()->lockForUpdate()->findOrFail($staff->user_id);
            $staff = $staff->newQuery()->lockForUpdate()->findOrFail($staff->id);
            abort_if($staff->revoked_at !== null, 409, 'This planning designation has already been revoked.');
            $actor = $request->user();
            $this->authorization->authorizeStaffDesignation($actor, $staff);

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
                summary: "Revoked office planning designation #{$staff->id}.",
                entityType: DesignatedPlanningStaff::class,
                entityId: $staff->id,
            );

            return back()->with('status', 'Revoked planning staff designation.');

        }, attempts: 3);
    }
}
