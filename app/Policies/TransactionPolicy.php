<?php

namespace App\Policies;

use App\Domain\Workflow\Authorization\TransactionAccessDecider;
use App\Domain\Workflow\Authorization\TransactionAuthorizationContextFactory;
use App\Services\CorrespondenceAccessDecider;
use App\Models\CorrespondenceRecord;
use App\Models\User;
use App\Models\WorkflowTransaction;

final readonly class TransactionPolicy
{
    public function __construct(
        private TransactionAuthorizationContextFactory $contexts,
        private TransactionAccessDecider $access,
        private CorrespondenceAccessDecider $correspondenceAccess,
    ) {
    }

    public function viewAny(User $user): bool
    {
        return $this->allows($user, TransactionAccessDecider::VIEW_ANY);
    }

    public function view(User $user, WorkflowTransaction $transaction): bool
    {
        return $this->allows($user, TransactionAccessDecider::VIEW, $transaction);
    }

    public function create(User $user): bool
    {
        return $this->allows($user, TransactionAccessDecider::CREATE);
    }

    public function transition(User $user, WorkflowTransaction $transaction): bool
    {
        return $this->allows($user, TransactionAccessDecider::TRANSITION, $transaction);
    }

    public function assign(User $user, WorkflowTransaction $transaction): bool
    {
        return $this->allows($user, TransactionAccessDecider::ASSIGN, $transaction);
    }

    public function mayorDecision(User $user, WorkflowTransaction $transaction): bool
    {
        return $this->allows($user, TransactionAccessDecider::MAYOR_DECISION, $transaction);
    }

    private function allows(
        User $user,
        string $action,
        ?WorkflowTransaction $transaction = null,
    ): bool {
        // Source-authority precedence: office-wide transaction authority does
        // not grant access to the underlying classified correspondence.
        // A document_review workflow without a persisted source link must
        // remain invisible during the synchronous pre-link creation window.
        if ($transaction !== null) {
            $linked = CorrespondenceRecord::query()
                ->where('workflow_transaction_id', $transaction->getKey())
                ->first();

            if ($linked !== null && ! $this->correspondenceAccess->canView($user, $linked)) {
                return false;
            }

            if ($linked === null && $transaction->transaction_type === 'document_review') {
                return false;
            }
        }

        return $this->access->allows(
            $this->contexts->make($user, $action, $transaction),
        );
    }
}
