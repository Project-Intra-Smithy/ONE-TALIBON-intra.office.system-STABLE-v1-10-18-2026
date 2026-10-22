<?php

namespace App\Domain\OfficialTasks;

use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Official delegation remains disabled until a validated municipal issuer,
 * assignee and parent-record authority contract is approved.
 *
 * This policy intentionally has no permissive role-based fallback and is not
 * wired to any route, UI, job or TaskCoreService operation.
 */
final class OfficialTaskIssuancePolicy
{
    public function assertMayIssue(
        User $claimedIssuer,
        WorkflowTransaction $parent,
        User $assignee,
    ): void {
        throw new AuthorizationException('Official Task issuance is not authorized.');
    }
}
