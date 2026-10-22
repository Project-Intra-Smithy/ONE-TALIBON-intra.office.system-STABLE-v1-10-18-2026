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

/**
 * A manually delivered, one-use invitation is a credential. Never put its
 * plaintext value in DB, logs, audit summaries, persistent response props,
 * or admin account lists.
 */
final class StaffActivationService
{
    public const INVITABLE_ROLES = [
        'employee', 'department_staff', 'department_head',
        'hr_officer', 'legislative_staff', 'mayor_staff',
    ];

    public function __construct(private readonly AuditLogger $audit)
    {
    }

    public function authorizeAdministrator(User $actor): void
    {
        $employee = $actor->employee()->with('department')->first();
        if (! $actor->is_active || ! $actor->isRole('system_admin')
            || ! $employee || $employee->employment_status !== 'active'
            || ! $employee->department?->is_active) {
            throw new AuthorizationException('Administrator authorization required.');
        }
    }

    /**
     * @return array{invitation:StaffActivationInvitation,token:string}
     */
    public function issue(User $actor, int $employeeId, int $departmentId, string $role): array
    {
        $this->authorizeAdministrator($actor);
        if (! in_array($role, self::INVITABLE_ROLES, true)) {
            throw ValidationException::withMessages(['role' => 'Role is not assignable by staff invitation.']);
        }

        return DB::transaction(function () use ($actor, $employeeId, $departmentId, $role): array {
            $employee = Employee::query()->whereKey($employeeId)->lockForUpdate()->first();
            if (! $employee || $employee->employment_status !== 'active'
                || $employee->separation_date !== null
                || (int) $employee->department_id !== $departmentId
                || ! $employee->full_name || ! $employee->work_email
                || ! filter_var($employee->work_email, FILTER_VALIDATE_EMAIL)) {
                throw ValidationException::withMessages(['employee_id' => 'Selected employee is not eligible for activation.']);
            }

            $department = Department::query()->whereKey($departmentId)->where('is_active', true)->first();
            if (! $department) {
                throw ValidationException::withMessages(['department_id' => 'Selected office is not active.']);
            }

            $email = Str::lower(trim($employee->work_email));
            $existing = $employee->user_id
                ? User::query()->whereKey($employee->user_id)->lockForUpdate()->first()
                : null;

            if ($employee->user_id && (! $existing || $existing->is_active)) {
                throw ValidationException::withMessages(['employee_id' => 'Employee already has an active account.']);
            }
            if (User::query()->where('email', $email)->when($existing, fn ($q) => $q->where('id', '!=', $existing->id))->exists()) {
                throw ValidationException::withMessages(['employee_id' => 'Employee identity is already in use.']);
            }
            if ($existing && $existing->email !== $email) {
                throw ValidationException::withMessages(['employee_id' => 'Registered account and employee email do not match.']);
            }

            if (! $existing) {
                $existing = User::query()->create([
                    'name' => $employee->full_name,
                    'email' => $email,
                    'password' => Str::random(80), // Unknowable, hashed, inactive until redemption.
                    'role' => $role,
                    'is_active' => false,
                ]);
                $employee->user_id = $existing->id;
                $employee->save();
            } else {
                $existing->forceFill(['role' => $role])->save();
            }

            StaffActivationInvitation::query()
                ->where('employee_id', $employee->id)
                ->whereNull('consumed_at')->whereNull('revoked_at')
                ->update(['revoked_at' => now()]);

            $token = bin2hex(random_bytes(32));
            $invitation = StaffActivationInvitation::query()->create([
                'employee_id' => $employee->id, 'user_id' => $existing->id,
                'department_id' => $department->id,
                'created_by_user_id' => $actor->id,
                'email' => $email, 'role' => $role,
                'token_hash' => hash('sha256', $token),
                'expires_at' => now()->addHours(24),
            ]);
            $this->audit->record($actor, 'identity.invitation.created',
                'Controlled employee activation invitation issued; secret omitted.',
                'allowed', StaffActivationInvitation::class, $invitation->id);

            return ['invitation' => $invitation, 'token' => $token];
        }, 3);
    }

