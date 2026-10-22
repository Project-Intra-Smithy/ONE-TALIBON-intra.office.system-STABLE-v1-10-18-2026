<?php

namespace App\Data\Correspondence;

/**
 * Technical milestones, NOT municipal disposition or signing permissions.
 * Existing receive/register/classify/route/in_action remain independently owned.
 */
enum CustodyOperation: string
{
    case ActionOutcome = 'action_outcome';
    case ResponseRegistered = 'response_registered';
    case IssuanceAttested = 'issuance_attested';
    case Dispatched = 'dispatched';
    case DeliveryRecorded = 'delivery_recorded';
    case CustodyAccepted = 'custody_accepted';
    case Archived = 'archived';
}
