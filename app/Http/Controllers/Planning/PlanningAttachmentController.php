<?php

declare(strict_types=1);

namespace App\Http\Controllers\Planning;

use App\Http\Controllers\Controller;
use App\Models\PlanningAttachment;
use App\Services\AuditLogger;
use App\Services\Planning\PlanningAuthorizationService;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\StreamedResponse;

final class PlanningAttachmentController extends Controller
{
    public const ALLOWED_PARENT_TYPES = ['plan', 'ppa', 'map'];

    public const ALLOWED_CATEGORIES = [
        'ordinance_resolution',
        'technical_narrative',
        'aip_schedule',
        'site_photo',
        'cartographic_plate',
        'working_draft',
    ];

    public const ALLOWED_VISIBILITIES = [
        'public_portal',
        'lgu_internal',
        'office_restricted',
        'mpdc_executive',
    ];

    public function __construct(
        private readonly PlanningAuthorizationService $authorization,
        private readonly AuditLogger $audit,
    ) {}

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'parent_type' => ['required', 'string', Rule::in(self::ALLOWED_PARENT_TYPES)],
            'parent_code' => ['required', 'string', 'max:100'],
            'title' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', Rule::in(self::ALLOWED_CATEGORIES)],
            'visibility' => ['required', 'string', Rule::in(self::ALLOWED_VISIBILITIES)],
            'file' => [
                'required',
                'file',
                'max:10240',
                'mimetypes:application/pdf,image/png,image/jpeg,text/csv,text/plain',
            ],
        ]);

        $perms = $this->authorization->authorizeAttachmentUpload(
            $user,
            $data['parent_type'],
            $data['parent_code'],
            $data['visibility'],
        );

        $uploadedFile = $request->file('file');
        $rawBytes = file_get_contents($uploadedFile->getRealPath());
        $checksum = hash('sha256', (string) $rawBytes);
        $publicId = (string) Str::uuid();
        $safeOriginal = preg_replace('/[^A-Za-z0-9._-]/', '_', $uploadedFile->getClientOriginalName()) ?: 'attachment.pdf';
        $storagePath = sprintf('planning/%s/%s/%s-%s', $data['parent_type'], Str::slug($data['parent_code']), $publicId, $safeOriginal);

        Storage::disk('documents')->put($storagePath, (string) $rawBytes);

        $attachment = PlanningAttachment::query()->create([
            'public_id' => $publicId,
            'parent_type' => $data['parent_type'],
            'parent_code' => trim($data['parent_code']),
            'title' => trim($data['title']),
            'file_name' => $safeOriginal,
            'mime_type' => (string) ($uploadedFile->getMimeType() ?: 'application/pdf'),
            'size_bytes' => strlen((string) $rawBytes),
            'checksum_sha256' => $checksum,
            'storage_disk' => 'documents',
            'storage_path' => $storagePath,
            'category' => $data['category'],
            'visibility' => $data['visibility'],
            'owner_department_id' => $perms['actorDepartmentId'],
            'uploaded_by_user_id' => $user->id,
        ]);

        $this->audit->record(
            actor: $user,
            action: 'planning.attachment.uploaded',
            summary: "Uploaded planning attachment {$attachment->title} ({$attachment->file_name}) for {$attachment->parent_type}:{$attachment->parent_code}.",
            entityType: PlanningAttachment::class,
            entityId: $attachment->id,
        );

        return back()->with('status', "Supporting document {$attachment->title} uploaded.");
    }

    public function preview(Request $request, PlanningAttachment $attachment): StreamedResponse
    {
        return $this->streamAttachment($request, $attachment, inline: true);
    }

    public function download(Request $request, PlanningAttachment $attachment): StreamedResponse
    {
        return $this->streamAttachment($request, $attachment, inline: false);
    }

    public function destroy(Request $request, PlanningAttachment $attachment): RedirectResponse
    {
        $user = $request->user();
        $perms = $this->authorization->resolve($user);

        $canArchive = $perms['isMpdcHead']
            || ($perms['isDesignatedStaff'] && (int) $attachment->uploaded_by_user_id === (int) $user->id)
            || ($perms['canProposeOfficePpa'] && (int) $attachment->uploaded_by_user_id === (int) $user->id);

        if (! $canArchive) {
            throw new AuthorizationException('You are not authorized to remove this planning attachment.');
        }

        $attachment->update([
            'archived_at' => now(),
        ]);

        $this->audit->record(
            actor: $user,
            action: 'planning.attachment.archived',
            summary: "Archived planning attachment {$attachment->title} ({$attachment->public_id}).",
            entityType: PlanningAttachment::class,
            entityId: $attachment->id,
        );

        return back()->with('status', 'Supporting document removed.');
    }

    private function streamAttachment(Request $request, PlanningAttachment $attachment, bool $inline): StreamedResponse
    {
        $user = $request->user();

        if (! $this->authorization->canViewAttachment($user, $attachment)) {
            $this->audit->record(
                actor: $user,
                action: $inline ? 'planning.attachment.preview_denied' : 'planning.attachment.download_denied',
                summary: "Denied access to planning attachment {$attachment->public_id} ({$attachment->visibility}).",
                outcome: 'denied',
                entityType: PlanningAttachment::class,
                entityId: $attachment->id,
            );

            abort(403, 'You are not authorized to access this planning attachment.');
        }

        $disk = Storage::disk($attachment->storage_disk);
        if (! $disk->exists($attachment->storage_path)) {
            abort(404, 'Planning attachment bytes are unavailable.');
        }

        $bytes = (string) $disk->get($attachment->storage_path);
        if (hash('sha256', $bytes) !== $attachment->checksum_sha256) {
            abort(404, 'Planning attachment integrity check failed.');
        }

        $this->audit->record(
            actor: $user,
            action: $inline ? 'planning.attachment.previewed' : 'planning.attachment.downloaded',
            summary: sprintf(
                '%s planning attachment %s (%s).',
                $inline ? 'Previewed' : 'Downloaded',
                $attachment->title,
                $attachment->file_name,
            ),
            entityType: PlanningAttachment::class,
            entityId: $attachment->id,
        );

        $disposition = sprintf(
            '%s; filename="%s"',
            $inline ? 'inline' : 'attachment',
            addslashes($attachment->file_name),
        );

        return response()->stream(function () use ($bytes): void {
            echo $bytes;
        }, 200, [
            'Content-Type' => $attachment->mime_type,
            'Content-Length' => (string) strlen($bytes),
            'Content-Disposition' => $disposition,
            'Cache-Control' => 'private, no-store, max-age=0',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
