<?php

namespace App\Services;

use App\Data\Correspondence\CustodyOperation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Municipal W03/W04/W05/W06 authority remains absent.
 * No role/title/office status can bypass this gate.
 * Removing the denial requires a separately accepted implementation decision.
 */
final class CustodyCapabilityGate
{
    public function assertAuthorized(User $actor, CustodyOperation $operation): never
    {
        throw new AuthorizationException('Correspondence custody operation is not authorized.');
    }

    public function assertMayReceiveStaff(User $actor): never
    {
        throw new AuthorizationException('Municipal staff intake is not authorized.');
    }

    public function assertMayRetrieve(User $actor): never
    {
        throw new AuthorizationException('Records custody retrieval is not authorized.');
    }
}
