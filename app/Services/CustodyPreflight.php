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
        // Explicit reference fields only: never persist client-forged issuer,
        // signer, custodian, office or status in the event metadata.
        $permitted = self::REQUIRED[$command->operation->value];
        if (array_diff(array_keys($command->attributes), $permitted) !== []) {
            throw ValidationException::withMessages(['attributes' => 'Unknown custody metadata fields are prohibited.']);
        }

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
        // Any response document ID/version/hash named in the command must
        // identify one of the submitted immutable evidence references.
        if (in_array($command->operation, [
            CustodyOperation::ResponseRegistered,
            CustodyOperation::IssuanceAttested,
            CustodyOperation::Dispatched,
        ], true)) {
            $matched = false;
            foreach ($command->evidence as $proof) {
                if ($proof->documentId !== (int) $command->attributes['response_document_id']) {
                    continue;
                }
                if ($command->operation === CustodyOperation::ResponseRegistered &&
                    ($proof->version !== (int) $command->attributes['response_version'] ||
                        ! hash_equals($proof->checksumSha256, (string) $command->attributes['response_sha256']))) {
                    continue;
                }
                $matched = true;
            }
            if (! $matched) {
                throw ValidationException::withMessages(['evidence' => 'Response document identity/version/hash does not match its proof.']);
            }
        }
        if (in_array($command->operation, [CustodyOperation::CustodyAccepted, CustodyOperation::Archived], true) &&
            $current->state === CorrespondenceLifecycleState::Released &&
            ! $current->has(CustodyOperation::DeliveryRecorded)) {
            throw new ConflictHttpException('Released correspondence requires documented delivery outcome before custody or archive.');
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
