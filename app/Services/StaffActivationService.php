<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

final class StaffActivationService
{
    public const INVITABLE_ROLES = [
        'employee', 'department_staff', 'department_head',
        'hr_officer', 'legislative_staff', 'mayor_staff',
    ];

    public function __construct(
        private readonly AuditLogger $audit,
        private readonly SystemAdministrationAccess $access,
        private readonly AccountSessionEligibility $eligibility,
        private readonly AuthenticationAssurance $assurance,
    ) {}

    /** @return array{invitation: StaffActivationInvitation, code: string} */
    public function issue(Request $request, User $actor, array $input): array
    {
        $role = (string) $input['role'];
        if (! in_array($role, self::INVITABLE_ROLES, true)) {
            throw ValidationException::withMessages(['role' => 'This role cannot be granted through ordinary onboarding.']);
        }

        return $this->transaction(function () use ($request, $actor, $input, $role): array {
            [$admin, $employee, $user, $office, $invitations] = $this->lockContext($actor, (int) $input['employee_id'], request: $request);
            $this->requireEligible($employee, $office);
            $username = Str::lower(trim((string) $input['username']));
            $email = filled($input['contact_email'] ?? null) ? Str::lower(trim((string) $input['contact_email'])) : null;

            if ($user) {
                $this->requireOrdinary($admin, $user);
                $this->requireState($user, 'pending', false);
                $previous = $invitations->last();
                if (! $previous || ! $this->matchesInvitation($previous, $employee, $user, $office)
                    || $user->username !== $username || $user->email !== $email || $user->role !== $role) {
                    throw $this->invalidState();
                }
            }
            $this->requireUniqueLogin($username, $email, $user);

            if (! $user) {
                $user = User::query()->create([
                    'name' => $employee->full_name ?: 'Portal user',
                    'username' => $username,
                    'email' => $email,
                    'role' => $role,
                    'is_active' => false,
                    'account_status' => 'pending',
                    'password' => Str::random(80),
                ]);
                $employee->forceFill(['user_id' => $user->id])->save();
            }

            return $this->issueLocked($admin, $employee, $user, $office, $invitations);
        });
    }

    /**
     * Claim delivery once; this does not consume the invitation for redemption.
     * Return only after the locked authorization and disclosure audit commit.
     */
    public function claimDisclosure(Request $request, User $actor, int $invitationId, string $code): ?array
    {
        return $this->transaction(function () use ($request, $actor, $invitationId, $code): ?array {
            $candidate = StaffActivationInvitation::query()->find($invitationId);
            if (! $candidate || (int) $candidate->created_by_user_id !== (int) $actor->id) {
                return null;
            }

            try {
                [$admin, $employee, $user, $office, $invitations] = $this->lockContext(
                    $actor, (int) $candidate->employee_id, (int) $candidate->user_id, $request,
                );
                $this->requireEligible($employee, $office);
                $this->requireState($user, 'pending', false);
                $this->requireOrdinary($admin, $user);
                $locked = $invitations->find($invitationId);
                if (! $locked || (int) $locked->created_by_user_id !== (int) $admin->id
                    || $locked->disclosed_at || $locked->consumed_at || $locked->revoked_at
                    || $locked->expires_at->lessThanOrEqualTo(now())
                    || ! $this->matchesInvitation($locked, $employee, $user, $office)
                    || ! hash_equals($locked->code_digest, $this->digest($code))) {
                    return null;
                }
            } catch (ValidationException) {
                return null;
            }

            $locked->forceFill(['disclosed_at' => now()])->save();
            $this->audit->record($admin, 'identity.invitation.disclosed', 'Private activation credential disclosed once; secret omitted.', 'allowed', StaffActivationInvitation::class, $locked->id);

            return [
                'invitationId' => (int) $locked->id,
                'code' => $code,
                'username' => $locked->username,
                'expiresAt' => $locked->expires_at->toIso8601String(),
            ];
        });
    }

