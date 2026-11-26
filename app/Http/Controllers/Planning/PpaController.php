<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\PlanningAttachment;
use App\Models\PpaRecord;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class PpaController extends Controller
{
    public const ALLOWED_STATUSES = ['Draft', 'Planned', 'For Procurement', 'Ongoing', 'Completed', 'On Hold'];

    public const ALLOWED_PRIORITIES = ['High', 'Medium', 'Routine'];

    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function index(Request $request): Response
    {
        $user = $request->user();
        $permissions = $this->authorization->resolve($user);

        $records = PpaRecord::query()
            ->orderByDesc('year')
            ->orderBy('ppa_code')
            ->get()
            ->map(fn (PpaRecord $ppa): array => [
                ...$this->authorization->recordCapabilities($permissions, $ppa),
                'id' => $ppa->ppa_code,
                'dbId' => $ppa->id,
                'title' => $ppa->title,
                'sector' => $ppa->sector,
                'responsibleOffice' => $ppa->responsible_office,
                'implementingDepartmentId' => $ppa->implementing_department_id,
                'year' => $ppa->year,
                'relatedDevelopmentPlan' => $ppa->related_development_plan,
                'fundingSource' => $ppa->funding_source,
                'status' => $ppa->status === 'Draft' ? 'Planned' : $ppa->status,
                'rawStatus' => $ppa->status,
                'relatedProjectCount' => $ppa->related_project_count,
                'priority' => $ppa->priority,
                'implementationContext' => $ppa->implementation_context ?? '',
                'location' => $ppa->location ?? 'Municipality of Talibon',
                'barangay' => $ppa->barangay ?? 'Poblacion',
                'appropriationAmount' => (float) $ppa->appropriation_amount,
                'psAmount' => (float) $ppa->ps_amount,
                'mooeAmount' => (float) $ppa->mooe_amount,
                'coAmount' => (float) $ppa->co_amount,
                'climateAdaptationAmount' => (float) $ppa->climate_adaptation_amount,
                'climateMitigationAmount' => (float) $ppa->climate_mitigation_amount,
                'gadAttributed' => (bool) $ppa->gad_attributed,
                'drrmTagged' => (bool) $ppa->drrm_tagged,
                'aipReferenceCode' => $ppa->aip_reference_code,
                'targetQuarter' => $ppa->target_quarter ?? 'Q4 '.$ppa->year,
                'mapCode' => $ppa->map_code,
                'provenanceStatus' => $ppa->provenance_status,
            ])
            ->values();

        $attachments = PlanningAttachment::query()
            ->where('parent_type', 'ppa')
            ->whereNull('archived_at')
            ->orderByDesc('id')
            ->get()
            ->filter(fn (PlanningAttachment $attachment): bool => $this->authorization->canViewAttachment($user, $attachment))
            ->map(fn (PlanningAttachment $attachment): array => [
                'publicId' => $attachment->public_id,
                'parentType' => $attachment->parent_type,
                'parentCode' => $attachment->parent_code,
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

        return Inertia::render('PPAs/Index', [
            'ppaRecords' => $records,
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
                'ppa_code' => ['nullable', 'string', 'max:100', 'unique:ppa_records,ppa_code'],
                'title' => ['required', 'string', 'max:255'],
                'sector' => ['required', 'string', 'max:100'],
                'responsible_office' => ['nullable', 'string', 'max:255'],
                'year' => ['required', 'integer', 'min:2020', 'max:2100'],
                'related_development_plan' => ['required', 'string', 'max:255'],
                'funding_source' => ['required', 'string', 'max:120'],
                'status' => ['nullable', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'priority' => ['nullable', 'string', Rule::in(self::ALLOWED_PRIORITIES)],
                'implementation_context' => ['nullable', 'string', 'max:2000'],
                'location' => ['nullable', 'string', 'max:255'],
                'barangay' => ['nullable', 'string', 'max:120'],
                'appropriation_amount' => ['nullable', 'numeric', 'min:0'],
                'ps_amount' => ['nullable', 'numeric', 'min:0'],
                'mooe_amount' => ['nullable', 'numeric', 'min:0'],
                'co_amount' => ['nullable', 'numeric', 'min:0'],
                'climate_adaptation_amount' => ['nullable', 'numeric', 'min:0'],
                'climate_mitigation_amount' => ['nullable', 'numeric', 'min:0'],
                'gad_attributed' => ['nullable', 'boolean'],
                'drrm_tagged' => ['nullable', 'boolean'],
                'aip_reference_code' => ['nullable', 'string', 'max:120'],
                'target_quarter' => ['nullable', 'string', 'max:32'],
                'map_code' => ['nullable', 'string', 'max:100'],
            ]);

            $targetStatus = $data['status'] ?? 'Planned';
            $perms = $this->authorization->authorizePpaMutation($user, targetStatus: $targetStatus);

            // If Implementing Office Head (and not MPDC manager), lock responsible_office to their own office and status to Planned/Draft
            $responsibleOffice = $perms['canManagePpas']
                ? trim((string) ($data['responsible_office'] ?? $perms['actorDepartmentName'] ?? 'Municipal Planning and Development Office'))
                : (string) $perms['actorDepartmentName'];

            $office = $this->authorization->officeIdentity($responsibleOffice, 'responsible_office');

            $ps = (float) ($data['ps_amount'] ?? 0);
            $mooe = (float) ($data['mooe_amount'] ?? 0);
            $co = (float) ($data['co_amount'] ?? 0);
            $appropriation = isset($data['appropriation_amount']) && (float) $data['appropriation_amount'] > 0
                ? (float) $data['appropriation_amount']
                : ($ps + $mooe + $co);

            $code = isset($data['ppa_code']) && trim($data['ppa_code']) !== ''
                ? trim($data['ppa_code'])
                : sprintf('PPA-%d-%03d', (int) $data['year'], PpaRecord::query()->where('year', (int) $data['year'])->count() + 101);

            $ppa = PpaRecord::query()->create([
                'ppa_code' => $code,
                'title' => trim($data['title']),
                'sector' => trim($data['sector']),
                'responsible_office' => $responsibleOffice,
                'implementing_department_id' => $office->id,
                'year' => (int) $data['year'],
                'related_development_plan' => trim($data['related_development_plan']),
                'funding_source' => trim($data['funding_source']),
                'status' => $targetStatus,
                'related_project_count' => 0,
                'priority' => $data['priority'] ?? 'Routine',
                'implementation_context' => $data['implementation_context'] ?? 'Submitted through the Local Development Planning Suite.',
                'location' => $data['location'] ?? 'Municipality of Talibon',
                'barangay' => $data['barangay'] ?? 'Poblacion',
                'appropriation_amount' => $appropriation,
                'ps_amount' => $ps,
                'mooe_amount' => $mooe,
                'co_amount' => $co,
                'climate_adaptation_amount' => (float) ($data['climate_adaptation_amount'] ?? 0),
                'climate_mitigation_amount' => (float) ($data['climate_mitigation_amount'] ?? 0),
                'gad_attributed' => (bool) ($data['gad_attributed'] ?? false),
                'drrm_tagged' => (bool) ($data['drrm_tagged'] ?? false),
                'aip_reference_code' => $data['aip_reference_code'] ?? null,
                'target_quarter' => $data['target_quarter'] ?? 'Q4 '.$data['year'],
                'map_code' => $data['map_code'] ?? null,
                'provenance_status' => 'provisional_draft',
                'created_by_user_id' => $user->id,
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.ppa.created',
                summary: "Created PPA record {$ppa->ppa_code} ({$ppa->title}).",
                entityType: PpaRecord::class,
                entityId: $ppa->id,
            );

            return back()->with('status', "PPA record {$ppa->ppa_code} saved.");

        }, attempts: 3);
    }

    public function update(Request $request, PpaRecord $ppa): RedirectResponse
    {
        return DB::transaction(function () use ($request, $ppa): RedirectResponse {
            $this->authorization->resolve($request->user());
            $ppa = $ppa->newQuery()->lockForUpdate()->findOrFail($ppa->id);
            $user = $request->user();
            $data = $request->validate([
                'title' => ['required', 'string', 'max:255'],
                'sector' => ['required', 'string', 'max:100'],
                'responsible_office' => ['nullable', 'string', 'max:255'],
                'year' => ['required', 'integer', 'min:2020', 'max:2100'],
                'related_development_plan' => ['required', 'string', 'max:255'],
                'funding_source' => ['required', 'string', 'max:120'],
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
                'priority' => ['nullable', 'string', Rule::in(self::ALLOWED_PRIORITIES)],
                'implementation_context' => ['nullable', 'string', 'max:2000'],
                'location' => ['nullable', 'string', 'max:255'],
                'barangay' => ['nullable', 'string', 'max:120'],
                'appropriation_amount' => ['nullable', 'numeric', 'min:0'],
                'ps_amount' => ['nullable', 'numeric', 'min:0'],
                'mooe_amount' => ['nullable', 'numeric', 'min:0'],
                'co_amount' => ['nullable', 'numeric', 'min:0'],
                'climate_adaptation_amount' => ['nullable', 'numeric', 'min:0'],
                'climate_mitigation_amount' => ['nullable', 'numeric', 'min:0'],
                'gad_attributed' => ['nullable', 'boolean'],
                'drrm_tagged' => ['nullable', 'boolean'],
                'aip_reference_code' => ['nullable', 'string', 'max:120'],
                'target_quarter' => ['nullable', 'string', 'max:32'],
                'map_code' => ['nullable', 'string', 'max:100'],
            ]);

            $perms = $this->authorization->authorizePpaMutation($user, existing: $ppa, targetStatus: $data['status']);
            $office = $perms['canManagePpas'] && isset($data['responsible_office'])
                ? $this->authorization->officeIdentity($data['responsible_office'], 'responsible_office')
                : null;
            if ($office !== null && (int) $office->id !== (int) $ppa->implementing_department_id) {
                throw ValidationException::withMessages(['responsible_office' => 'Office reassignment requires a separately authorized reconciliation; the recorded office identity is preserved.']);
            }

            $ps = (float) ($data['ps_amount'] ?? $ppa->ps_amount);
            $mooe = (float) ($data['mooe_amount'] ?? $ppa->mooe_amount);
            $co = (float) ($data['co_amount'] ?? $ppa->co_amount);
            $appropriation = isset($data['appropriation_amount']) && (float) $data['appropriation_amount'] > 0
                ? (float) $data['appropriation_amount']
                : ($ps + $mooe + $co);

            $ppa->update([
                'title' => trim($data['title']),
                'sector' => trim($data['sector']),
                'responsible_office' => $office?->name ?? $ppa->responsible_office,
                'implementing_department_id' => $office?->id ?? $ppa->implementing_department_id,
                'year' => (int) $data['year'],
                'related_development_plan' => trim($data['related_development_plan']),
                'funding_source' => trim($data['funding_source']),
                'status' => $data['status'],
                'priority' => $data['priority'] ?? $ppa->priority,
                'implementation_context' => $data['implementation_context'] ?? $ppa->implementation_context,
                'location' => $data['location'] ?? $ppa->location,
                'barangay' => $data['barangay'] ?? $ppa->barangay,
                'appropriation_amount' => $appropriation,
                'ps_amount' => $ps,
                'mooe_amount' => $mooe,
                'co_amount' => $co,
                'climate_adaptation_amount' => (float) ($data['climate_adaptation_amount'] ?? $ppa->climate_adaptation_amount),
                'climate_mitigation_amount' => (float) ($data['climate_mitigation_amount'] ?? $ppa->climate_mitigation_amount),
                'gad_attributed' => (bool) ($data['gad_attributed'] ?? $ppa->gad_attributed),
                'drrm_tagged' => (bool) ($data['drrm_tagged'] ?? $ppa->drrm_tagged),
                'aip_reference_code' => $data['aip_reference_code'] ?? $ppa->aip_reference_code,
                'target_quarter' => $data['target_quarter'] ?? $ppa->target_quarter,
                'map_code' => $data['map_code'] ?? $ppa->map_code,
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.ppa.updated',
                summary: "Updated PPA record {$ppa->ppa_code}.",
                entityType: PpaRecord::class,
                entityId: $ppa->id,
            );

            return back()->with('status', "PPA record {$ppa->ppa_code} updated.");

        }, attempts: 3);
    }

    public function updateStatus(Request $request, PpaRecord $ppa): RedirectResponse
    {
        return DB::transaction(function () use ($request, $ppa): RedirectResponse {
            $this->authorization->resolve($request->user());
            $ppa = $ppa->newQuery()->lockForUpdate()->findOrFail($ppa->id);
            $user = $request->user();
            $data = $request->validate([
                'status' => ['required', 'string', Rule::in(self::ALLOWED_STATUSES)],
            ]);

            $this->authorization->authorizePpaMutation($user, existing: $ppa, targetStatus: $data['status']);

            $previousStatus = $ppa->status;
            $ppa->update([
                'status' => $data['status'],
                'updated_by_user_id' => $user->id,
            ]);

            $this->audit->record(
                actor: $user,
                action: 'planning.ppa.status_changed',
                summary: "Changed PPA {$ppa->ppa_code} status from {$previousStatus} to {$ppa->status}.",
                entityType: PpaRecord::class,
                entityId: $ppa->id,
            );

            return back()->with('status', "PPA {$ppa->ppa_code} status updated to {$ppa->status}.");

        }, attempts: 3);
    }

    public function destroy(Request $request, PpaRecord $ppa): RedirectResponse
    {
        return DB::transaction(function () use ($request, $ppa): RedirectResponse {
            $this->authorization->resolve($request->user());
            $ppa = $ppa->newQuery()->lockForUpdate()->findOrFail($ppa->id);
            $user = $request->user();
            $this->authorization->authorizePpaMutation($user, existing: $ppa, isDelete: true);

            if (! in_array($ppa->status, ['Draft', 'Planned'], true) || $ppa->provenance_status === 'reference_sample') {
                throw ValidationException::withMessages([
                    'ppa' => 'Only non-reference draft/planned PPA proposals can be deleted.',
                ]);
            }

            $code = $ppa->ppa_code;
            $id = $ppa->id;
            $ppa->delete();

            $this->audit->record(
                actor: $user,
                action: 'planning.ppa.deleted',
                summary: "Deleted draft PPA {$code}.",
                entityType: PpaRecord::class,
                entityId: $id,
            );

            return back()->with('status', "Draft PPA {$code} deleted.");

        }, attempts: 3);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $user = $request->user();

        $query = PpaRecord::query()->orderBy('year')->orderBy('ppa_code');

        if ($request->filled('sector')) {
            $query->where('sector', (string) $request->query('sector'));
        }
        if ($request->filled('office')) {
            $query->where('responsible_office', (string) $request->query('office'));
        }
        if ($request->filled('year')) {
            $query->where('year', (int) $request->query('year'));
        }
        if ($request->filled('status')) {
            $query->where('status', (string) $request->query('status'));
        }

        $rows = $query->get();

        $this->audit->record(
            actor: $user,
            action: 'planning.ppa.exported_csv',
            summary: sprintf('Exported %d PPA records to AIP CSV.', $rows->count()),
        );

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="talibon-ppa-aip-register.csv"',
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->stream(function () use ($rows): void {
            $out = fopen('php://output', 'w');
            if ($out === false) {
                return;
            }

            fputcsv($out, [
                'PPA Code',
                'AIP Reference Code',
                'Program / Project / Activity Title',
                'Sector',
                'Implementing Office',
                'Fiscal Year',
                'Source Development Plan',
                'Funding Source',
                'Status',
                'PS (PHP)',
                'MOOE (PHP)',
                'CO (PHP)',
                'Total Appropriation (PHP)',
                'CCET Adaptation (PHP)',
                'CCET Mitigation (PHP)',
                'GAD Attributed',
                'DRRM Tagged',
                'Target Quarter',
                'Provenance',
            ]);

            foreach ($rows as $row) {
                fputcsv($out, [
                    self::sanitizeCsvCell($row->ppa_code),
                    self::sanitizeCsvCell($row->aip_reference_code ?? ''),
                    self::sanitizeCsvCell($row->title),
                    self::sanitizeCsvCell($row->sector),
                    self::sanitizeCsvCell($row->responsible_office),
                    (string) $row->year,
                    self::sanitizeCsvCell($row->related_development_plan),
                    self::sanitizeCsvCell($row->funding_source),
                    self::sanitizeCsvCell($row->status),
                    number_format((float) $row->ps_amount, 2, '.', ''),
                    number_format((float) $row->mooe_amount, 2, '.', ''),
                    number_format((float) $row->co_amount, 2, '.', ''),
                    number_format((float) $row->appropriation_amount, 2, '.', ''),
                    number_format((float) $row->climate_adaptation_amount, 2, '.', ''),
                    number_format((float) $row->climate_mitigation_amount, 2, '.', ''),
                    $row->gad_attributed ? 'YES' : 'NO',
                    $row->drrm_tagged ? 'YES' : 'NO',
                    self::sanitizeCsvCell($row->target_quarter ?? ''),
                    self::sanitizeCsvCell($row->provenance_status),
                ]);
            }

            fclose($out);
        }, 200, $headers);
    }

    public static function sanitizeCsvCell(string $value): string
    {
        if ($value === '') {
            return '';
        }

        if (preg_match('/^[=+\-@\t\r]/', $value) === 1) {
            return "'".$value;
        }

        return $value;
    }
}
