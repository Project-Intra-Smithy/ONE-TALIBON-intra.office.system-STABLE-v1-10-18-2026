<?php

declare(strict_types=1);

namespace App\Services\Planning;

use App\Models\DevelopmentPlan;
use App\Models\PlanningAttachment;
use App\Models\PlanningMap;
use App\Models\PpaRecord;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

final class PlanningAttachmentCustody
{
    public function parent(string $type, string $code): Model
    {
        $query = match ($type) {
            'plan' => DevelopmentPlan::query()->where(fn ($q) => $q->where('code', $code)->orWhere('plan_key', $code)),
            'ppa' => PpaRecord::query()->where('ppa_code', $code),
            'map' => PlanningMap::query()->where('map_code', $code),
            default => throw new AuthorizationException('Unsupported attachment parent.'),
        };
        $parents = $query->when(DB::transactionLevel() > 0, fn ($q) => $q->lockForUpdate())->get();
        if ($parents->count() !== 1) {
            throw new AuthorizationException('Attachment parent requires explicit identity reconciliation.');
        }

        return $parents->sole();
    }

    public function assertIdentifiersAvailable(string $type, array $identifiers, string $field): void
    {
        if (DB::transactionLevel() === 0) {
            throw new \LogicException('Parent allocation requires a transaction.');
        }
        // Serialize cross-column Plan aliases as well as historical identifier reservations.
        DB::select('SELECT pg_advisory_xact_lock(?)', [match ($type) {
            'plan' => 741001, 'ppa' => 741002, 'map' => 741003
        }]);
        // Includes archived/orphaned documents: retention reserves the identifier.
        if (PlanningAttachment::query()->where('parent_type', $type)->whereIn('parent_code', $identifiers)->exists()
            || ($type === 'plan' && DevelopmentPlan::query()->where(fn ($q) => $q->whereIn('code', $identifiers)->orWhereIn('plan_key', $identifiers))->exists())) {
            throw ValidationException::withMessages([$field => 'This identifier is retained or already assigned; explicit reconciliation is required.']);
        }
    }

    public function assertDeletable(string $type, Model $parent, array $identifiers): void
    {
        // Call only after locking the parent, the same boundary used by uploads.
        if (PlanningAttachment::query()->where('parent_type', $type)->where(fn ($q) => $q
            ->where('parent_record_id', $parent->getKey())->orWhereIn('parent_code', $identifiers))->exists()) {
            throw ValidationException::withMessages(['attachment' => 'Retained supporting documents prevent parent deletion, including archived documents.']);
        }
    }
}
