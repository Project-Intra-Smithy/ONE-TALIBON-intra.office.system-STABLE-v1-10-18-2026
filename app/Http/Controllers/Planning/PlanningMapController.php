<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAttachmentCustody;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

final class PlanningMapController extends Controller
{
    public const ALLOWED_CATEGORIES = [
        'Macro & Spatial',
        'Hazard & DRRM',
        'Infrastructure & Utilities',
        'Social & Economic',
        'Environment & Coastal',
    ];

    public const ALLOWED_STATUSES = ['Draft', 'For Review', 'Published', 'Archived'];

    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $permissions = $this->authorization->resolve($user);

        $maps = PlanningMap::query()
            ->orderBy('map_code')
            ->get()
            ->map(fn (PlanningMap $map): array => [
                ...$this->authorization->recordCapabilities($permissions, $map),
                'id' => $map->map_code,
                'dbId' => $map->id,
                'code' => $map->map_code,
                'title' => $map->title,
                'category' => $map->category,
                'planCode' => $map->plan_code,
                'scale' => $map->scale,
                'crs' => $map->crs,
                'coverage' => $map->coverage,
                'updatedYear' => $map->updated_year,
                'status' => $map->status,
                'provenanceStatus' => $map->provenance_status,
                'summary' => $map->summary ?? '',
                'centerLat' => (float) $map->center_lat,
                'centerLng' => (float) $map->center_lng,
                'defaultZoom' => (int) $map->default_zoom,
                'barangays' => $map->barangays ?? [],
                'relatedPlanCodes' => $map->related_plan_codes ?? [],
                'relatedPpaCodes' => $map->related_ppa_codes ?? [],
            ])
            ->values();

