<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAttachmentCustody;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;

final class PlanningCustodyController extends Controller
{
    public function index(Request $request)
    {
        $permissions = app(PlanningAuthorizationService::class)->resolve($request->user());

        return Inertia::render('PlanningCustody/Index', [
            'records' => PlanningAttachment::query()->orderBy('id')->paginate(50)->through(fn ($a) => [
                'publicId' => $a->public_id, 'title' => $a->title, 'parentType' => $a->parent_type,
                'parentCode' => $a->parent_code, 'parentRecordId' => $a->parent_record_id,
                'archived' => $a->archived_at !== null,
                'parentExists' => $this->parentExists($a),
                'canReconcile' => $a->parent_record_id === null && $permissions['canUploadAttachments']
                    && $a->owner_department_id !== null && (int) $a->owner_department_id === $permissions['actorDepartmentId'],
                'previewUrl' => $a->archived_at === null ? route('planning.attachments.preview', $a) : null,
            ]),
            'canReconcile' => $permissions['canUploadAttachments'],
            'parents' => [
                'plan' => DevelopmentPlan::query()->orderBy('code')->get(['id', 'code', 'title']),
                'ppa' => PpaRecord::query()->orderBy('ppa_code')->get(['id', 'ppa_code as code', 'title']),
                'map' => PlanningMap::query()->orderBy('map_code')->get(['id', 'map_code as code', 'title']),
            ],
        ]);
    }

    private function parentExists(PlanningAttachment $attachment): bool
    {
        if ($attachment->parent_record_id === null) {
            return false;
        }
        $model = match ($attachment->parent_type) {
            'plan' => DevelopmentPlan::class, 'ppa' => PpaRecord::class, 'map' => PlanningMap::class,
            default => null,
        };

        return $model !== null && $model::query()->whereKey($attachment->parent_record_id)->exists();
    }

    public function reconcile(Request $request, PlanningAttachment $attachment)
    {
        $data = $request->validate([
            'parent_record_id' => ['required', 'integer', 'min:1'],
            'evidence_reference' => ['required', 'string', 'min:10', 'max:4000'],
        ]);

        return DB::transaction(function () use ($request, $attachment, $data) {
            $auth = app(PlanningAuthorizationService::class);
            $permissions = $auth->resolve($request->user());
            $attachment = PlanningAttachment::query()->lockForUpdate()->findOrFail($attachment->id);
            // Destination permission cannot manufacture authority over historical custody.
            if ($attachment->owner_department_id === null
                || (int) $attachment->owner_department_id !== $permissions['actorDepartmentId']) {
                throw new AuthorizationException('Foreign or unknown historical custody requires explicitly authorized originating-office reconciliation.');
            }
            if ($attachment->parent_record_id !== null) {
                throw ValidationException::withMessages(['parent_record_id' => 'A recorded parent binding cannot be reassigned. Escalate conflicting evidence for accountable review.']);
            }
            $auth->authorizeAttachmentUpload($request->user(), $attachment->parent_type, $attachment->parent_code, $attachment->visibility, (int) $data['parent_record_id']);
            app(PlanningAttachmentCustody::class)->parent($attachment->parent_type, $attachment->parent_code, (int) $data['parent_record_id']);
            DB::table('planning_attachment_reconciliations')->insert([
                'attachment_id' => $attachment->id, 'parent_record_id' => $data['parent_record_id'],
                'actor_user_id' => $request->user()->id, 'evidence_reference' => trim($data['evidence_reference']), 'created_at' => now(),
            ]);
            // This sole explicit path records first binding, retaining the original textual reference.
            DB::table('planning_attachments')->where('id', $attachment->id)->whereNull('parent_record_id')
                ->update(['parent_record_id' => $data['parent_record_id'], 'updated_at' => now()]);
            app(AuditLogger::class)->record(actor: $request->user(), action: 'planning.attachment.reconciled',
                summary: "Recorded evidence-backed parent binding for attachment {$attachment->public_id}.",
                entityType: PlanningAttachment::class, entityId: $attachment->id);

            return back()->with('status', 'Historical parent binding recorded; original reference and evidence retained.');
        }, attempts: 3);
    }
}
