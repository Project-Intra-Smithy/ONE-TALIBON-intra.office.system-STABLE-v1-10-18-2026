<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\DesignatedPlanningStaff;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

final class PlanningAuthorizationService
{
    public const MPDO_CODES = ['MPDO', 'MPDC'];

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

        if (! $user || ! $user->is_active) {
            return $denied;
        }

        // Policy #185: system_admin has zero municipal planning decision authority.
        if ($user->role === 'system_admin') {
            return $denied;
        }

        $employee = $user->employee()->with('department')->first();
        if (! $employee || $employee->employment_status !== 'active') {
            return $denied;
        }

        $department = $employee->department;
        if (! $department || ! $department->is_active) {
            return $denied;
        }

        $departmentId = (int) $department->id;
        $departmentCode = strtoupper(trim((string) $department->code));
        $departmentName = (string) $department->name;
        $isMpdoOffice = in_array($departmentCode, self::MPDO_CODES, true);

        // 1. MPDC / MPDO Head
        if ($user->role === 'department_head' && $isMpdoOffice) {
            return [
                'isMpdcHead' => true,
                'isDesignatedStaff' => false,
                'isImplementingOfficeHead' => false,
                'canManagePlans' => true,
                'canManagePpas' => true,
                'canManageMaps' => true,
                'canProposeOfficePpa' => true,
                'canPublishOrArchive' => true,
                'canDelete' => true,
                'canDesignateStaff' => true,
                'canUploadAttachments' => true,
                'canViewExecutiveAttachments' => true,
                'actorDepartmentId' => $departmentId,
                'actorDepartmentCode' => $departmentCode,
                'actorDepartmentName' => $departmentName,
            ];
        }

        // 2. Designated MPDC / MPDO Staff (active designation in MPDO with granular boolean scopes)
        if ($isMpdoOffice) {
            $designation = DesignatedPlanningStaff::query()
                ->where('user_id', $user->id)
                ->where('department_id', $departmentId)
                ->whereNull('revoked_at')
                ->first();

            if ($designation) {
                $canPlans = (bool) $designation->can_manage_plans;
                $canPpas = (bool) $designation->can_manage_ppas;
                $canMaps = (bool) $designation->can_manage_maps;
                $hasAnyScope = $canPlans || $canPpas || $canMaps;

                return [
                    'isMpdcHead' => false,
                    'isDesignatedStaff' => $hasAnyScope,
                    'isImplementingOfficeHead' => false,
                    'canManagePlans' => $canPlans,
                    'canManagePpas' => $canPpas,
                    'canManageMaps' => $canMaps,
                    'canProposeOfficePpa' => $canPpas,
                    'canPublishOrArchive' => false,
                    'canDelete' => false,
                    'canDesignateStaff' => false,
                    'canUploadAttachments' => $hasAnyScope,
                    'canViewExecutiveAttachments' => $hasAnyScope,
                    'actorDepartmentId' => $departmentId,
                    'actorDepartmentCode' => $departmentCode,
                    'actorDepartmentName' => $departmentName,
                ];
            }
        }

        // 3. Implementing Office Head (non-MPDO department_head)
        if ($user->role === 'department_head' && ! $isMpdoOffice && $department->is_routable) {
            return [
                'isMpdcHead' => false,
                'isDesignatedStaff' => false,
                'isImplementingOfficeHead' => true,
                'canManagePlans' => false,
                'canManagePpas' => false,
                'canManageMaps' => false,
                'canProposeOfficePpa' => true,
                'canPublishOrArchive' => false,
                'canDelete' => false,
                'canDesignateStaff' => false,
                'canUploadAttachments' => true,
                'canViewExecutiveAttachments' => false,
                'actorDepartmentId' => $departmentId,
                'actorDepartmentCode' => $departmentCode,
                'actorDepartmentName' => $departmentName,
            ];
        }

        // 4. Mayor Approver can view executive planning attachments (read-only on planning suite CRUD)
        if ($user->role === 'mayor_approver' && $departmentCode === 'MAYOR') {
            return [
                ...$denied,
                'canViewExecutiveAttachments' => true,
                'actorDepartmentId' => $departmentId,
                'actorDepartmentCode' => $departmentCode,
                'actorDepartmentName' => $departmentName,
            ];
        }

