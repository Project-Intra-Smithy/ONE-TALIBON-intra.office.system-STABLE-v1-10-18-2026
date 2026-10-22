<?php

namespace App\Services;

use App\Data\Correspondence\StaffReceiptData;
use App\Models\CorrespondenceRecord;
use App\Models\User;

/**
 * Technical seam only. Municipal W04 intake authority is unapproved.
 * Does not reuse integration-client credentials as staff authority.
 */
final class ManualCorrespondenceIntakeService
{
    public function __construct(private readonly CustodyCapabilityGate $gate)
    {
    }

    public function receive(User $actor, StaffReceiptData $receipt, string $correlationId): CorrespondenceRecord
    {
        $this->gate->assertMayReceiveStaff($actor);
    }
}
