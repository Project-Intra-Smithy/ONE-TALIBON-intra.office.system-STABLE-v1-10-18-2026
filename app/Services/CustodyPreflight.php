<?php

namespace App\Services;

use App\Data\Correspondence\CustodyCommand;
use App\Data\Correspondence\CustodyOperation;
use App\Data\Correspondence\CustodySnapshot;
use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;

/**
 * Pure technical invariants; passing this check NEVER grants municipal authority.
 * Only the writer service may reconstruct CustodySnapshot from locked database rows.
 */
final class CustodyPreflight
{
    private const REQUIRED = [
        'action_outcome' => ['workflow_transaction_id', 'action_code', 'result_reference'],
        'response_registered' => ['response_document_id', 'response_version', 'response_sha256'],
        'issuance_attested' => ['response_document_id', 'authority_reference', 'signed_on'],
        'dispatched' => ['response_document_id', 'dispatch_reference', 'destination_reference', 'channel'],
        'delivery_recorded' => ['dispatch_event_id', 'delivery_status', 'delivery_reference'],
        'custody_accepted' => ['disposition_reference', 'custody_receipt_reference', 'custody_location_reference', 'retention_authority_reference'],
        'archived' => ['custody_event_id', 'archive_location_reference', 'retention_authority_reference'],
    ];

    public function assertValid(CustodyCommand $command, CustodySnapshot $current): void
    {
        if ($current->state !== $command->expectedState || $current->lastEventId !== $command->expectedEventId) {
            throw new ConflictHttpException('Correspondence revision or state is stale.');
        }
        if ($current->classification === null) {
            throw ValidationException::withMessages(['classification' => 'Classification is required before custody actions.']);
        }
        $requiredState = $command->operation === CustodyOperation::DeliveryRecorded ||
            $command->operation === CustodyOperation::CustodyAccepted
            ? [CorrespondenceLifecycleState::InAction, CorrespondenceLifecycleState::Released]
            : ($command->operation === CustodyOperation::Archived
                ? [CorrespondenceLifecycleState::Released, CorrespondenceLifecycleState::InAction]
                : [CorrespondenceLifecycleState::InAction]);
        if (! in_array($current->state, $requiredState, true) || $current->state === CorrespondenceLifecycleState::Archived) {
            throw new ConflictHttpException('Custody milestone is unavailable in the current lifecycle.');
        }
        if ($current->has($command->operation) && $command->operation !== CustodyOperation::DeliveryRecorded) {
            throw new ConflictHttpException('Custody milestone already recorded.');
        }

        foreach (self::REQUIRED[$command->operation->value] as $field) {
            if (! isset($command->attributes[$field]) ||
                trim((string) $command->attributes[$field]) === '') {
                throw ValidationException::withMessages(['evidence' => 'Required provenance is missing.']);
            }
        }
        if ($command->evidence === []) {
            throw ValidationException::withMessages(['evidence' => 'Immutable document proof is required.']);
        }
        foreach ($command->evidence as $proof) {
            if (self::rank($proof->classification) < self::rank($current->classification)) {
                throw ValidationException::withMessages(['classification' => 'Document proof cannot downgrade source classification.']);
            }
        }
        if ($command->operation === CustodyOperation::IssuanceAttested && ! $current->has(CustodyOperation::ResponseRegistered) ||
            $command->operation === CustodyOperation::Dispatched && ! $current->has(CustodyOperation::IssuanceAttested) ||
            $command->operation === CustodyOperation::DeliveryRecorded && ! $current->has(CustodyOperation::Dispatched) ||
            $command->operation === CustodyOperation::CustodyAccepted && ! $current->has(CustodyOperation::ActionOutcome) ||
            $command->operation === CustodyOperation::Archived && ! $current->has(CustodyOperation::CustodyAccepted)) {
            throw new ConflictHttpException('Required predecessor custody milestone is missing.');
        }
        // For a repeat dispatch, a second key must not create a second release.
        if ($command->operation === CustodyOperation::Dispatched && $current->has(CustodyOperation::Dispatched)) {
            throw new ConflictHttpException('Dispatch already recorded.');
        }
    }

    public static function rank(CorrespondenceClassification $classification): int
    {
        return match ($classification) {
            CorrespondenceClassification::Public => 0,
            CorrespondenceClassification::Internal => 1,
            CorrespondenceClassification::Confidential => 2,
            CorrespondenceClassification::Restricted => 3,
        };
    }
}
