<?php

namespace Tests\Unit;

use App\Data\Correspondence\CustodyCommand;
use App\Data\Correspondence\CustodyEvidenceRef;
use App\Data\Correspondence\CustodyOperation;
use App\Data\Correspondence\CustodySnapshot;
use App\Domain\Correspondence\CorrespondenceClassification as Level;
use App\Domain\Correspondence\CorrespondenceLifecycleState as State;
use App\Services\CustodyPreflight;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Tests\TestCase;

/** Pure technical checks. Passing them does NOT authorize an operation. */
final class CorrespondenceCustodyPreflightTest extends TestCase
{
    private const RECORD = '10000000-0000-4000-8000-000000000001';
    private const KEY = '20000000-0000-4000-8000-000000000002';
    private const CORRELATION = '30000000-0000-4000-8000-000000000003';

    public function test_client_forced_issuer_attribute_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ActionOutcome, [
                'workflow_transaction_id' => 4, 'action_code' => 'x',
                'result_reference' => 'doc', 'issuer_user_id' => 999,
            ]),
            $this->snapshot(),
        );
    }

    public function test_same_idempotency_key_changed_document_digest_is_detectable(): void
    {
        $first = $this->command(CustodyOperation::ActionOutcome, [
            'workflow_transaction_id' => 4, 'action_code' => 'x', 'result_reference' => 'doc',
        ]);
        $changed = $this->command(CustodyOperation::ActionOutcome, [
            'workflow_transaction_id' => 4, 'action_code' => 'x', 'result_reference' => 'doc',
        ], evidence: [new CustodyEvidenceRef(1, 1, str_repeat('b', 64), Level::Restricted)]);
        $this->assertNotSame($first->digest(), $changed->digest());
    }

    public function test_response_reference_must_identify_the_submitted_document_proof(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ResponseRegistered, [
                'response_document_id' => 99, 'response_version' => 1,
                'response_sha256' => str_repeat('a', 64),
            ]),
            $this->snapshot(),
        );
    }

    public function test_response_hash_or_version_cannot_be_swapped(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ResponseRegistered, [
                'response_document_id' => 1, 'response_version' => 2,
                'response_sha256' => str_repeat('a', 64),
            ]),
            $this->snapshot(),
        );
    }

    public function test_released_correspondence_cannot_enter_custody_without_delivery_outcome(): void
    {
        $this->expectException(ConflictHttpException::class);
        $cmd = new CustodyCommand(
            CustodyOperation::CustodyAccepted, self::RECORD, self::KEY, self::CORRELATION,
            State::Released, 12,
            [new CustodyEvidenceRef(1, 1, str_repeat('a', 64), Level::Restricted)],
            [
                'disposition_reference' => 'case-1',
                'custody_receipt_reference' => 'receipt-1',
                'custody_receipt_document_id' => 1,
                'custody_location_reference' => 'vault',
                'retention_authority_reference' => 'pending',
            ],
        );
        (new CustodyPreflight())->assertValid(
            $cmd,
            $this->snapshot(state: State::Released, milestones: ['action_outcome']),
        );
    }

    public function test_response_content_cannot_be_its_own_dispatch_receipt(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::Dispatched, [
                'response_document_id' => 1,
                'dispatch_evidence_document_id' => 1,
                'dispatch_reference' => 'synthetic-out',
                'destination_reference' => 'synthetic-target',
                'channel' => 'physical',
            ]),
            $this->snapshot(milestones: ['response_registered', 'issuance_attested']),
        );
    }

    public function test_dispatch_requires_separately_identified_proof_document(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::Dispatched, [
                'response_document_id' => 1,
                'dispatch_evidence_document_id' => 55,
                'dispatch_reference' => 'synthetic-out',
                'destination_reference' => 'synthetic-target',
                'channel' => 'physical',
            ]),
            $this->snapshot(milestones: ['response_registered', 'issuance_attested']),
        );
    }

    public function test_stale_revision_is_rejected(): void
    {
        $this->expectException(ConflictHttpException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ActionOutcome, ['workflow_transaction_id' => 4, 'action_code' => 'x', 'result_reference' => 'doc'], revision: 11),
            $this->snapshot(),
        );
    }

    public function test_wrong_lifecycle_is_rejected(): void
    {
        $this->expectException(ConflictHttpException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ActionOutcome, ['workflow_transaction_id' => 4, 'action_code' => 'x', 'result_reference' => 'doc']),
            $this->snapshot(State::Registered),
        );
    }

    public function test_duplicate_dispatch_is_rejected_even_with_a_new_operation_key(): void
    {
        $this->expectException(ConflictHttpException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::Dispatched, [
                'response_document_id' => 1, 'dispatch_reference' => 'SYN-1',
                'destination_reference' => 'synthetic', 'channel' => 'paper',
            ]),
            $this->snapshot(milestones: ['response_registered', 'issuance_attested', 'dispatched']),
        );
    }

    public function test_missing_dispatch_evidence_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::Dispatched, [
                'response_document_id' => 1, 'dispatch_reference' => 'SYN-1',
                'destination_reference' => 'synthetic', 'channel' => 'paper',
            ], evidence: []),
            $this->snapshot(milestones: ['response_registered', 'issuance_attested']),
        );
    }

    public function test_missing_required_custody_receipt_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::CustodyAccepted, [
                'disposition_reference' => 'case-1',
                'custody_location_reference' => 'vault',
                'retention_authority_reference' => 'TBD',
            ]),
            $this->snapshot(milestones: ['action_outcome']),
        );
    }

    public function test_classification_downgrade_is_rejected(): void
    {
        $this->expectException(ValidationException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::ActionOutcome, [
                'workflow_transaction_id' => 4, 'action_code' => 'x', 'result_reference' => 'doc',
            ], evidence: [new CustodyEvidenceRef(1, 1, str_repeat('a', 64), Level::Public)]),
            $this->snapshot(classification: Level::Restricted),
        );
    }

    public function test_archive_without_custody_acceptance_is_rejected(): void
    {
        $this->expectException(ConflictHttpException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::Archived, [
                'custody_event_id' => 11, 'archive_evidence_document_id' => 1, 'archive_location_reference' => 'protected-vault',
                'retention_authority_reference' => 'not-approved',
            ]),
            $this->snapshot(),
        );
    }

    public function test_signed_issuance_without_response_is_rejected(): void
    {
        $this->expectException(ConflictHttpException::class);
        (new CustodyPreflight())->assertValid(
            $this->command(CustodyOperation::IssuanceAttested, [
                'response_document_id' => 5, 'signature_evidence_document_id' => 1, 'authority_reference' => 'not-approved',
                'signed_on' => '2026-10-22',
            ]),
            $this->snapshot(),
        );
    }

    public function test_canonical_payload_digest_is_independent_of_attribute_order(): void
    {
        $a = $this->command(CustodyOperation::ActionOutcome, [
            'action_code' => 'x', 'workflow_transaction_id' => 4, 'result_reference' => 'doc',
        ]);
        $b = $this->command(CustodyOperation::ActionOutcome, [
            'result_reference' => 'doc', 'action_code' => 'x', 'workflow_transaction_id' => 4,
        ]);
        $this->assertSame($a->digest(), $b->digest());
    }

    public function test_technically_valid_outcome_does_not_grant_municipal_authority(): void
    {
        $command = $this->command(CustodyOperation::ActionOutcome, [
            'workflow_transaction_id' => 4, 'action_code' => 'synthetic',
            'result_reference' => 'document-ref',
        ]);
        (new CustodyPreflight())->assertValid($command, $this->snapshot());
        $this->assertTrue(true);
    }

    /** @param array<string,string|int> $attributes
     *  @param list<CustodyEvidenceRef>|null $evidence
     */
    private function command(
        CustodyOperation $op,
        array $attributes = [],
        ?array $evidence = null,
        int $revision = 12,
    ): CustodyCommand {
        return new CustodyCommand(
            $op, self::RECORD, self::KEY, self::CORRELATION,
            State::InAction, $revision,
            $evidence ?? [new CustodyEvidenceRef(1, 1, str_repeat('a', 64), Level::Restricted)],
            $attributes,
        );
    }

    /** @param list<string> $milestones */
    private function snapshot(
        State $state = State::InAction,
        Level $classification = Level::Restricted,
        array $milestones = [],
    ): CustodySnapshot {
        return new CustodySnapshot($state, 12, $classification, $milestones);
    }
}
