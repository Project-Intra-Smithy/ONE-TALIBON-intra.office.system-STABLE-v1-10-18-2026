<?php

namespace App\Services;

use App\Domain\Workflow\ClarificationContract;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Gate;

/**
 * Slot 03 INTEGRATION-ONLY interface. Not routed, not subscribed and not
 * mutation-capable. Preflight alone is NOT a concurrency or authorization
 * guarantee: Slot 02 must invoke the contract again inside its existing
 * lockForUpdate transaction after the municipal authority decision.
 */
final readonly class WorkflowClarificationService
{
    public function __construct(private ClarificationContract $contract)
    {
    }

    public function preflightRequest(
        User $actor,
        WorkflowTransaction $transaction,
        string $action,
        ?string $reason,
        int $expectedEventId,
    ): void {
        $fresh = WorkflowTransaction::query()->findOrFail($transaction->getKey());

        // Existing active-employee and office authorization remains mandatory;
        // this does not grant a new municipal requester capability.
        $gate = Gate::forUser($actor);
        $ability = $action === 'request_information' && $gate->allows('mayorDecision', $fresh)
            ? 'mayorDecision'
            : 'transition';
        $gate->authorize($ability, $fresh);

        $latest = TransactionEvent::query()
            ->where('transaction_id', $fresh->id)
            ->orderByDesc('id')
            ->first();

        $this->contract->assertRequest($fresh, $action, $reason, $expectedEventId, $latest);
    }

    /**
     * Default deny: authorized municipal respondent and reply-event storage
     * have not been approved, and no separate response route exists.
     */
    public function submitResponse(User $actor, WorkflowTransaction $transaction, array $response): never
    {
        throw new AuthorizationException(
            'Clarification responses are disabled until actor authority and request/event correlation are approved.',
        );
    }

    /**
     * Default deny: do not silently route from origin to an arbitrary receiver,
     * mark_review, or infer approval from elapsed time.
     */
    public function resumeReview(User $actor, WorkflowTransaction $transaction, int $expectedEventId): never
    {
        throw new AuthorizationException(
            'Clarification review resumption is disabled pending approved receiving-office authority.',
        );
    }
}
