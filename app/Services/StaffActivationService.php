<?php

namespace App\Services;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;
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
    ) {}

    /** @return array{invitation: StaffActivationInvitation, code: string} */
    public function issue(User $actor, array $input): array
    {
        $this->access->authorize($actor);
        $role = (string) $input['role'];
        if (! in_array($role, self::INVITABLE_ROLES, true)) {
            throw ValidationException::withMessages(['role' => 'This role cannot be granted through ordinary onboarding.']);
        }

        return DB::transaction(function () use ($actor, $input, $role): array {
            $employee = Employee::query()->whereKey((int) $input['employee_id'])->lockForUpdate()->first();
            if (! $employee || $employee->employment_status !== 'active' || $employee->separation_date !== null) {
                throw ValidationException::withMessages(['employee_id' => 'Select an active eligible employee.']);
            }
            $department = Department::query()->whereKey($employee->department_id)->where('is_active', true)->first();
            if (! $department) {
                throw ValidationException::withMessages(['employee_id' => 'The employee office is not active.']);
            }

            $username = Str::lower(trim((string) $input['username']));
            $email = filled($input['contact_email'] ?? null) ? Str::lower(trim((string) $input['contact_email'])) : null;
            $user = $employee->user_id
                ? User::query()->whereKey($employee->user_id)->lockForUpdate()->first()
                : null;

            if ($user && $user->account_status !== 'pending') {
                throw ValidationException::withMessages(['employee_id' => 'This employee already has a provisioned account.']);
            }
            if (User::query()->whereRaw('lower(username) = ?', [$username])->when($user, fn ($q) => $q->whereKeyNot($user->id))->exists()) {
                throw ValidationException::withMessages(['username' => 'That portal username is already in use.']);
            }
            if ($email && User::query()->whereRaw('lower(email) = ?', [$email])->when($user, fn ($q) => $q->whereKeyNot($user->id))->exists()) {
                throw ValidationException::withMessages(['contact_email' => 'That contact email is already in use.']);
            }

            $attributes = [
                'name' => $employee->full_name ?: 'Portal user',
                'username' => $username,
                'email' => $email,
                'role' => $role,
                'is_active' => false,
                'account_status' => 'pending',
            ];
            if (! $user) {
                $user = User::query()->create($attributes + ['password' => Str::random(80)]);
                $employee->forceFill(['user_id' => $user->id])->save();
            } else {
                $user->forceFill($attributes)->save();
            }

            StaffActivationInvitation::query()->where('user_id', $user->id)
                ->whereNull('consumed_at')->whereNull('revoked_at')
                ->update(['revoked_at' => now(), 'revocation_reason' => 'reissued']);

            $code = strtoupper(bin2hex(random_bytes(16)));
            $invitation = StaffActivationInvitation::query()->create([
                'employee_id' => $employee->id,
                'user_id' => $user->id,
                'department_id' => $department->id,
                'created_by_user_id' => $actor->id,
                'username' => $username,
                'contact_email' => $email,
                'role' => $role,
                'code_digest' => $this->digest($code),
                'expires_at' => now()->addHours(24),
            ]);
            $this->audit->record($actor, 'identity.invitation.issued', 'Private activation code issued; secret omitted.', 'allowed', StaffActivationInvitation::class, $invitation->id);

            return ['invitation' => $invitation, 'code' => $this->formatCode($code)];
        }, 3);
    }

    public function redeem(string $code, string $password): User
    {
        $normalized = $this->normalizeCode($code);
        if (! preg_match('/\A[A-F0-9]{32}\z/D', $normalized)) {
            throw $this->invalidCode();
        }

        return DB::transaction(function () use ($normalized, $password): User {
            $candidate = StaffActivationInvitation::query()->where('code_digest', $this->digest($normalized))->first();
            if (! $candidate) throw $this->invalidCode();
            $employee = Employee::query()->whereKey($candidate->employee_id)->lockForUpdate()->first();
            $user = User::query()->whereKey($candidate->user_id)->lockForUpdate()->first();
            $invitation = StaffActivationInvitation::query()->whereKey($candidate->id)->lockForUpdate()->first();
            $department = Department::query()->whereKey($candidate->department_id)->first();

            if (! $invitation || $invitation->consumed_at || $invitation->revoked_at || $invitation->expires_at->isPast()
                || ! $employee || ! $user || ! $department || ! $department->is_active
                || $employee->employment_status !== 'active' || $employee->separation_date !== null
                || (int) $employee->user_id !== (int) $user->id || (int) $employee->department_id !== (int) $department->id
                || $user->account_status !== 'pending' || $user->username !== $invitation->username
                || $user->role !== $invitation->role || ! in_array($user->role, self::INVITABLE_ROLES, true)) {
                throw $this->invalidCode();
            }

            $user->forceFill([
                'password' => $password,
                'is_active' => true,
                'account_status' => 'active',
                'session_version' => ((int) $user->session_version) + 1,
                'suspended_at' => null,
                'suspended_by_user_id' => null,
            ])->save();
            $invitation->forceFill(['consumed_at' => now()])->save();
            $this->audit->record($user, 'identity.activation.completed', 'Account activated through a one-time private code.', 'allowed', User::class, $user->id);

            return $user;
        }, 3);
    }

    public function revoke(User $actor, StaffActivationInvitation $invitation, string $reason = 'administrator revoked'): void
    {
        $this->access->authorize($actor);
        DB::transaction(function () use ($actor, $invitation, $reason): void {
            $locked = StaffActivationInvitation::query()->whereKey($invitation->id)->lockForUpdate()->firstOrFail();
            if (! $locked->consumed_at && ! $locked->revoked_at) {
                $locked->forceFill(['revoked_at' => now(), 'revocation_reason' => Str::limit($reason, 255, '')])->save();
                $this->audit->record($actor, 'identity.invitation.revoked', 'Pending activation revoked; secret omitted.', 'allowed', StaffActivationInvitation::class, $locked->id);
            }
        });
    }

    public function suspend(User $actor, User $subject, string $reason): void
    {
        $this->access->authorize($actor);
        if ($subject->isRole('system_admin')) throw new AuthorizationException('System administrator lifecycle requires operator control.');
        $subject->forceFill(['is_active' => false, 'account_status' => 'suspended', 'suspended_at' => now(), 'suspended_by_user_id' => $actor->id, 'session_version' => ((int) $subject->session_version) + 1, 'remember_token' => null])->save();
        $this->audit->record($actor, 'identity.account.suspended', 'Portal account suspended. Reason: '.Str::limit($reason, 160, ''), 'allowed', User::class, $subject->id);
    }

    public function reactivate(User $actor, User $subject): void
    {
        $this->access->authorize($actor);
        $employee = $subject->employee()->with('department')->first();
        if (! $employee || $employee->employment_status !== 'active' || ! $employee->department?->is_active) {
            throw ValidationException::withMessages(['account' => 'The linked employee and office must be active before reactivation.']);
        }
        $subject->forceFill(['is_active' => true, 'account_status' => 'active', 'suspended_at' => null, 'suspended_by_user_id' => null, 'session_version' => ((int) $subject->session_version) + 1])->save();
        $this->audit->record($actor, 'identity.account.reactivated', 'Portal account reactivated after eligibility verification.', 'allowed', User::class, $subject->id);
    }

    /** @return array{invitation: StaffActivationInvitation, code: string} */
    public function recover(User $actor, User $subject): array
    {
        $this->access->authorize($actor);
        if ($subject->isRole('system_admin') || ! in_array($subject->role, self::INVITABLE_ROLES, true)) {
            throw new AuthorizationException('Elevated accounts require operator-controlled recovery.');
        }
        $employee = $subject->employee()->with('department')->first();
        if (! $employee || $employee->employment_status !== 'active' || ! $employee->department?->is_active || ! $subject->username) {
            throw ValidationException::withMessages(['account' => 'This account is not eligible for controlled recovery.']);
        }
        $subject->forceFill([
            'is_active' => false, 'account_status' => 'pending',
            'password' => Str::random(80), 'remember_token' => null,
            'mfa_secret' => null, 'mfa_confirmed_at' => null,
            'mfa_recovery_codes' => null, 'mfa_recovery_codes_generated_at' => null,
            'mfa_version' => ((int) $subject->mfa_version) + 1,
            'session_version' => ((int) $subject->session_version) + 1,
        ])->save();
        $this->audit->record($actor, 'identity.account.recovery_started', 'Controlled credential recovery started; existing sessions and MFA assurance invalidated.', 'allowed', User::class, $subject->id);

        return $this->issue($actor, [
            'employee_id' => $employee->id,
            'username' => $subject->username,
            'contact_email' => $subject->email,
            'role' => $subject->role,
        ]);
    }

    private function digest(string $code): string { return hash_hmac('sha256', $this->normalizeCode($code), (string) config('app.key')); }
    private function normalizeCode(string $code): string { return strtoupper((string) preg_replace('/[^A-Fa-f0-9]/', '', $code)); }
    private function formatCode(string $code): string { return implode('-', str_split($code, 4)); }
    private function invalidCode(): ValidationException { return ValidationException::withMessages(['code' => 'This activation code cannot be used. Ask the administrator for a new code.']); }
}
