<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\DesignatedPlanningStaff;
use App\Models\DevelopmentPlan;
use App\Models\Employee;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAttachmentCustody;
use App\Services\Planning\PlanningAuthorizationService;
use App\Services\Planning\PlanningDossier;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class DevelopmentPlanController extends Controller
{
    public const ALLOWED_HORIZONS = ['Annual', 'Three-year', 'Six-year', 'Long-term', 'Sectoral'];

    public const ALLOWED_STATUSES = ['Draft', 'For review', 'Updating', 'In force', 'Adopted', 'Due this year', 'Archived'];

    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $permissions = $this->authorization->resolve($user);

        $plans = DevelopmentPlan::query()->with(['ppas', 'maps'])
            ->orderBy('id')
            ->get()
            ->map(fn (DevelopmentPlan $plan): array => [
                ...$this->authorization->recordCapabilities($permissions, $plan),
                'id' => $plan->plan_key,
                'dbId' => $plan->id,
                'code' => $plan->code,
                'title' => $plan->title,
                'horizon' => $plan->horizon,
                'leadOffice' => $plan->lead_office,
                'coordinatingOffices' => $plan->coordinating_offices ?? [],
                'coverageStart' => $plan->coverage_start,
                'coverageEnd' => $plan->coverage_end,
                'status' => $plan->status,
                'sectionsComplete' => $plan->sections_complete,
                'sectionsTotal' => $plan->sections_total,
                'lastAction' => $plan->last_action ?? 'Provisional draft recorded',
                'lastActionDate' => $plan->last_action_date ?? '',
                'nextMilestone' => $plan->next_milestone ?? '',
                'nextMilestoneDate' => $plan->next_milestone_date ?? '',
                'requiredAction' => $plan->required_action ?? '',
                'authority' => $plan->authority ?? '',
                'documentRef' => $plan->document_ref ?? $plan->code,
                'provenanceStatus' => $plan->provenance_status,
                'linkedPpas' => $plan->ppas->map(fn ($ppa) => ['id' => $ppa->ppa_code, 'title' => $ppa->title, 'office' => $ppa->responsible_office, 'budget' => $ppa->appropriation_amount, 'href' => '/ppas?search='.urlencode($ppa->ppa_code)]),
                'linkedMapIds' => $plan->maps->pluck('id'),
                'chapterNotes' => $plan->chapters ?? [], 'sbResolutionNo' => $plan->adoption_reference,
                'sbAdoptedDate' => $plan->adoption_date?->format('Y-m-d'), 'mdcResolutionNo' => $plan->mdc_reference, 'higherReviewRef' => $plan->higher_review_reference,
            ])
            ->values();

        $attachments = PlanningAttachment::query()
            ->where('parent_type', 'plan')
            ->whereNull('archived_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (PlanningAttachment $attachment): bool => $this->authorization->canViewAttachment($user, $attachment))
            ->map(fn (PlanningAttachment $attachment): array => $this->presentAttachment($attachment))
            ->values();

        return Inertia::render('Plans/Index', [
            'plans' => $plans,
            'mapOptions' => PlanningMap::query()->orderBy('map_code')->get(['id', 'map_code as code', 'title']),
            'attachments' => $attachments,
            'planningPermissions' => $permissions,
            'designatedStaff' => $this->presentDesignatedStaff($permissions['canDesignateStaff']),
            'mpdoStaffPool' => $this->presentMpdoStaffPool($permissions['canDesignateStaff']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request): RedirectResponse {
            $this->authorization->resolve($request->user());
            $user = $request->user();
            $data = $request->validate([
                'code' => ['required', 'string', 'max:100', 'unique:development_plans,code'],
                'title' => ['required', 'string', 'max:255'],
                'horizon' => ['required', 'string', Rule::in(self::ALLOWED_HORIZONS)],
                'lead_office' => ['required', 'string', 'max:255'],
                'coordinating_offices' => ['nullable', 'array'],
                'coordinating_offices.*' => ['string', 'max:255'],
                'coverage_start' => ['required', 'integer', 'min:2000', 'max:2100'],
                'coverage_end' => ['required', 'integer', 'min:2000', 'max:2100', 'gte:coverage_start'],
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'sections_complete' => ['nullable', 'integer', 'min:0', 'max:100'],
                'sections_total' => ['nullable', 'integer', 'min:0', 'max:100'],
                'last_action' => ['nullable', 'string', 'max:255'],
                'last_action_date' => ['nullable', 'string', 'max:32'],
                'next_milestone' => ['nullable', 'string', 'max:255'],
                'next_milestone_date' => ['nullable', 'string', 'max:32'],
                'required_action' => ['nullable', 'string', 'max:2000'],
                'authority' => ['nullable', 'string', 'max:255'],
                'document_ref' => ['nullable', 'string', 'max:120'],
                'linked_map_ids' => ['nullable', 'array', 'max:100'],
                'linked_map_ids.*' => ['required', 'integer', 'distinct', 'min:1'],
                'chapters' => ['nullable', 'array', 'max:100'],
                'chapters.*' => ['required', 'string', 'max:2000'],
                'adoption_date' => ['nullable', 'date_format:Y-m-d'],
                'adoption_reference' => ['nullable', 'string', 'max:255'],
                'mdc_reference' => ['nullable', 'string', 'max:255'],
                'higher_review_reference' => ['nullable', 'string', 'max:255'],

            ]);

            $perms = $this->authorization->authorizePlanMutation($user, $data['status']);

            if (in_array($data['status'], ['In force', 'Adopted'], true) && trim((string) ($data['authority'] ?? '')) === '') {
                throw ValidationException::withMessages([
                    'authority' => 'An adoption/authority reference is required when setting a plan to In force or Adopted.',
                ]);
            }

            $office = $this->authorization->officeIdentity($data['lead_office'], 'lead_office');
            $planKey = 'plan-'.Str::slug($data['code']).'-'.Str::lower(Str::random(4));
            app(PlanningAttachmentCustody::class)->assertIdentifiersAvailable('plan', [trim($data['code']), $planKey], 'code');
            $plan = DevelopmentPlan::query()->create([
                ...$this->dossier($data, $perms),
                'plan_key' => $planKey,
                'code' => trim($data['code']),
                'title' => trim($data['title']),
                'horizon' => $data['horizon'],
                'lead_office' => $office->name,
                'lead_department_id' => $office->id,
                'coordinating_offices' => $data['coordinating_offices'] ?? [],
                'coverage_start' => (int) $data['coverage_start'],
                'coverage_end' => (int) $data['coverage_end'],
                'status' => $data['status'],
                'sections_complete' => (int) ($data['sections_complete'] ?? 0),
                'sections_total' => (int) ($data['sections_total'] ?? 0),
                'last_action' => $data['last_action'] ?? 'Plan record created',
                'last_action_date' => $data['last_action_date'] ?? now()->format('Y-m-d'),
                'next_milestone' => $data['next_milestone'] ?? null,
                'next_milestone_date' => $data['next_milestone_date'] ?? null,
                'required_action' => $data['required_action'] ?? null,
                'authority' => $data['authority'] ?? null,
                'document_ref' => $data['document_ref'] ?? trim($data['code']),
                'provenance_status' => 'provisional_draft',
                'created_by_user_id' => $user->id,
                'updated_by_user_id' => $user->id,
            ]);

            app(PlanningDossier::class)->syncMaps($plan, $data);
            $this->audit->record(
                actor: $user,
                action: 'planning.plan.created',
                summary: "Created development plan {$plan->code} ({$plan->title}).",
                entityType: DevelopmentPlan::class,
                entityId: $plan->id,
            );

            return back()->with('status', "Development plan {$plan->code} saved.");

        }, attempts: 3);
    }

    public function update(Request $request, DevelopmentPlan $plan): RedirectResponse
    {
        return DB::transaction(function () use ($request, $plan): RedirectResponse {
            $this->authorization->resolve($request->user());
            $plan = $plan->newQuery()->lockForUpdate()->findOrFail($plan->id);
            $user = $request->user();
            $data = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'horizon' => ['required', 'string', Rule::in(self::ALLOWED_HORIZONS)],
                'lead_office' => ['required', 'string', 'max:255'],
                'coordinating_offices' => ['nullable', 'array'],
                'coordinating_offices.*' => ['string', 'max:255'],
                'coverage_start' => ['required', 'integer', 'min:2000', 'max:2100'],
                'coverage_end' => ['required', 'integer', 'min:2000', 'max:2100', 'gte:coverage_start'],
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'sections_complete' => ['nullable', 'integer', 'min:0', 'max:100'],
                'sections_total' => ['nullable', 'integer', 'min:0', 'max:100'],
                'last_action' => ['nullable', 'string', 'max:255'],
                'last_action_date' => ['nullable', 'string', 'max:32'],
                'next_milestone' => ['nullable', 'string', 'max:255'],
                'next_milestone_date' => ['nullable', 'string', 'max:32'],
                'required_action' => ['nullable', 'string', 'max:2000'],
                'authority' => ['nullable', 'string', 'max:255'],
                'document_ref' => ['nullable', 'string', 'max:120'],
                'linked_map_ids' => ['nullable', 'array', 'max:100'],
                'linked_map_ids.*' => ['required', 'integer', 'distinct', 'min:1'],
                'chapters' => ['nullable', 'array', 'max:100'],
                'chapters.*' => ['required', 'string', 'max:2000'],
                'adoption_date' => ['nullable', 'date_format:Y-m-d'],
                'adoption_reference' => ['nullable', 'string', 'max:255'],
                'mdc_reference' => ['nullable', 'string', 'max:255'],
                'higher_review_reference' => ['nullable', 'string', 'max:255'],

            ]);

            $requestedAuthority = $request->exists('authority')
                ? (string) ($data['authority'] ?? '')
                : null;

            $perms = $this->authorization->authorizePlanMutation(
                user: $user,
                targetStatus: $data['status'],
                existing: $plan,
                requestedAuthority: $requestedAuthority,
            );

            $office = $this->authorization->officeIdentity($data['lead_office'], 'lead_office');
            $plan->update([
                ...$this->dossier($data, $perms, $plan),
                'title' => trim($data['title']),
                'horizon' => $data['horizon'],
                'lead_office' => $office->name,
                'lead_department_id' => $office->id,
                'coordinating_offices' => $data['coordinating_offices'] ?? $plan->coordinating_offices,
                'coverage_start' => (int) $data['coverage_start'],
                'coverage_end' => (int) $data['coverage_end'],
                'status' => $data['status'],
                'sections_complete' => (int) ($data['sections_complete'] ?? $plan->sections_complete),
                'sections_total' => (int) ($data['sections_total'] ?? $plan->sections_total),
                'last_action' => $data['last_action'] ?? $plan->last_action,
                'last_action_date' => $data['last_action_date'] ?? now()->format('Y-m-d'),
                'next_milestone' => $data['next_milestone'] ?? $plan->next_milestone,
                'next_milestone_date' => $data['next_milestone_date'] ?? $plan->next_milestone_date,
                'required_action' => $data['required_action'] ?? $plan->required_action,
                'authority' => $plan->provenance_status === 'reference_sample'
                    ? $plan->authority
                    : ($data['authority'] ?? $plan->authority),
                'document_ref' => $data['document_ref'] ?? $plan->document_ref,
                'updated_by_user_id' => $user->id,
            ]);

            app(PlanningDossier::class)->syncMaps($plan, $data);
            $this->audit->record(
                actor: $user,
                action: 'planning.plan.updated',
                summary: "Updated development plan {$plan->code}.",
                entityType: DevelopmentPlan::class,
                entityId: $plan->id,
            );

            return back()->with('status', "Development plan {$plan->code} updated.");

        }, attempts: 3);
    }

    public function updateStatus(Request $request, DevelopmentPlan $plan): RedirectResponse
    {
        return DB::transaction(function () use ($request, $plan): RedirectResponse {
            $this->authorization->resolve($request->user());
            $plan = $plan->newQuery()->lockForUpdate()->findOrFail($plan->id);
            $user = $request->user();
            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'authority' => ['nullable', 'string', 'max:255'],
            ]);

            $requestedAuthority = $request->exists('authority') && $data['authority'] !== null
                ? (string) $data['authority']
                : null;

            $perms = $this->authorization->authorizePlanMutation(
                user: $user,
                targetStatus: $data['status'],
                existing: $plan,
                requestedAuthority: $requestedAuthority,
            );

            $authority = isset($data['authority']) && trim($data['authority']) !== ''
                ? trim($data['authority'])
                : $plan->authority;

            if (in_array($data['status'], ['In force', 'Adopted'], true) && trim((string) $authority) === '') {
                throw ValidationException::withMessages([
                    'authority' => 'An adoption/authority reference is required when setting a plan to In force or Adopted.',
                ]);
            }

            $previousStatus = $plan->status;
            $plan->update([
                'status' => $data['status'],
                'authority' => $authority,
                'last_action' => "Status updated to {$data['status']}",
                'last_action_date' => now()->format('Y-m-d'),
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.plan.status_changed',
                summary: "Changed development plan {$plan->code} status from {$previousStatus} to {$plan->status}.",
                entityType: DevelopmentPlan::class,
                entityId: $plan->id,
            );

            return back()->with('status', "Development plan {$plan->code} status updated to {$plan->status}.");

        }, attempts: 3);
    }

    public function destroy(Request $request, DevelopmentPlan $plan): RedirectResponse
    {
        return DB::transaction(function () use ($request, $plan): RedirectResponse {
            $this->authorization->resolve($request->user());
            $plan = $plan->newQuery()->lockForUpdate()->findOrFail($plan->id);
            $user = $request->user();
            $this->authorization->authorizePlanMutation($user, isDelete: true, existing: $plan);

            if (in_array($plan->status, [...PlanningAuthorizationService::OFFICIAL_PLAN_STATUSES, 'Archived'], true) || $plan->provenance_status === 'reference_sample') {
                throw ValidationException::withMessages([
                    'plan' => 'Official or baseline reference plans cannot be deleted; archive or update their status instead.',
                ]);
            }

            $code = $plan->code;
            $id = $plan->id;
            app(PlanningAttachmentCustody::class)->assertDeletable('plan', $plan, [$plan->code, $plan->plan_key]);
            $plan->delete();

            $this->audit->record(
                actor: $user,
                action: 'planning.plan.deleted',
                summary: "Deleted draft development plan {$code}.",
                entityType: DevelopmentPlan::class,
                entityId: $id,
            );

            return back()->with('status', "Draft development plan {$code} deleted.");

        }, attempts: 3);
    }

    private function presentAttachment(PlanningAttachment $attachment): array
    {
        return [
            'publicId' => $attachment->public_id,
            'parentType' => $attachment->parent_type,
            'parentCode' => $attachment->parent_code,
            'parentRecordId' => $attachment->parent_record_id,
            'title' => $attachment->title,
            'fileName' => $attachment->file_name,
            'mimeType' => $attachment->mime_type,
            'sizeBytes' => $attachment->size_bytes,
            'category' => $attachment->category,
            'visibility' => $attachment->visibility,
            'previewUrl' => "/planning/attachments/{$attachment->public_id}/preview",
            'canArchive' => $this->authorization->canArchiveAttachment(request()->user(), $attachment),
            'downloadUrl' => "/planning/attachments/{$attachment->public_id}/download",
            'createdAt' => $attachment->created_at?->toIso8601String(),
        ];
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function presentDesignatedStaff(bool $include): array
    {
        if (! $include) {
            return [];
        }

        return DesignatedPlanningStaff::query()
            ->with(['employee', 'user'])
            ->where('department_id', $this->authorization->resolve(request()->user())['actorDepartmentId'])
            ->whereNull('revoked_at')
            ->orderBy('id')
            ->get()
            ->map(fn (DesignatedPlanningStaff $staff): array => [
                'id' => $staff->id,
                'userId' => $staff->user_id,
                'employeeId' => $staff->employee_id,
                'fullName' => $staff->employee?->full_name ?? $staff->user?->name ?? 'MPDC Staff',
                'positionTitle' => $staff->employee?->position_title ?? 'Planning Staff',
                'canManagePlans' => (bool) $staff->can_manage_plans,
                'canManagePpas' => (bool) $staff->can_manage_ppas,
                'canManageMaps' => (bool) $staff->can_manage_maps,
            ])
            ->values()
            ->all();
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function presentMpdoStaffPool(bool $include): array
    {
        if (! $include) {
            return [];
        }

        $officeId = $this->authorization->resolve(request()->user())['actorDepartmentId'];

        return Employee::query()
            ->with('user')
            ->where('department_id', $officeId)
            ->where('employment_status', 'active')
            ->whereNull('separation_date')
            ->whereNotNull('user_id')
            ->orderBy('full_name')
            ->get()
            ->filter(fn (Employee $emp): bool => $emp->user !== null && $emp->user->is_active && $emp->user->role !== 'department_head' && $emp->user->role !== 'system_admin')
            ->map(fn (Employee $emp): array => [
                'userId' => $emp->user_id,
                'employeeId' => $emp->id,
                'fullName' => $emp->full_name,
                'positionTitle' => $emp->position_title,
                'email' => $emp->work_email,
            ])
            ->values()
            ->all();
    }

    private function dossier(array $data, array $permissions, ?DevelopmentPlan $existing = null): array
    {
        $fields = array_intersect_key($data, array_flip(['chapters', 'adoption_date', 'adoption_reference', 'mdc_reference', 'higher_review_reference']));
        foreach (['adoption_date', 'adoption_reference', 'mdc_reference', 'higher_review_reference'] as $field) {
            if (array_key_exists($field, $fields) && (string) $fields[$field] !== (string) ($existing?->{$field} instanceof \DateTimeInterface ? $existing->{$field}->format('Y-m-d') : $existing?->{$field})
                && ! $permissions['canPublishOrArchive']) {
                throw new AuthorizationException('Only the authorized Planning Head may record adoption and review references.');
            }
        }
        $complete = $data['sections_complete'] ?? $existing?->sections_complete ?? 0;
        $total = $data['sections_total'] ?? $existing?->sections_total ?? 0;
        if ($complete > $total) {
            throw ValidationException::withMessages(['sections_complete' => 'Completed sections cannot exceed the recorded total.']);
        }

        return $fields;
    }
}
