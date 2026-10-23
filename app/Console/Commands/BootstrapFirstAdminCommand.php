<?php

namespace App\Console\Commands;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Offline singleton; no bootstrap HTTP endpoint and no default credential.
 * The irreversible marker persists even if the initial User is later removed.
 */
final class BootstrapFirstAdminCommand extends Command
{
    protected $signature = 'talibon:bootstrap-first-admin
        {--email= : Verified institutional email of the initial administrator}
        {--name= : Full name of the initial administrator}
        {--department-code= : Existing active office code}
        {--position= : Official position title}';

    protected $description = 'Create the first system administrator only when the database is empty';

    public function handle(): int
    {
        if (DB::connection()->getDriverName() !== 'pgsql') {
            $this->error('Bootstrap is restricted to the approved PostgreSQL engine.');
            return self::FAILURE;
        }

        if (User::query()->exists() || DB::table('initial_admin_bootstraps')->exists()) {
            $this->error('The database is already provisioned; bootstrap is disabled.');
            return self::FAILURE;
        }

        $email = mb_strtolower(trim((string) $this->option('email')));
        $name = trim((string) $this->option('name'));
        $code = trim((string) $this->option('department-code'));
        $position = trim((string) $this->option('position'));

        if (! filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 255
            || $name === '' || mb_strlen($name) > 255
            || $code === '' || strlen($code) > 32
            || $position === '' || mb_strlen($position) > 255) {
            $this->error('Valid email, name, office code, and position are required.');
            return self::FAILURE;
        }

        $office = Department::query()->where('code', $code)->where('is_active', true)->first();
        if (! $office) {
            $this->error('An existing active department is required.');
            return self::FAILURE;
        }

        // Artisan test runners inject answers without an interactive TTY; a
        // real noninteractive CLI cannot receive a secret and must be rejected.
        if (! $this->input->isInteractive() && ! app()->environment('testing')) {
            $this->error('An interactive private password prompt is mandatory.');
            return self::FAILURE;
        }

        $password = (string) $this->secret('New administrator password (minimum 16 characters)');
        $confirmation = (string) $this->secret('Confirm the password');
        if (strlen($password) < 16 || strlen($password) > 128 || ! hash_equals($password, $confirmation)) {
            $this->error('Password must contain 16–128 characters and match its confirmation.');
            return self::FAILURE;
        }

        if (! $this->confirm('Create ONE initial system administrator in '.$code.'?', false)) {
            $this->warn('No account created.');
            return self::FAILURE;
        }

        try {
            DB::transaction(function () use ($email, $name, $code, $position, $password): void {
                // Lock orders every competing bootstrap before its zero-user check.
                DB::statement('LOCK TABLE users IN EXCLUSIVE MODE');
                DB::statement('LOCK TABLE initial_admin_bootstraps IN EXCLUSIVE MODE');

                if (User::query()->exists() || DB::table('initial_admin_bootstraps')->exists()) {
                    throw new \RuntimeException('Database was already provisioned.');
                }

                $department = Department::query()->where('code', $code)
                    ->where('is_active', true)->lockForUpdate()->first();
                if (! $department) {
                    throw new \RuntimeException('Department or employee identifier is no longer eligible.');
                }

                $user = User::query()->create([
                    'name' => $name, 'email' => $email,
                    'password' => $password, 'role' => 'system_admin', 'is_active' => true,
                ]);
                Employee::query()->create([
                    'user_id' => $user->id,
                    'full_name' => $name, 'work_email' => $email,
                    'department_id' => $department->id, 'position_title' => $position,
                    'employment_status' => 'active',
                ]);
                DB::table('initial_admin_bootstraps')->insert(['id' => 1, 'user_id' => $user->id, 'created_at' => now()]);
            });
        } catch (Throwable $exception) {
            // Do not echo DB details that can expose the operator's inputs.
            $this->error('Initial administrator creation was refused; no completed bootstrap.');
            return self::FAILURE;
        } finally {
            unset($password, $confirmation);
        }

        $this->info('Initial administrator created. Use /login and complete privileged MFA enrollment.');
        return self::SUCCESS;
    }
}
