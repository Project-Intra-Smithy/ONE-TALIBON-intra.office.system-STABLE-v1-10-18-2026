<?php

namespace App\Services;

use App\Data\Correspondence\CustodyCommand;
use App\Data\Correspondence\CustodyOperation;
use App\Data\Correspondence\CustodySnapshot;
use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * Unmounted and permanently denied under W03–W06. Seven reserved technical
 * milestone writers: they MUST NOT be exposed until municipal authority,
 * source classification parity, and synthetic integration acceptance exist.
 *
 * No Work Request mutations, notifications, remote dispatch or archive deletion.
 */
final class CorrespondenceCustodyService
{
    public function __construct(
        private readonly CustodyCapabilityGate $gate,
        private readonly CustodyPreflight $preflight,
        private readonly CorrespondenceAccessDecider $access,
        private readonly CorrespondenceEventRecorder $events,
    ) {
    }

    public function recordActionOutcome(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::ActionOutcome);
    }

    public function registerResponse(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::ResponseRegistered);
    }

    public function attestIssuance(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::IssuanceAttested);
    }

    public function recordDispatch(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::Dispatched);
    }

    public function recordDelivery(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::DeliveryRecorded);
    }

    public function acceptCustody(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::CustodyAccepted);
    }

    public function archive(User $actor, CustodyCommand $command): CorrespondenceEvent
    {
        return $this->execute($actor, $command, CustodyOperation::Archived);
    }

    /**
     * This method deliberately has NO bypass argument. Policy gate rejects
     * before reading the record or touching DB, including idempotent replays.
     * The dormant transactional implementation is for future approved wiring.
     */
    private function execute(User $actor, CustodyCommand $command, CustodyOperation $expected): CorrespondenceEvent
    {
        if ($command->operation !== $expected) {
            throw ValidationException::withMessages(['operation' => 'Custody operation does not match the requested command.']);
        }
        $this->gate->assertAuthorized($actor, $expected);

        return DB::transaction(function () use ($actor, $command): CorrespondenceEvent {
            $record = CorrespondenceRecord::query()
                ->where('public_id', $command->correspondencePublicId)
                ->lockForUpdate()
                ->firstOrFail();
            $verified = $this->verifiedActor($actor);

            // The existing canView is necessary but NOT sufficient authority.
            // CustodyCapabilityGate must remain a separate positive grant.
            if (! $this->access->canView($verified, $record)) {
                throw new AuthorizationException('Correspondence custody access denied.');
            }

            $prior = DB::table('correspondence_operation_receipts')
                ->where('correspondence_record_id', $record->id)
                ->where('operation_key', $command->operationKey)
                ->first();
            if ($prior !== null) {
                if (! hash_equals($prior->payload_digest, $command->digest())
                    || $prior->operation_type !== $command->operation->value) {
                    throw new ConflictHttpException('Custody idempotency key already belongs to a different operation.');
                }

                return CorrespondenceEvent::query()
                    ->where('correspondence_record_id', $record->id)
                    ->findOrFail($prior->correspondence_event_id);
            }

            $lastEventId = (int) (CorrespondenceEvent::query()
                ->where('correspondence_record_id', $record->id)->max('id') ?? 0);
            $milestones = CorrespondenceEvent::query()
                ->where('correspondence_record_id', $record->id)
                ->where('event', 'like', 'custody.%')
                ->pluck('event')->map(static fn (string $event): string => substr($event, 8))->all();

            $current = new CustodySnapshot(
                state: $record->lifecycle_state,
                lastEventId: $lastEventId,
                classification: $record->classification,
                milestones: $milestones,
            );
            $this->preflight->assertValid($command, $current);
            $this->assertExistingEvidence($record, $command);

            $previousState = $record->lifecycle_state;
            $nextState = match ($command->operation) {
                CustodyOperation::Dispatched => CorrespondenceLifecycleState::Released,
                CustodyOperation::Archived => CorrespondenceLifecycleState::Archived,
                default => $previousState,
            };
            if ($previousState !== $nextState) {
                $record->forceFill(['lifecycle_state' => $nextState])->save();
            }
            $officeId = (int) $verified->employee->department_id;
            $occurred = now();
            $event = $this->events->record(
                $record,
                'custody.'.$command->operation->value,
                $previousState,
                $nextState,
                actor: $verified,
                officeDepartmentId: $officeId,
                metadata: [
                    'evidence' => array_map(static fn ($proof): array => $proof->snapshot(), $command->evidence),
                    'references' => $command->attributes,
                    'revision_before' => $lastEventId,
                    'payload_digest' => $command->digest(),
                    'inherited_classification' => $record->classification->value,
                ],
                correlationId: $command->correlationId,
                occurredAt: $occurred,
            );
            DB::table('correspondence_operation_receipts')->insert([
                'correspondence_record_id' => $record->id,
                'operation_key' => $command->operationKey,
                'operation_type' => $command->operation->value,
                'payload_digest' => $command->digest(),
                'correspondence_event_id' => $event->id,
                'actor_user_id' => $verified->id,
                'created_at' => $occurred,
            ]);

            return $event;
        }, 3);
    }

    private function verifiedActor(User $claimed): User
    {
        $session = Auth::user();
        if (! $session instanceof User || $claimed->getKey() === null ||
            (int) $session->getAuthIdentifier() !== (int) $claimed->getKey()) {
            throw new AuthorizationException('Correspondence custody access denied.');
        }
        $actor = User::query()->with('employee.department')
            ->whereKey($claimed->getKey())->where('is_active', true)->first();
        if (! $actor || ! $actor->employee || $actor->employee->employment_status !== 'active' ||
            ! $actor->employee->department || ! $actor->employee->department->is_active) {
            throw new AuthorizationException('Correspondence custody access denied.');
        }

        return $actor;
    }

    private function assertExistingEvidence(CorrespondenceRecord $record, CustodyCommand $command): void
    {
        if (! $record->classification instanceof CorrespondenceClassification) {
            throw ValidationException::withMessages(['classification' => 'Record classification is missing.']);
        }
        foreach ($command->evidence as $proof) {
            $document = Document::query()->whereKey($proof->documentId)->first();
            $linked = DocumentLink::query()->where('document_id', $proof->documentId)
                ->where('linkable_type', $record->getMorphClass())
                ->where('linkable_id', $record->id)->exists();

            // The current Document model has NO first-class version column.
            // An imported/uploaded file without an independently established
            // immutable metadata.version is NOT acceptable issuance proof.
            $version = $document?->metadata['version'] ?? null;
            if (! $linked || $document === null || $version === null ||
                (int) $version !== $proof->version ||
                ! is_string($document->checksum_sha256) ||
                ! hash_equals(strtolower($document->checksum_sha256), $proof->checksumSha256) ||
                $document->classification !== $proof->classification->value ||
                CustodyPreflight::rank($proof->classification) < CustodyPreflight::rank($record->classification)) {
                throw ValidationException::withMessages(['evidence' => 'Document proof is missing, stale or insufficiently classified.']);
            }
        }
    }
}
