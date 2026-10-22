<?php

namespace App\Services;

use App\Data\Correspondence\CustodyRetrievalRequest;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Unmounted Records retrieval. Every authorized read MUST be freshly scoped
 * and produce a transactionally attributed audit event; no public bypass.
 * Municipal records retrieval/custody permission is currently unapproved.
 */
final class CorrespondenceCustodyRetrievalService
{
    public function __construct(
        private readonly CustodyCapabilityGate $gate,
        private readonly CorrespondenceAccessDecider $access,
        private readonly CorrespondenceEventRecorder $events,
    ) {
    }

    public function retrieve(User $claimedActor, CustodyRetrievalRequest $request): CorrespondenceRecord
    {
        $this->gate->assertMayRetrieve($claimedActor);

        return DB::transaction(function () use ($claimedActor, $request): CorrespondenceRecord {
            $session = Auth::user();
            if (! $session instanceof User || $claimedActor->getKey() === null ||
                (int) $session->getAuthIdentifier() !== (int) $claimedActor->getKey()) {
                throw new AuthorizationException('Records retrieval access denied.');
            }
            $actor = User::query()->with('employee.department')
                ->whereKey($claimedActor->getKey())->where('is_active', true)->first();
            if (! $actor || ! $actor->employee || $actor->employee->employment_status !== 'active' ||
                ! $actor->employee->department || ! $actor->employee->department->is_active) {
                throw new AuthorizationException('Records retrieval access denied.');
            }

            $record = CorrespondenceRecord::query()
                ->where('public_id', $request->correspondencePublicId)
                ->lockForUpdate()->firstOrFail();
            if (! $this->access->canView($actor, $record)) {
                throw new AuthorizationException('Records retrieval access denied.');
            }

            // An access request ID is consumed once. No silent duplicated reads.
            $seen = \App\Models\CorrespondenceEvent::query()
                ->where('correspondence_record_id', $record->id)
                ->where('event', 'custody.retrieved')
                ->where('correlation_id', $request->accessRequestKey)->exists();
            if ($seen) {
                throw new \Symfony\Component\HttpKernel\Exception\ConflictHttpException('Retrieval request was already recorded.');
            }
            $this->events->record(
                $record,
                'custody.retrieved',
                $record->lifecycle_state,
                $record->lifecycle_state,
                actor: $actor,
                officeDepartmentId: (int) $actor->employee->department_id,
                metadata: ['purpose_reference' => $request->purposeReference],
                correlationId: $request->accessRequestKey,
            );

            return $record->fresh();
        });
    }
}
