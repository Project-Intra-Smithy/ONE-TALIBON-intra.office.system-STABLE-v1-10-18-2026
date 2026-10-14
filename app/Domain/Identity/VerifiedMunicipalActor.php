<?php

namespace App\Domain\Identity;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Facades\Auth;

/**
 * Fresh, operation-local proof of municipal employee eligibility.
 *
 * Constructible only after comparing the current session identity against the
 * claimed ID and querying live User / Employee / Department state. Do not
 * retain this object between operations or use it for mutation authorization.
 */
final readonly class VerifiedMunicipalActor
{
    private function __construct(private User $actor) {}

    public static function forCurrentSession(User $claimed): self
    {
        if ($claimed->getKey() === null || (int) Auth::id() !== (int) $claimed->getKey()) {
            throw new AuthorizationException('Common Search requires the current session actor.');
        }

        $actor = User::query()->with('employee.department')->find($claimed->getKey());

        if ($actor === null || $actor->is_active === false
            || $actor->employee === null || $actor->employee->employment_status !== 'active'
            || $actor->employee->department === null || $actor->employee->department->is_active === false) {
            throw new AuthorizationException('Common Search municipal access is revoked.');
        }

        return new self($actor);
    }

    public function user(): User
    {
        return $this->actor;
    }
}