    public function status(string $token): string
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/D', $token)) {
            return 'invalid';
        }
        $invitation = StaffActivationInvitation::query()
            ->where('token_hash', hash('sha256', $token))->first();
        if (! $invitation) return 'invalid';
        if ($invitation->consumed_at) return 'consumed';
        if ($invitation->revoked_at) return 'revoked';
        if ($invitation->expires_at->isPast()) return 'expired';

        $employee = Employee::query()->find($invitation->employee_id);
        $user = User::query()->find($invitation->user_id);
        $office = Department::query()->find($invitation->department_id);

        return $this->matches($invitation, $employee, $user, $office) ? 'valid' : 'revoked';
    }

    public function redeem(string $token, string $employeeNumber, string $password): User
    {
        if (! preg_match('/\A[a-f0-9]{64}\z/D', $token)) {
            throw $this->invalidToken();
        }

        $hash = hash('sha256', $token);
        return DB::transaction(function () use ($hash, $employeeNumber, $password): User {
            // Consistent employee -> user -> invitation lock order with issue/revoke.
            $candidate = StaffActivationInvitation::query()->where('token_hash', $hash)->first();
            if (! $candidate) throw $this->invalidToken();

            $employee = Employee::query()->whereKey($candidate->employee_id)->lockForUpdate()->first();
            $user = User::query()->whereKey($candidate->user_id)->lockForUpdate()->first();
            $invitation = StaffActivationInvitation::query()->whereKey($candidate->id)->lockForUpdate()->first();
            $office = Department::query()->whereKey($candidate->department_id)->first();

            if (! $invitation || $invitation->token_hash !== $hash
                || $invitation->consumed_at || $invitation->revoked_at
                || $invitation->expires_at->isPast()
                || ! $this->matches($invitation, $employee, $user, $office)
                || ! hash_equals((string) $employee->employee_number, trim($employeeNumber))) {
                throw $this->invalidToken();
            }

            $user->forceFill([
                'password' => $password, // Eloquent hashed cast; no direct plaintext storage.
                'is_active' => true,
            ])->save();
            $invitation->forceFill(['consumed_at' => now()])->save();

            $this->audit->record($user, 'identity.activation.completed',
                'Invited employee account activated through one-time credential.',
                'allowed', StaffActivationInvitation::class, $invitation->id);
            return $user;
        }, 3);
    }

    public function revoke(User $actor, int $id): void
    {
        $this->authorizeAdministrator($actor);
        DB::transaction(function () use ($actor, $id): void {
            $candidate = StaffActivationInvitation::query()->findOrFail($id);
            $employee = Employee::query()->whereKey($candidate->employee_id)->lockForUpdate()->first();
            if (! $employee) return;
            $invitation = StaffActivationInvitation::query()->whereKey($id)->lockForUpdate()->firstOrFail();
            if (! $invitation->consumed_at && ! $invitation->revoked_at) {
                $invitation->forceFill(['revoked_at' => now()])->save();
                $this->audit->record($actor, 'identity.invitation.revoked',
                    'Pending employee invitation revoked; secret omitted.',
                    'allowed', StaffActivationInvitation::class, $invitation->id);
            }
        }, 3);
    }

    private function matches(
        StaffActivationInvitation $invitation,
        ?Employee $employee,
        ?User $user,
        ?Department $office,
    ): bool {
        return $employee !== null && $user !== null && $office !== null
            && $employee->employment_status === 'active'
            && $employee->separation_date === null
            && $office->is_active
            && (int) $employee->department_id === (int) $invitation->department_id
            && (int) $employee->user_id === (int) $user->id
            && (int) $invitation->user_id === (int) $user->id
            && ! $user->is_active
            && $user->role === $invitation->role
            && in_array($user->role, self::INVITABLE_ROLES, true)
            && Str::lower(trim((string) $employee->work_email)) === $invitation->email
            && $user->email === $invitation->email;
    }

    private function invalidToken(): ValidationException
    {
        return ValidationException::withMessages([
            'invitation' => 'This invitation cannot be used. Contact the issuing administrator.',
        ]);
    }
}