    public function redeem(string $code, string $password): User
    {
        if (! preg_match('/\A(?:[A-Fa-f0-9]{32}|[A-Fa-f0-9]{4}(?:-[A-Fa-f0-9]{4}){7})\z/D', trim($code))) {
            throw $this->invalidCode();
        }

        return $this->transaction(function () use ($code, $password): User {
            $digest = $this->digest($code);
            $candidate = StaffActivationInvitation::query()->where('code_digest', $digest)->first();
            if (! $candidate) {
                throw $this->invalidCode();
            }

            try {
                [, $employee, $user, $office, $invitations] = $this->lockContext(null, (int) $candidate->employee_id, (int) $candidate->user_id);
                $invitation = $invitations->find($candidate->id);
                $this->requireEligible($employee, $office);
                $this->requireState($user, 'pending', false);
                if (! $invitation || $invitation->consumed_at || $invitation->revoked_at
                    || $invitation->expires_at->lessThanOrEqualTo(now())
                    || ! hash_equals($invitation->code_digest, $digest)
                    || ! $this->matchesInvitation($invitation, $employee, $user, $office)
                    || ! in_array($user->role, self::INVITABLE_ROLES, true)) {
                    throw $this->invalidCode();
                }
            } catch (ValidationException $exception) {
                throw $this->invalidCode();
            }

            $user->forceFill([
                'password' => $password,
                'is_active' => true,
                'account_status' => 'active',
                'session_version' => ((int) $user->session_version) + 1,
                'remember_token' => null,
                'suspended_at' => null,
                'suspended_by_user_id' => null,
            ])->save();
            $invitation->forceFill(['consumed_at' => now()])->save();
            $this->revokeOutstanding($invitations, 'activation completed');
            $this->audit->record($user, 'identity.activation.completed', 'Account activated through a one-time private code.', 'allowed', User::class, $user->id);

            return $user;
        });
    }

    public function revoke(Request $request, User $actor, StaffActivationInvitation $invitation, string $reason = 'administrator revoked'): void
    {
        $this->transaction(function () use ($request, $actor, $invitation, $reason): void {
            $candidate = StaffActivationInvitation::query()->findOrFail($invitation->id);
            [$admin, $employee, $user, , $invitations] = $this->lockContext($actor, (int) $candidate->employee_id, (int) $candidate->user_id, $request);
            $this->requireOrdinary($admin, $user);
            $this->requireState($user, 'pending', false);
            $locked = $invitations->find($candidate->id);
            if (! $locked || (int) $locked->employee_id !== (int) $employee->id
                || $locked->consumed_at || $locked->revoked_at) {
                throw $this->invalidState();
            }
            $locked->forceFill(['revoked_at' => now(), 'revocation_reason' => Str::limit($reason, 255, '')])->save();
            $this->audit->record($admin, 'identity.invitation.revoked', 'Pending activation revoked; secret omitted.', 'allowed', StaffActivationInvitation::class, $locked->id);
        });
    }

    public function suspend(Request $request, User $actor, User $subject, string $reason): void
    {
        $this->transaction(function () use ($request, $actor, $subject, $reason): void {
            [$admin, , $user, , $invitations] = $this->lockContext($actor, null, (int) $subject->id, $request);
            $this->requireOrdinary($admin, $user);
            $this->requireState($user, 'active', true);
            // Removal of access must remain possible even after separation.
            $user->forceFill([
                'is_active' => false, 'account_status' => 'suspended',
                'suspended_at' => now(), 'suspended_by_user_id' => $admin->id,
                'session_version' => ((int) $user->session_version) + 1, 'remember_token' => null,
            ])->save();
            $this->revokeOutstanding($invitations, 'account suspended');
            $this->audit->record($admin, 'identity.account.suspended', 'Portal account suspended. Reason: '.Str::limit($reason, 160, ''), 'allowed', User::class, $user->id);
        });
    }

    public function reactivate(Request $request, User $actor, User $subject): void
    {
        $this->transaction(function () use ($request, $actor, $subject): void {
            [$admin, $employee, $user, $office, $invitations] = $this->lockContext($actor, null, (int) $subject->id, $request);
            $this->requireOrdinary($admin, $user);
            $this->requireState($user, 'suspended', false);
            $this->requireEligible($employee, $office);
            $user->forceFill([
                'is_active' => true, 'account_status' => 'active',
                'suspended_at' => null, 'suspended_by_user_id' => null,
                'session_version' => ((int) $user->session_version) + 1, 'remember_token' => null,
            ])->save();
            $this->revokeOutstanding($invitations, 'account reactivated');
            $this->audit->record($admin, 'identity.account.reactivated', 'Portal account reactivated after eligibility verification.', 'allowed', User::class, $user->id);
        });
    }

