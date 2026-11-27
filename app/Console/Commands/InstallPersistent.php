<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Deployment\PersistentInstaller;
use Illuminate\Console\Command;
use Throwable;

final class InstallPersistent extends Command
{
    protected $signature = 'deploy:persistent {manifest : Private JSON target manifest} {credentials : Private JSON role credentials}';

    protected $description = 'Install or forward-upgrade one explicitly authorized persistent PostgreSQL 16 target';

    public function handle(PersistentInstaller $installer): int
    {
        try {
            $inputs = [];
            foreach (['manifest', 'credentials'] as $name) {
                $path = $this->argument($name);
                if (! is_file($path) || is_link($path) || (PHP_OS_FAMILY !== 'Windows' && (fileperms($path) & 0077) !== 0)) {
                    throw new \RuntimeException('Deployment inputs must be private regular files.');
                }
                $inputs[$name] = json_decode(file_get_contents($path), true, 32, JSON_THROW_ON_ERROR);
            }
            $this->line(json_encode($installer->install($inputs['manifest'], $inputs['credentials']), JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        } catch (Throwable $e) {
            // Database diagnostics may include password-bearing SQL; never print them.
            $this->error('Persistent installation refused or rolled back. Inspect with a privileged operator; no credential diagnostics are emitted.');
            $this->line('Phase: '.$installer->phase.'; error code: '.(string) $e->getCode());
            if (get_class($e) === \RuntimeException::class) {
                $this->error($e->getMessage());
            }

            return self::FAILURE;
        }
    }
}
