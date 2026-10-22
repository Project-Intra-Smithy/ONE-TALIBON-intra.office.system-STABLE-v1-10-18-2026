<?php

namespace Tests\Feature;

use App\Data\Correspondence\CustodyCommand;
use App\Data\Correspondence\CustodyEvidenceRef;
use App\Data\Correspondence\CustodyOperation;
use App\Data\Correspondence\StaffReceiptData;
use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Models\User;
use App\Services\CorrespondenceCustodyService;
use App\Services\ManualCorrespondenceIntakeService;
use Illuminate\Auth\Access\AuthorizationException;
use Tests\TestCase;

/**
 * Non-DB safety suite. Municipal authority is unapproved and all entry points
 * MUST fail before opening a DB transaction or emitting outbox notifications.
 */
final class CorrespondenceCustodyLifecycleTest extends TestCase
{
    private const UUID_RECORD = '10000000-0000-4000-8000-000000000001';
    private const UUID_KEY = '20000000-0000-4000-8000-000000000002';
    private const UUID_CORRELATION = '30000000-0000-4000-8000-000000000003';

    public function test_every_operational_custody_entrypoint_remains_denied(): void
    {
        $service = app(CorrespondenceCustodyService::class);
        $actor = new User();
        foreach ([
            CustodyOperation::ActionOutcome => 'recordActionOutcome',
            CustodyOperation::ResponseRegistered => 'registerResponse',
            CustodyOperation::IssuanceAttested => 'attestIssuance',
            CustodyOperation::Dispatched => 'recordDispatch',
            CustodyOperation::DeliveryRecorded => 'recordDelivery',
            CustodyOperation::CustodyAccepted => 'acceptCustody',
            CustodyOperation::Archived => 'archive',
        ] as $operation => $method) {
            try {
                $service->{$method}($actor, $this->command($operation));
                $this->fail($method.' unexpectedly enabled official custody.');
            } catch (AuthorizationException $exception) {
                $this->assertSame('Correspondence custody operation is not authorized.', $exception->getMessage());
            }
        }
    }

    public function test_manual_staff_receipt_remains_denied_despite_complete_synthetic_proof(): void
    {
        $receipt = new StaffReceiptData(
            clientRequestKey: self::UUID_KEY,
            source: 'staff',
            channel: 'physical',
            senderName: 'Synthetic sender',
            subject: 'Synthetic subject',
            receivingOfficeId: 1,
            receivedOn: '2026-10-22T23:00:00+08:00',
            receiptEvidence: [$this->proof()],
        );

        $this->expectException(AuthorizationException::class);
        app(ManualCorrespondenceIntakeService::class)
            ->receive(new User(), $receipt, self::UUID_CORRELATION);
    }

    public function test_no_mismatched_operation_can_be_executed(): void
    {
        $this->expectException(\Illuminate\Validation\ValidationException::class);
        app(CorrespondenceCustodyService::class)
            ->archive(new User(), $this->command(CustodyOperation::Dispatched));
    }

    private function proof(): CustodyEvidenceRef
    {
        return new CustodyEvidenceRef(1, 1, str_repeat('a', 64), CorrespondenceClassification::Restricted);
    }

    private function command(CustodyOperation $operation): CustodyCommand
    {
        return new CustodyCommand(
            operation: $operation,
            correspondencePublicId: self::UUID_RECORD,
            operationKey: self::UUID_KEY,
            correlationId: self::UUID_CORRELATION,
            expectedState: CorrespondenceLifecycleState::InAction,
            expectedEventId: 12,
            evidence: [$this->proof()],
        );
    }
}
