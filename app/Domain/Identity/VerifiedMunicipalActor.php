<?php

namespace App\Domain\Identity;

use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\Request;
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
    private function __construct(
        private User $actor,
        private Request $requestContext,
        private bool $sessionBound = true,
    ) {}

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

        return new self($actor, request());
    }

    /**
     * Fresh authorization for a protected P3 source operation. Direct trusted
     * service callers retain the existing actor argument contract; an active
     * HTTP session must match that actor. Neither case accepts stale relations.
     */
    public static function forProtectedSource(User $claimed): self
    {
        if ($claimed->getKey() === null
            || (Auth::id() !== null && (int) Auth::id() !== (int) $claimed->getKey())) {
            throw new AuthorizationException('Document source actor does not match the session.');
        }

        $actor = User::query()->with('employee.department')->find($claimed->getKey());
        if ($actor === null || ! $actor->is_active || $actor->role !== $claimed->role
            || $actor->employee === null || $actor->employee->employment_status !== 'active'
            || $actor->employee->department === null || ! $actor->employee->department->is_active) {
            throw new AuthorizationException('Document source municipal access is revoked.');
        }

        return new self($actor, request(), Auth::id() !== null);
    }

    public function user(): User
    {
        // This verified proof is valid only for the originating request and
        // authenticated principal. Replaying it from another request/session
        // must not bypass the ordinary fresh authorization entrypoints.
        if (request() !== $this->requestContext
            || ($this->sessionBound
                ? (int) Auth::id() !== (int) $this->actor->getKey()
                : Auth::id() !== null)) {
            throw new AuthorizationException('Common Search verified identity cannot be replayed.');
        }

        return $this->actor;
    }
}
