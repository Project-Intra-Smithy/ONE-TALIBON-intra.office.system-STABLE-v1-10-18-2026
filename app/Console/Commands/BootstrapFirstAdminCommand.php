<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Offline, one-use provisioning. There is deliberately no public registration
 * endpoint, shared default password, demo seeder, or role escalation route.
 */
final class BootstrapFirstAdminCommand extends Command
{
    protected $signature = 'talibon:bootstrap-first-admin
        {--email= : Verified institutional email of the initial administrator}
        {--name= : Full name of the initial administrator}
        {--employee-number= : Existing authorized employee identifier}
        {--department-code= : Existing active office code}
        {--position= : Official position title}';

    protected $description = 'Interactively bootstrap the first administrator only when no User accounts exist';

    public function handle(): int
    {
        if (! $this->input->isInteractive()) {
            $this->error('Bootstrap requires an interactive terminal for a private password prompt.');

            return self::FAILURE;
        }

        if (User::query()->exists()) {
            $this->error('Users already exist. This one-time bootstrap is permanently unavailable.');

            return self::FAILURE;
        }

        $email = strtolower(trim((string) $this->option('email')));
        $name = trim((string) $this->option('name'));
        $employeeNumber = trim((string) $this->option('employee-number'));
        $code = trim((string) $this->option('department-code'));
        $position = trim((string) $this->option('position'));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255
            || $name === '' || mb_strlen($name) > 255
            || $employeeNumber === '' || strlen($employeeNumber) > 64
            || $code === '' || strlen($code) > 32
            || $position === '' || mb_strlen($position) > 255) {
            $this->error('Provide valid email, name, employee number, existing office code and position.');

            return self::FAILURE;
        }

        $office = Department::query()->where('code', $code)->where('is_active', true)->first();
        if ($office === null) {
            $this->error('The department code is not an existing active office. No office is created automatically.');

            return self::FAILURE;
        }

        $password = (string) $this->secret('New administrator password (minimum 16 characters)');
        $confirm = (string) $this->secret('Confirm the password');

        if (strlen($password) < 16 || strlen($password) > 128
            || ! hash_equals($password, $confirm)) {
            $this->error('Password must be 16–128 characters and match confirmation.');

            return self::FAILURE;
        }

        if (! $this->confirm('Create ONE initial system administrator in '.$code.'?', false)) {
            $this->warn('Bootstrap cancelled without mutation.');

            return self::FAILURE;
        }

        try {
            DB::transaction(function () use ($email, $name, $employeeNumber, $office, $position, $password): void {
                // PostgreSQL table lock serializes competing initial bootstrap
                // commands; the second caller sees the first inserted user.
                if (DB::connection()->getDriverName() !== 'pgsql') {
                    throw new \RuntimeException('First-user bootstrap requires the approved PostgreSQL connection.');
                }

                DB::statement('LOCK TABLE users IN EXCLUSIVE MODE');
                if (User::query()->exists()) {
                    throw new \RuntimeException('An account was created concurrently; bootstrap refused.');
                }
                if (Employee::query()->where('employee_number', $employeeNumber)->exists()) {
                    throw new \RuntimeException('Employee number is already registered.');
                }

                $user = User::query()->create([
                    'name' => $name,
                    'email' => $email,
                    'password' => $password, // User password cast hashes it.
                    'role' => 'system_admin',
                    'is_active' => true,
                ]);

                Employee::query()->create([
                    'user_id' => $user->id,
                    'employee_number' => $employeeNumber,
                    'full_name' => $name,
                    'work_email' => $email,
                    'department_id' => $office->id,
                    'position_title' => $position,
                    'employment_status' => 'active',
                ]);
            });
        } catch (Throwable $error) {
            $this->error('Bootstrap failed without creating an administrator: '.$error->getMessage());

            return self::FAILURE;
        } finally {
            unset($password, $confirm);
        }

        $this->info('Initial administrator created. Sign in through /login; privileged MFA enrollment is required.');
        $this->warn('This command never authorizes other accounts and cannot be rerun after any User exists.');

        return self::SUCCESS;
    }
}
