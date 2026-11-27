<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\Department;
use App\Models\DesignatedPlanningStaff;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use App\Models\User;
use App\Services\AccountSessionEligibility;
use App\Services\AuthenticationAssurance;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PlanningAuthorizationService
{
    public const MPDO_CODES = ['MPDO', 'MPDC'];

    public const OFFICIAL_PLAN_STATUSES = ['In force', 'Adopted', 'Published'];

    /**
     * Resolve exact server-authorized capabilities for the Local Development Planning Suite.
     *
     * Governance Policy #185:
     * Technical administrators (`system_admin`) NEVER gain municipal planning decision authority
     * solely from their administrator role.
     *
     * @return array{
     *     isMpdcHead: bool,
     *     isDesignatedStaff: bool,
     *     isImplementingOfficeHead: bool,
     *     canManagePlans: bool,
     *     canManagePpas: bool,
     *     canManageMaps: bool,
     *     canProposeOfficePpa: bool,
     *     canPublishOrArchive: bool,
     *     canDelete: bool,
     *     canDesignateStaff: bool,
     *     canUploadAttachments: bool,
     *     canViewExecutiveAttachments: bool,
     *     actorDepartmentId: int|null,
     *     actorDepartmentCode: string|null,
     *     actorDepartmentName: string|null
     * }
     */
    public function resolve(?User $user): array
    {
        $denied = [
            'isMpdcHead' => false,
            'isDesignatedStaff' => false,
            'isImplementingOfficeHead' => false,
            'canManagePlans' => false,
            'canManagePpas' => false,
            'canManageMaps' => false,
            'canProposeOfficePpa' => false,
            'canPublishOrArchive' => false,
            'canDelete' => false,
            'canDesignateStaff' => false,
            'canUploadAttachments' => false,
            'canViewExecutiveAttachments' => false,
            'actorDepartmentId' => null,
            'actorDepartmentCode' => null,
            'actorDepartmentName' => null,
        ];

        if ($user) {
            $eligibility = app(AccountSessionEligibility::class);
            $user = DB::transactionLevel() > 0 ? $eligibility->lock($user) : $eligibility->current($user);

        }

        if (! $user || ! $user->is_active) {
            return $denied;
        }

        // Engineer decision #7203434407: internal reads do not require a designation.
        $denied['canViewExecutiveAttachments'] = true;
        $employee = $user->employee()->with('department')->first();
        $department = $employee?->department;
        if (! $employee || ! $department || ! $department->is_active) {
            return $denied;
        }

        $departmentId = (int) $department->id;
        $departmentCode = strtoupper(trim((string) $department->code));
        $context = [...$denied, 'actorDepartmentId' => $departmentId,
            'actorDepartmentCode' => $departmentCode, 'actorDepartmentName' => $department->name];
        if ($user->role === 'system_admin') {
            return $context;
        }
        $isMpdoOffice = in_array($departmentCode, self::MPDO_CODES, true);
        if ($user->role === 'department_head') {
            return [...$context,
                'isMpdcHead' => $isMpdoOffice,
                'isImplementingOfficeHead' => ! $isMpdoOffice && $department->is_routable,
                'canManagePlans' => $isMpdoOffice, 'canManagePpas' => $isMpdoOffice,
                'canManageMaps' => $isMpdoOffice,
                'canProposeOfficePpa' => $isMpdoOffice || (bool) $department->is_routable,
                'canPublishOrArchive' => $isMpdoOffice,
                'canDelete' => $isMpdoOffice || (bool) $department->is_routable,
                'canDesignateStaff' => $isMpdoOffice || (bool) $department->is_routable,
                'canUploadAttachments' => $isMpdoOffice || (bool) $department->is_routable];
        }

        $designation = DesignatedPlanningStaff::query()
            ->where('user_id', $user->id)->where('department_id', $departmentId)
            ->where('employee_id', $employee->id)->whereNull('revoked_at')
            ->when(DB::transactionLevel() > 0, fn ($query) => $query->lockForUpdate())->first();
        if (! $designation) {
            return $context;
        }
        $issuer = User::query()->find($designation->designated_by_user_id);
        $issuer = $issuer ? app(AccountSessionEligibility::class)->current($issuer) : null;
        if (! $issuer || $issuer->role !== 'department_head'
            || (int) $issuer->employee?->department_id !== $departmentId) {
            return $context;
        }
        $canPlans = $isMpdoOffice && (bool) $designation->can_manage_plans;
        $canPpas = ($isMpdoOffice || $department->is_routable) && (bool) $designation->can_manage_ppas;
        $canMaps = $isMpdoOffice && (bool) $designation->can_manage_maps;
        $any = $canPlans || $canPpas || $canMaps;

        return [...$context, 'isDesignatedStaff' => $any,
            'canManagePlans' => $canPlans, 'canManagePpas' => $isMpdoOffice && $canPpas,
            'canManageMaps' => $canMaps, 'canProposeOfficePpa' => $canPpas,
            'canDelete' => $any, 'canUploadAttachments' => $any];
    }

    private function mutationPermissions(User $user): array
    {
        $perms = $this->resolve($user);
        if (DB::transactionLevel() > 0 && ! request()->isMethodSafe()) {
            // resolve() holds the canonical identity locks until the mutation commits.
            $current = User::query()->findOrFail($user->id);
            app(AccountSessionEligibility::class)->requireSession(request(), $current);
            if (! app(AuthenticationAssurance::class)->isSatisfiedAgainst(request(), $current)) {
                throw new AuthorizationException('Current multi-factor authentication assurance is required.');
            }
        }

        return $perms;
    }

    public function recordCapabilities(array $perms, DevelopmentPlan|PpaRecord|PlanningMap $record): array
    {
        if ($record instanceof DevelopmentPlan) {
            $protected = in_array($record->status, [...self::OFFICIAL_PLAN_STATUSES, 'Archived'], true);
            $edit = $perms['canManagePlans'] && (! $protected || $perms['canPublishOrArchive']);
            $remove = $perms['canManagePlans'] && ! $protected;
        } elseif ($record instanceof PlanningMap) {
            $protected = in_array($record->status, ['Published', 'Archived'], true);
            $edit = $perms['canManageMaps'] && (! $protected || $perms['canPublishOrArchive']);
            $remove = $perms['canManageMaps'] && $record->status === 'Draft';
        } else {
            $ownProposal = $perms['canProposeOfficePpa'] && $record->implementing_department_id !== null
                && (int) $record->implementing_department_id === $perms['actorDepartmentId']
                && in_array($record->status, ['Draft', 'Planned'], true);
            $edit = $ownProposal || ($perms['canManagePpas']
                && (! in_array($record->status, ['Completed', 'On Hold'], true) || $perms['canPublishOrArchive']));
            $remove = $edit && in_array($record->status, ['Draft', 'Planned'], true);
        }

        return ['canEdit' => $edit, 'canUploadAttachments' => $edit,
            'canDelete' => $perms['canDelete'] && $remove && $record->provenance_status !== 'reference_sample'];
    }

    public function officeIdentity(string $name, string $field): Department
    {
        $matches = Department::query()->where('is_active', true)->where('name', trim($name))->limit(2)->get();
        if ($matches->count() !== 1) {
            throw ValidationException::withMessages([$field => 'Choose one unambiguous active office from the current directory.']);
        }

        return $matches->first();
    }

    public function authorizePlanMutation(
        User $user,
        ?string $targetStatus = null,
        bool $isDelete = false,
        ?DevelopmentPlan $existing = null,
        ?string $requestedAuthority = null,
    ): array {
        $perms = $this->mutationPermissions($user);

        if ($isDelete) {
            if (! $perms['canDelete'] || ! $perms['canManagePlans']
                || $existing === null || in_array($existing->status, [...self::OFFICIAL_PLAN_STATUSES, 'Archived'], true)) {
                throw new AuthorizationException('You are not authorized to remove plan records.');
            }

            return $perms;
        }

        if (! $perms['canManagePlans']) {
            throw new AuthorizationException('You are not authorized to create or modify development plans.');
        }

        if ($existing !== null && in_array($existing->status, [...self::OFFICIAL_PLAN_STATUSES, 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may modify an official or archived plan.');
        }

        if ($targetStatus !== null && in_array($targetStatus, ['In force', 'Adopted', 'Published', 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may transition a plan to an adopted, published, or archived status.');
        }

        // M5-APP-R2-01: Record-provenance invariant — reference_sample rows can never be promoted
        // to official/adopted status or have their non-official authority disclosure overwritten.
        if ($existing !== null && $existing->provenance_status === 'reference_sample') {
            if ($targetStatus !== null && in_array($targetStatus, self::OFFICIAL_PLAN_STATUSES, true)) {
                throw new AuthorizationException('Reference sample plans cannot be promoted to an official or adopted status.');
            }

            if ($requestedAuthority !== null) {
                $normalizedRequested = trim($requestedAuthority);
                $normalizedCurrent = trim((string) ($existing->authority ?? ''));
                if ($normalizedRequested !== $normalizedCurrent) {
                    throw new AuthorizationException('Reference sample authority disclosure cannot be overwritten.');
                }
            }
        }

        return $perms;
    }

    public function authorizePpaMutation(User $user, ?PpaRecord $existing = null, ?string $targetStatus = null, bool $isDelete = false): array
    {
        $perms = $this->mutationPermissions($user);

        if ($isDelete) {
            if (! $perms['canDelete']) {
                throw new AuthorizationException('Only the MPDC Head may delete draft PPA records.');
            }

            $this->authorizePpaMutation($user, existing: $existing);

            return $perms;
        }

        if ($perms['canManagePpas']) {
            if ($existing !== null && in_array($existing->status, ['Completed', 'On Hold'], true) && ! $perms['canPublishOrArchive']) {
                throw new AuthorizationException('Only the MPDC Head may modify a finalized or held PPA.');
            }
            if ($targetStatus !== null && in_array($targetStatus, ['Completed', 'On Hold'], true) && ! $perms['canPublishOrArchive']) {
                throw new AuthorizationException('Only the MPDC Head may finalize or place PPA records on hold.');
            }

            return $perms;
        }

        // Implementing Office Head can propose or edit their own office's Draft/Planned PPA proposals
        if ($perms['canProposeOfficePpa']) {
            if ($targetStatus !== null && ! in_array($targetStatus, ['Draft', 'Planned'], true)) {
                throw new AuthorizationException('Implementing Office Heads may only submit Draft or Planned PPA proposals.');
            }

            if ($existing !== null) {
                $sameDepartment = $existing->implementing_department_id !== null
                    && (int) $existing->implementing_department_id === $perms['actorDepartmentId'];
                if (! $sameDepartment || ! in_array($existing->status, ['Draft', 'Planned'], true)) {
                    throw new AuthorizationException('Implementing Office Heads may only modify Draft or Planned PPA proposals belonging to their own office.');
                }
            }

            return $perms;
        }

        throw new AuthorizationException('You are not authorized to create or modify PPA records.');
    }

    public function authorizeMapMutation(User $user, ?string $targetStatus = null, bool $isDelete = false, ?PlanningMap $existing = null): array
    {
        $perms = $this->mutationPermissions($user);

        if ($isDelete) {
            if (! $perms['canDelete'] || ! $perms['canManageMaps']) {
                throw new AuthorizationException('You are not authorized to remove planning map records.');
            }

            return $perms;
        }

        if (! $perms['canManageMaps']) {
            throw new AuthorizationException('You are not authorized to create or modify planning maps.');
        }

        if ($existing !== null && in_array($existing->status, ['Published', 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may modify a published or archived map.');
        }

        if ($targetStatus !== null && in_array($targetStatus, ['Published', 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may publish or archive planning maps.');
        }

        return $perms;
    }

    public function authorizeStaffDesignation(User $user, ?DesignatedPlanningStaff $existing = null): array
    {
        $perms = $this->mutationPermissions($user);
        if (! $perms['canDesignateStaff']) {
            throw new AuthorizationException('Only an authorized Department Head may manage their office planning designations.');
        }

        if ($existing !== null && (int) $existing->department_id !== $perms['actorDepartmentId']) {
            throw new AuthorizationException('Planning staff designations belong to the issuing office.');
        }

        return $perms;
    }

    public function authorizeDesignationScopes(array $perms, array $data): void
    {
        if ((! empty($data['can_manage_plans']) && ! $perms['canManagePlans'])
            || (! empty($data['can_manage_ppas']) && ! $perms['canProposeOfficePpa'])
            || (! empty($data['can_manage_maps']) && ! $perms['canManageMaps'])) {
            throw new AuthorizationException('A designation cannot exceed the issuing Head’s office and module authority.');
        }
    }

    public function canViewAttachment(User $user, PlanningAttachment $attachment): bool
    {
        if ($attachment->archived_at !== null) {
            return false;
        }

        return app(AccountSessionEligibility::class)->current($user) !== null
            && in_array($attachment->visibility, ['public_portal', 'lgu_internal', 'office_restricted', 'mpdc_executive'], true);
    }

    public function authorizeAttachmentUpload(User $user, string $parentType, string $parentCode, string $visibility): array
    {
        $perms = $this->mutationPermissions($user);
        if (! $perms['canUploadAttachments']) {
            throw new AuthorizationException('You are not authorized to upload planning supporting documents.');
        }

        if ($visibility === 'mpdc_executive' && ! $perms['canViewExecutiveAttachments']) {
            throw new AuthorizationException('You are not authorized to upload executive-restricted planning attachments.');
        }

        $parent = app(PlanningAttachmentCustody::class)->parent($parentType, $parentCode);

        return match ($parentType) {
            'plan' => $this->authorizePlanMutation($user, existing: $parent),
            'ppa' => $this->authorizePpaMutation($user, existing: $parent),
            'map' => $this->authorizeMapMutation($user, existing: $parent),
            default => throw new AuthorizationException('Unsupported planning attachment parent type.'),
        };
    }

    public function canArchiveAttachment(User $user, PlanningAttachment $attachment): bool
    {
        try {
            $this->authorizeAttachmentArchive($user, $attachment);

            return true;
        } catch (AuthorizationException|ModelNotFoundException) {
            return false;
        }
    }

    public function authorizeAttachmentArchive(User $user, PlanningAttachment $attachment): void
    {
        if ($attachment->archived_at !== null || ! $this->canViewAttachment($user, $attachment)) {
            throw new AuthorizationException('You are not authorized to remove this planning attachment.');
        }

        $this->authorizeAttachmentUpload($user, $attachment->parent_type, $attachment->parent_code, $attachment->visibility);
        $parent = app(PlanningAttachmentCustody::class)->parent($attachment->parent_type, $attachment->parent_code);
        if ($attachment->parent_record_id === null || (int) $parent->getKey() !== $attachment->parent_record_id) {
            throw new AuthorizationException('Historical or mismatched attachment identity requires explicit reconciliation.');
    }
}
}
