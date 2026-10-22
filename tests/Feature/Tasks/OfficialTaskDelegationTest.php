<?php

namespace Tests\Feature\Tasks;

use App\Domain\OfficialTasks\OfficialTaskIssuancePolicy;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;
use Tests\TestCase;

/**
 * Database-free negative regression. No municipal issuer authority exists yet.
 */
final class OfficialTaskDelegationTest extends TestCase
{
    public function test_official_issuance_remains_denied_for_any_claimed_issuer(): void
    {
        $policy = new OfficialTaskIssuancePolicy();

        $this->expectException(AuthorizationException::class);

        $policy->assertMayIssue(new User(), new WorkflowTransaction(), new User());
    }

    public function test_official_issuance_remains_denied_even_for_self_assignment(): void
    {
        $policy = new OfficialTaskIssuancePolicy();
        $actor = new User();

        $this->expectException(AuthorizationException::class);

        $policy->assertMayIssue($actor, new WorkflowTransaction(), $actor);
    }
}