    /** @return array{invitation: StaffActivationInvitation, code: string} */
    public function recover(Request $request, User $actor, User $subject): array
    {
        return $this->transaction(function () use ($request, $actor, $subject): array {
            [$admin, $employee, $user, $office, $invitations] = $this->lockContext($actor, null, (int) $subject->id, $request);
            $this->requireOrdinary($admin, $user);
            $this->requireState($user, 'active', true);
            $this->requireEligible($employee, $office);
            if (blank($user->username)) {
                throw $this->invalidState();
            }
            $this->requireUniqueLogin($user->username, $user->email, $user);
            $user->forceFill([
                'is_active' => false, 'account_status' => 'pending',
                'password' => Str::random(80), 'remember_token' => null,
                'suspended_at' => null, 'suspended_by_user_id' => null,
                'mfa_secret' => null, 'mfa_confirmed_at' => null,
                'mfa_recovery_codes' => null, 'mfa_recovery_codes_generated_at' => null,
                'mfa_version' => ((int) $user->mfa_version) + 1,
                'session_version' => ((int) $user->session_version) + 1,
            ])->save();
            $this->audit->record($admin, 'identity.account.recovery_started', 'Controlled credential recovery started; existing sessions and MFA assurance invalidated.', 'allowed', User::class, $user->id);

            return $this->issueLocked($admin, $employee, $user, $office, $invitations);
        });
    }

