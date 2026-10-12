<?php

namespace App\Domain\Workflow\Authorization;

use App\Domain\Authorization\AuthorizationContext;
use App\Models\User;
use App\Models\WorkflowTransaction;

final readonly class TransactionAuthorizationContextFactory
{
    public function __construct(
        private TransactionCapabilities $capabilities,
        private TransactionActorEligibility $eligibility,
    )
    {
    }

    public function make(
        User $user,
        string $requestedAction,
        ?WorkflowTransaction $transaction = null,
    ): AuthorizationContext {
        $actor = $this->eligibility->resolve($user);
        $transaction?->loadMissing('currentDepartment');

        $role = $actor['role'] ?? null;
        $roles = $role ? [$role] : [];

        return new AuthorizationContext(
            actorUserId: (int) $user->id,
            actorEmployeeId: $actor['employee_id'] ?? null,
            actorActive: $actor !== null,
            actorRoles: $roles,
            capabilities: $this->capabilities->resolve($roles),
            actorOfficeId: $actor['office_id'] ?? null,
            actorOfficeCode: $actor['office_code'] ?? null,
            delegatedOfficeIds: [],
            resourceOfficeId: $transaction?->current_department_id,
            resourceOfficeCode: $transaction?->currentDepartment?->code,
            resourceOriginOfficeId: $transaction?->origin_department_id,
            resourceAssignedEmployeeId: $transaction?->assigned_employee_id,
            classification: $this->classification($transaction),
            workflowState: $transaction?->status,
            requestedAction: $requestedAction,
        );
    }

    private function classification(?WorkflowTransaction $transaction): ?string
    {
        if (! $transaction) {
            return null;
        }

        $classification = $transaction->getAttribute('classification');

        return is_string($classification) && $classification !== ''
            ? $classification
            : null;
    }
}