        return [
            ...$denied,
            'actorDepartmentId' => $departmentId,
            'actorDepartmentCode' => $departmentCode,
            'actorDepartmentName' => $departmentName,
        ];
    }

    public function authorizePlanMutation(User $user, ?string $targetStatus = null, bool $isDelete = false): array
    {
        $perms = $this->resolve($user);

        if ($isDelete) {
            if (! $perms['canDelete']) {
                throw new AuthorizationException('Only the MPDC Head may delete non-official draft plan records.');
            }

            return $perms;
        }

        if (! $perms['canManagePlans']) {
            throw new AuthorizationException('You are not authorized to create or modify development plans.');
        }

        if ($targetStatus !== null && in_array($targetStatus, ['In force', 'Adopted', 'Published', 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may transition a plan to an adopted, published, or archived status.');
        }

        return $perms;
    }

    public function authorizePpaMutation(User $user, ?PpaRecord $existing = null, ?string $targetStatus = null, bool $isDelete = false): array
    {
        $perms = $this->resolve($user);

        if ($isDelete) {
            if (! $perms['canDelete']) {
                throw new AuthorizationException('Only the MPDC Head may delete draft PPA records.');
            }

            return $perms;
        }

        if ($perms['canManagePpas']) {
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
                $sameOfficeName = strcasecmp(trim($existing->responsible_office), trim((string) $perms['actorDepartmentName'])) === 0;

                if ((! $sameDepartment && ! $sameOfficeName) || ! in_array($existing->status, ['Draft', 'Planned'], true)) {
                    throw new AuthorizationException('Implementing Office Heads may only modify Draft or Planned PPA proposals belonging to their own office.');
                }
            }

            return $perms;
        }

        throw new AuthorizationException('You are not authorized to create or modify PPA records.');
    }

    public function authorizeMapMutation(User $user, ?string $targetStatus = null, bool $isDelete = false): array
    {
        $perms = $this->resolve($user);

        if ($isDelete) {
            if (! $perms['canDelete']) {
                throw new AuthorizationException('Only the MPDC Head may delete draft planning map records.');
            }

            return $perms;
        }

        if (! $perms['canManageMaps']) {
            throw new AuthorizationException('You are not authorized to create or modify planning maps.');
        }

        if ($targetStatus !== null && in_array($targetStatus, ['Published', 'Archived'], true) && ! $perms['canPublishOrArchive']) {
            throw new AuthorizationException('Only the MPDC Head may publish or archive planning maps.');
        }

        return $perms;
    }

    public function authorizeStaffDesignation(User $user): array
    {
        $perms = $this->resolve($user);
        if (! $perms['canDesignateStaff']) {
            throw new AuthorizationException('Only the MPDC Head may designate or revoke MPDC planning staff scopes.');
        }

        return $perms;
    }

    public function canViewAttachment(User $user, PlanningAttachment $attachment): bool
    {
        if ($attachment->archived_at !== null) {
            return false;
        }

        $perms = $this->resolve($user);

        return match ($attachment->visibility) {
            'public_portal', 'lgu_internal' => $user->is_active,
            'office_restricted' => $perms['isMpdcHead']
                || $perms['isDesignatedStaff']
                || ($perms['actorDepartmentId'] !== null && (int) $attachment->owner_department_id === $perms['actorDepartmentId']),
            'mpdc_executive' => $perms['canViewExecutiveAttachments'],
            default => false,
        };
    }

    public function authorizeAttachmentUpload(User $user, string $parentType, string $parentCode, string $visibility): array
    {
        $perms = $this->resolve($user);
        if (! $perms['canUploadAttachments']) {
            throw new AuthorizationException('You are not authorized to upload planning supporting documents.');
        }

        if ($visibility === 'mpdc_executive' && ! $perms['canViewExecutiveAttachments']) {
            throw new AuthorizationException('You are not authorized to upload executive-restricted planning attachments.');
        }

        return match ($parentType) {
            'plan' => $this->authorizePlanAttachmentUpload($perms, $parentCode),
            'ppa' => $this->authorizePpaAttachmentUpload($perms, $parentCode),
            'map' => $this->authorizeMapAttachmentUpload($perms, $parentCode),
            default => throw new AuthorizationException('Unsupported planning attachment parent type.'),
        };
    }

    private function authorizePlanAttachmentUpload(array $perms, string $parentCode): array
    {
        if (! $perms['canManagePlans']) {
            throw new AuthorizationException('You are not authorized to attach documents to development plans.');
        }

        if (! DevelopmentPlan::query()->where('code', $parentCode)->orWhere('plan_key', $parentCode)->exists()) {
            throw new AuthorizationException('Target development plan record does not exist.');
        }

        return $perms;
    }

    private function authorizePpaAttachmentUpload(array $perms, string $parentCode): array
    {
        $ppa = PpaRecord::query()->where('ppa_code', $parentCode)->first();
        if (! $ppa) {
            throw new AuthorizationException('Target PPA record does not exist.');
        }

        if ($perms['canManagePpas']) {
            return $perms;
        }

        if ($perms['canProposeOfficePpa']) {
            $sameDepartment = $ppa->implementing_department_id !== null
                && (int) $ppa->implementing_department_id === $perms['actorDepartmentId'];
            $sameOfficeName = strcasecmp(trim($ppa->responsible_office), trim((string) $perms['actorDepartmentName'])) === 0;

            if ($sameDepartment || $sameOfficeName) {
                return $perms;
            }
        }

        throw new AuthorizationException('You are not authorized to attach documents to this PPA record.');
    }

    private function authorizeMapAttachmentUpload(array $perms, string $parentCode): array
    {
        if (! $perms['canManageMaps']) {
            throw new AuthorizationException('You are not authorized to attach documents to planning maps.');
        }

        if (! PlanningMap::query()->where('map_code', $parentCode)->exists()) {
            throw new AuthorizationException('Target planning map record does not exist.');
        }

        return $perms;
    }
}