        $attachments = PlanningAttachment::query()
            ->where('parent_type', 'map')
            ->whereNull('archived_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (PlanningAttachment $attachment): bool => $this->authorization->canViewAttachment($user, $attachment))
            ->map(fn (PlanningAttachment $attachment): array => [
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
                'canArchive' => $this->authorization->canArchiveAttachment($user, $attachment),
                'downloadUrl' => "/planning/attachments/{$attachment->public_id}/download",
                'createdAt' => $attachment->created_at?->toIso8601String(),
            ])
            ->values();

        return Inertia::render('PlanningMaps/Index', [
            'planningMaps' => $maps,
            'attachments' => $attachments,
            'planningPermissions' => $permissions,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        return DB::transaction(function () use ($request): RedirectResponse {
            $this->authorization->resolve($request->user());
            $user = $request->user();
            $data = $request->validate([
                'map_code' => ['required', 'string', 'max:100', 'unique:planning_maps,map_code'],
                'title' => ['required', 'string', 'max:255'],
                'category' => ['required', 'string', Rule::in(self::ALLOWED_CATEGORIES)],
                'plan_code' => ['required', 'string', 'max:100'],
                'scale' => ['nullable', 'string', 'max:64'],
                'crs' => ['nullable', 'string', 'max:64'],
                'coverage' => ['nullable', 'string', 'max:255'],
                'updated_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'summary' => ['nullable', 'string', 'max:2000'],
                'center_lat' => ['nullable', 'numeric', 'between:-90,90'],
                'center_lng' => ['nullable', 'numeric', 'between:-180,180'],
                'default_zoom' => ['nullable', 'integer', 'min:5', 'max:19'],
                'barangays' => ['nullable', 'array'],
                'barangays.*' => ['string', 'max:120'],
                'related_plan_codes' => ['nullable', 'array'],
                'related_plan_codes.*' => ['string', 'max:100'],
                'related_ppa_codes' => ['nullable', 'array'],
                'related_ppa_codes.*' => ['string', 'max:100'],
            ]);

            $perms = $this->authorization->authorizeMapMutation($user, $data['status']);
            app(PlanningAttachmentCustody::class)->assertIdentifiersAvailable('map', [trim($data['map_code'])], 'map_code');

            $map = PlanningMap::query()->create([
                'map_code' => trim($data['map_code']),
                'title' => trim($data['title']),
                'category' => $data['category'],
                'plan_code' => trim($data['plan_code']),
                'scale' => $data['scale'] ?? '1:25,000',
                'crs' => $data['crs'] ?? 'PRS92 / Luzon 1911',
                'coverage' => $data['coverage'] ?? 'Municipality-wide (25 Barangays)',
                'updated_year' => (int) ($data['updated_year'] ?? now()->year),
                'status' => $data['status'],
                'provenance_status' => 'awaiting_official_gis',
                'summary' => $data['summary'] ?? 'Provisional thematic map overlay awaiting official GIS verification.',
                'center_lat' => (float) ($data['center_lat'] ?? 10.153100),
                'center_lng' => (float) ($data['center_lng'] ?? 124.326800),
                'default_zoom' => (int) ($data['default_zoom'] ?? 12),
                'barangays' => $data['barangays'] ?? ['Poblacion'],
                'related_plan_codes' => $data['related_plan_codes'] ?? [trim($data['plan_code'])],
                'related_ppa_codes' => $data['related_ppa_codes'] ?? [],
                'lead_department_id' => $perms['actorDepartmentId'],
                'created_by_user_id' => $user->id,
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.map.created',
                summary: "Created planning map {$map->map_code} ({$map->title}).",
                entityType: PlanningMap::class,
                entityId: $map->id,
            );

            return back()->with('status', "Planning map {$map->map_code} saved.");

        }, attempts: 3);
    }

    public function update(Request $request, PlanningMap $planningMap): RedirectResponse
    {
        return DB::transaction(function () use ($request, $planningMap): RedirectResponse {
            $this->authorization->resolve($request->user());
            $planningMap = $planningMap->newQuery()->lockForUpdate()->findOrFail($planningMap->id);
            $user = $request->user();
            $data = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'category' => ['required', 'string', Rule::in(self::ALLOWED_CATEGORIES)],
                'plan_code' => ['required', 'string', 'max:100'],
                'scale' => ['nullable', 'string', 'max:64'],
                'crs' => ['nullable', 'string', 'max:64'],
                'coverage' => ['nullable', 'string', 'max:255'],
                'updated_year' => ['nullable', 'integer', 'min:2000', 'max:2100'],
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'summary' => ['nullable', 'string', 'max:2000'],
                'center_lat' => ['nullable', 'numeric', 'between:-90,90'],
                'center_lng' => ['nullable', 'numeric', 'between:-180,180'],
                'default_zoom' => ['nullable', 'integer', 'min:5', 'max:19'],
                'barangays' => ['nullable', 'array'],
                'barangays.*' => ['string', 'max:120'],
                'related_plan_codes' => ['nullable', 'array'],
                'related_plan_codes.*' => ['string', 'max:100'],
                'related_ppa_codes' => ['nullable', 'array'],
                'related_ppa_codes.*' => ['string', 'max:100'],
            ]);

            $this->authorization->authorizeMapMutation($user, $data['status'], existing: $planningMap);

            $planningMap->update([
                'title' => trim($data['title']),
                'category' => $data['category'],
                'plan_code' => trim($data['plan_code']),
                'scale' => $data['scale'] ?? $planningMap->scale,
                'crs' => $data['crs'] ?? $planningMap->crs,
                'coverage' => $data['coverage'] ?? $planningMap->coverage,
                'updated_year' => (int) ($data['updated_year'] ?? $planningMap->updated_year),
                'status' => $data['status'],
                'summary' => $data['summary'] ?? $planningMap->summary,
                'center_lat' => (float) ($data['center_lat'] ?? $planningMap->center_lat),
                'center_lng' => (float) ($data['center_lng'] ?? $planningMap->center_lng),
                'default_zoom' => (int) ($data['default_zoom'] ?? $planningMap->default_zoom),
                'barangays' => $data['barangays'] ?? $planningMap->barangays,
                'related_plan_codes' => $data['related_plan_codes'] ?? $planningMap->related_plan_codes,
                'related_ppa_codes' => $data['related_ppa_codes'] ?? $planningMap->related_ppa_codes,
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.map.updated',
                summary: "Updated planning map {$planningMap->map_code}.",
                entityType: PlanningMap::class,
                entityId: $planningMap->id,
            );

            return back()->with('status', "Planning map {$planningMap->map_code} updated.");

        }, attempts: 3);
    }

    public function updateStatus(Request $request, PlanningMap $planningMap): RedirectResponse
    {
        return DB::transaction(function () use ($request, $planningMap): RedirectResponse {
            $this->authorization->resolve($request->user());
            $planningMap = $planningMap->newQuery()->lockForUpdate()->findOrFail($planningMap->id);
            $user = $request->user();
            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
            ]);

            $this->authorization->authorizeMapMutation($user, $data['status'], existing: $planningMap);

            $previousStatus = $planningMap->status;
            $planningMap->update([
                'status' => $data['status'],
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.map.status_changed',
                summary: "Changed planning map {$planningMap->map_code} status from {$previousStatus} to {$planningMap->status}.",
                entityType: PlanningMap::class,
                entityId: $planningMap->id,
            );

            return back()->with('status', "Planning map {$planningMap->map_code} status updated to {$planningMap->status}.");

        }, attempts: 3);
    }

    public function destroy(Request $request, PlanningMap $planningMap): RedirectResponse
    {
        return DB::transaction(function () use ($request, $planningMap): RedirectResponse {
            $this->authorization->resolve($request->user());
            $planningMap = $planningMap->newQuery()->lockForUpdate()->findOrFail($planningMap->id);
            $user = $request->user();
            $this->authorization->authorizeMapMutation($user, isDelete: true);

            if ($planningMap->status !== 'Draft') {
                throw ValidationException::withMessages([
                    'map' => 'Only Draft planning maps can be deleted.',
                ]);
            }

            $code = $planningMap->map_code;
            $id = $planningMap->id;
            app(PlanningAttachmentCustody::class)->assertDeletable('map', $planningMap, [$planningMap->map_code]);
            $planningMap->delete();

            $this->audit->record(
                actor: $user,
                action: 'planning.map.deleted',
                summary: "Deleted draft planning map {$code}.",
                entityType: PlanningMap::class,
                entityId: $id,
            );

            return back()->with('status', "Draft planning map {$code} deleted.");

        }, attempts: 3);
    }
}