    /**
     * Discover identifiers, then acquire every existing row in the same order.
     * Re-read links after locking; route models supply identifiers only.
     *
     * @return array{?User, ?Employee, ?User, ?Department, Collection}
     */
    private function lockContext(?User $actor, ?int $employeeId, ?int $subjectId = null, ?Request $request = null): array
    {
        $actorId = $actor ? (int) $actor->getKey() : null;
        if ($actor && ! $actorId) {
            throw new AuthorizationException('Administrator access denied.');
        }
        $actorEmployeeId = $actorId ? Employee::query()->where('user_id', $actorId)->value('id') : null;
        if ($employeeId === null && $subjectId !== null) {
            $employeeId = Employee::query()->where('user_id', $subjectId)->value('id');
        }
        $employeeIds = array_unique(array_filter([$actorEmployeeId, $employeeId]));
        $employees = Employee::query()->whereIn('id', $employeeIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $employee = $employees->get($employeeId);
        $actorEmployee = $employees->get($actorEmployeeId);
        if ($employeeId !== null && ! $employee) {
            throw $this->invalidState();
        }
        if ($subjectId !== null && $employee && (int) $employee->user_id !== $subjectId) {
            throw $this->invalidState();
        }
        $targetId = $subjectId ?? $employee?->user_id;
        $users = User::query()->whereIn('id', array_unique(array_filter([$actorId, $targetId])))
            ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        $admin = $users->get($actorId);
        $user = $users->get($targetId);
        if ($actorId !== null && (! $admin || $admin->account_status !== 'active'
            || (int) Employee::query()->where('user_id', $actorId)->value('id') !== (int) $actorEmployeeId
            || ($actorEmployee && (int) $actorEmployee->user_id !== $actorId))) {
            throw new AuthorizationException('Administrator access denied.');
        }
        if ($targetId !== null && (! $user
            || (int) Employee::query()->where('user_id', $targetId)->value('id') !== (int) $employeeId)) {
            throw $this->invalidState();
        }
        $offices = Department::query()->whereIn('id', array_unique(array_filter([$actorEmployee?->department_id, $employee?->department_id])))
            ->orderBy('id')->lockForUpdate()->get()->keyBy('id');
        if ($admin) {
            $this->access->authorize($admin);
            // Unlinked username-less legacy administration remains compatible;
            // a linked legacy administrator must meet the same office rules.
            if (($actorEmployee !== null || filled($admin->username)) && ! $this->eligible($actorEmployee, $offices->get($actorEmployee?->department_id))) {
                throw new AuthorizationException('Administrator access denied.');
            }
            // The same locked administrator must still authorize this request.
            // No second lock acquisition or middleware-only assurance.
            if ($request === null) {
                throw new AuthorizationException('Administrator access denied.');
            }
            $this->eligibility->requireSession($request, $admin);
            if (! $this->assurance->isSatisfiedAgainst($request, $admin)) {
                throw new AuthorizationException('Administrator access denied.');
            }
        }
        $invitations = $user
            ? StaffActivationInvitation::query()->where('user_id', $user->id)->orderBy('id')->lockForUpdate()->get()
            : new Collection;

        return [$admin, $employee, $user, $offices->get($employee?->department_id), $invitations];
    }

    private function eligible(?Employee $employee, ?Department $office): bool
    {
        return $employee !== null && $employee->employment_status === 'active'
            && $employee->separation_date === null && (bool) $office?->is_active;
    }

    private function requireEligible(?Employee $employee, ?Department $office): void
    {
        if (! $this->eligible($employee, $office)) {
            throw ValidationException::withMessages(['employee_id' => 'Select an active eligible employee in an active office.']);
        }
    }

    private function requireOrdinary(User $actor, ?User $user): void
    {
        if (! $user || (int) $actor->id === (int) $user->id || ! in_array($user->role, self::INVITABLE_ROLES, true)) {
            throw new AuthorizationException('This account requires operator-controlled lifecycle management.');
        }
    }

    private function requireState(?User $user, string $state, bool $active): void
    {
        if (! $user || $user->account_status !== $state || $user->is_active !== $active) {
            throw $this->invalidState();
        }
    }

    private function matchesInvitation(StaffActivationInvitation $invitation, Employee $employee, User $user, Department $office): bool
    {
        return (int) $invitation->employee_id === (int) $employee->id
            && (int) $invitation->user_id === (int) $user->id
            && (int) $invitation->department_id === (int) $office->id
            && (int) $employee->user_id === (int) $user->id
            && $user->username === $invitation->username
            && $user->email === $invitation->contact_email
            && $user->role === $invitation->role;
    }

    private function requireUniqueLogin(string $username, ?string $email, ?User $user): void
    {
        if (User::query()->whereRaw('lower(btrim(username)) = ?', [Str::lower(trim($username))])->when($user, fn ($q) => $q->whereKeyNot($user->id))->exists()) {
            throw ValidationException::withMessages(['username' => 'That portal username is already in use.']);
        }
        if ($email && User::query()->whereRaw('lower(btrim(email)) = ?', [Str::lower(trim($email))])->when($user, fn ($q) => $q->whereKeyNot($user->id))->exists()) {
            throw ValidationException::withMessages(['contact_email' => 'That contact email is already in use.']);
        }
    }

    private function issueLocked(User $actor, Employee $employee, User $user, Department $office, Collection $invitations): array
    {
        $this->revokeOutstanding($invitations, 'reissued');
        $code = strtoupper(bin2hex(random_bytes(16)));
        $invitation = StaffActivationInvitation::query()->create([
            'employee_id' => $employee->id,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'created_by_user_id' => $actor->id,
            'username' => $user->username,
            'contact_email' => $user->email,
            'role' => $user->role,
            'code_digest' => $this->digest($code),
            'expires_at' => now()->addHours(24),
        ]);
        $this->audit->record($actor, 'identity.invitation.issued', 'Private activation code issued; secret omitted.', 'allowed', StaffActivationInvitation::class, $invitation->id);

        return ['invitation' => $invitation, 'code' => implode('-', str_split($code, 4))];
    }

    private function revokeOutstanding(Collection $invitations, string $reason): void
    {
        foreach ($invitations as $invitation) {
            if (! $invitation->consumed_at && ! $invitation->revoked_at) {
                $invitation->forceFill(['revoked_at' => now(), 'revocation_reason' => $reason])->save();
            }
        }
    }

    private function transaction(callable $operation): mixed
    {
        try {
            return DB::transaction($operation, 3);
        } catch (UniqueConstraintViolationException $exception) {
            throw ValidationException::withMessages(['account' => 'The account operation conflicts with an existing identity.']);
        }
    }

    private function digest(string $code): string
    {
        return hash_hmac('sha256', strtoupper(str_replace('-', '', trim($code))), (string) config('app.key'));
    }

    private function invalidState(): ValidationException
    {
        return ValidationException::withMessages(['account' => 'This account cannot undergo the requested lifecycle operation.']);
    }

    private function invalidCode(): ValidationException
    {
        return ValidationException::withMessages(['code' => 'This activation code cannot be used. Ask the administrator for a new code.']);
    }
}
