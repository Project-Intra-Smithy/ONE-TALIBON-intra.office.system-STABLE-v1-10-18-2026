<?php

declare(strict_types=1);

namespace App\Domain\Custody;

use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Facades\Auth;

/**
 * Live, connection-bound actor and office verification for custody commands.
 *
 * Never relies on cached Eloquent models, session attributes, or default-connection
 * queries; always inspects live users, employees, and departments rows on the
 * authoritative connection inside the active custody transaction.
 */
final readonly class VerifiedCommandActor
{
    private function __construct(
        public int $userId,
        public int $employeeId,
        public int $officeId,
        public string $officeCode,
        public bool $officeRoutable,
        public string $role,
        public int $sessionVersion,
    ) {}

    public static function verifyOnConnection(
        ConnectionInterface $connection,
        int $actorUserId,
        int $expectedOfficeId,
        ?int $expectedSessionVersion = null,
        ?string $expectedRole = null,
    ): self {
        if ($actorUserId <= 0 || $expectedOfficeId <= 0) {
            throw new AuthorizationException('Custody command actor and office identifiers must be positive.');
        }

        if (Auth::id() !== null && (int) Auth::id() !== $actorUserId) {
            throw new AuthorizationException('Custody command actor does not match the active authenticated session.');
        }

        if ($expectedSessionVersion === null && Auth::id() !== null) {
            if (app()->bound('request')
                && request()->hasSession()
                && request()->session()->has('auth_session_version')) {
                $expectedSessionVersion = (int) request()->session()->get('auth_session_version');
            } elseif (app()->bound('session.store')
                && app('session.store')->has('auth_session_version')) {
                $expectedSessionVersion = (int) app('session.store')->get('auth_session_version');
            }
        }

        $user = $connection->table('users')
            ->select(['id', 'role', 'is_active', 'account_status', 'session_version', 'suspended_at'])
            ->where('id', $actorUserId)
            ->first();

        if ($user === null
            || ! (bool) $user->is_active
            || (string) $user->account_status !== 'active'
            || $user->suspended_at !== null) {
            throw new AuthorizationException('Custody command actor account is inactive or suspended.');
        }

        $liveSessionVersion = (int) $user->session_version;
        if ($expectedSessionVersion !== null && $liveSessionVersion !== $expectedSessionVersion) {
            throw new AuthorizationException('Custody command actor session version is stale.');
        }

        $liveRole = (string) $user->role;
        if ($expectedRole !== null && $liveRole !== $expectedRole) {
            throw new AuthorizationException('Custody command actor role does not match live authority.');
        }

        $employee = $connection->table('employees')
            ->select(['id', 'user_id', 'department_id', 'employment_status', 'separation_date'])
            ->where('user_id', $actorUserId)
            ->first();

        if ($employee === null
            || (string) $employee->employment_status !== 'active'
            || $employee->separation_date !== null) {
            throw new AuthorizationException('Custody command actor is not an active municipal employee.');
        }

        if ((int) $employee->department_id !== $expectedOfficeId) {
            throw new AuthorizationException('Custody command actor office does not match live employment office.');
        }

        $department = $connection->table('departments')
            ->select(['id', 'code', 'is_active', 'is_routable'])
            ->where('id', $expectedOfficeId)
            ->first();

        if ($department === null || ! (bool) $department->is_active) {
            throw new AuthorizationException('Custody command actor office is inactive.');
        }

        return new self(
            userId: (int) $user->id,
            employeeId: (int) $employee->id,
            officeId: (int) $department->id,
            officeCode: (string) $department->code,
            officeRoutable: (bool) $department->is_routable,
            role: $liveRole,
            sessionVersion: $liveSessionVersion,
        );
    }

    public function isRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isMayorOffice(): bool
    {
        return $this->officeCode === 'MAYOR';
    }
}
