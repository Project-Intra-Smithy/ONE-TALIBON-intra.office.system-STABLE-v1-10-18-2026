<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Throwable;

final class BootstrapFirstAdminCommand extends Command
{
    protected $signature = 'talibon:bootstrap-first-admin
        {--username= : Unique portal username}
        {--contact-email= : Optional real contact email}
        {--name= : Full name}
        {--employee-number= : Optional existing personnel number}
        {--department-code= : Existing active office code}
        {--position= : Position title}';

    protected $description = 'Interactively create the one trusted system administrator in an empty User database';

    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->error('Bootstrap is restricted to PostgreSQL.');
            return self::FAILURE;
        }
        if (! $this->input->isInteractive() && ! app()->environment('testing')) {
            $this->error('An interactive private password prompt is mandatory.');
            return self::FAILURE;
        }

        $username = Str::lower(trim((string) $this->option('username')));
        $email = Str::lower(trim((string) $this->option('contact-email')));
        $name = trim((string) $this->option('name'));
        $employeeNumber = trim((string) $this->option('employee-number')) ?: null;
        $departmentCode = trim((string) $this->option('department-code'));
        $position = trim((string) $this->option('position'));
        if (! preg_match('/\A[a-z][a-z0-9._-]{2,63}\z/D', $username) || ($email !== '' && ! filter_var($email, FILTER_VALIDATE_EMAIL))
            || $name === '' || mb_strlen($name) > 255 || $departmentCode === '' || $position === '' || mb_strlen($position) > 255) {
            $this->error('Valid username, name, active office code and position are required; contact email is optional.');
            return self::FAILURE;
        }

        $password = (string) $this->secret('New administrator password (minimum 16 characters)');
        $confirmation = (string) $this->secret('Confirm password');
        if (strlen($password) < 16 || strlen($password) > 128 || ! hash_equals($password, $confirmation)) {
            $this->error('Password must be 16–128 characters and match.');
            return self::FAILURE;
        }
        if (! $this->confirm('Create the one initial system administrator?', false)) return self::FAILURE;

        try {
            DB::transaction(function () use ($username, $email, $name, $employeeNumber, $departmentCode, $position, $password): void {
                DB::statement('LOCK TABLE users IN EXCLUSIVE MODE');
                DB::statement('LOCK TABLE initial_admin_bootstraps IN EXCLUSIVE MODE');
                if (User::query()->exists() || DB::table('initial_admin_bootstraps')->exists()) {
                    throw new \RuntimeException('already provisioned');
                }
                $department = Department::query()->where('code', $departmentCode)->where('is_active', true)->lockForUpdate()->first();
                if (! $department || ($employeeNumber && Employee::query()->where('employee_number', $employeeNumber)->exists())) {
                    throw new \RuntimeException('identity not eligible');
                }
                $user = User::query()->create([
                    'name' => $name, 'username' => $username, 'email' => $email ?: null,
                    'password' => $password, 'role' => 'system_admin', 'is_active' => true,
                    'account_status' => 'active',
                ]);
                Employee::query()->create([
                    'user_id' => $user->id, 'employee_number' => $employeeNumber, 'full_name' => $name,
                    'work_email' => $email ?: null, 'department_id' => $department->id,
                    'position_title' => $position, 'employment_status' => 'active',
                ]);
                DB::table('initial_admin_bootstraps')->insert(['id' => 1, 'user_id' => $user->id, 'created_at' => now()]);
            }, 3);
        } catch (Throwable) {
            $this->error('Initial administrator creation was refused; no completed bootstrap.');
            return self::FAILURE;
        } finally {
            unset($password, $confirmation);
        }

        $this->info('Initial administrator created. Sign in and complete MFA enrollment.');
        return self::SUCCESS;
    }
}
