<?php

declare(strict_types=1);

namespace App\Deployment;

use Illuminate\Database\Events\QueryExecuted;
use Illuminate\Support\Facades\DB;
use RuntimeException;

final class CredentialBoundary
{
    public static function verify(): void
    {
        // No automatic changes to monitoring. The operator supplies a dedicated safe bootstrap session.
        $required = ['log_statement' => 'none', 'log_min_duration_statement' => '-1', 'log_min_duration_sample' => '-1',
            'log_transaction_sample_rate' => '0', 'log_duration' => 'off', 'log_min_error_statement' => 'panic',
            'log_parameter_max_length' => '0', 'log_parameter_max_length_on_error' => '0',
            'debug_print_parse' => 'off', 'debug_print_rewritten' => 'off', 'debug_print_plan' => 'off',
            'shared_preload_libraries' => '', 'session_preload_libraries' => '', 'local_preload_libraries' => ''];
        foreach ($required as $name => $expected) {
            if ((string) DB::selectOne('SELECT current_setting(?) AS value', [$name])->value !== $expected) {
                throw new RuntimeException('Unsafe or unverifiable credential logging boundary.');
            }
        }
        foreach (['pgaudit.log', 'auto_explain.log_min_duration'] as $name) {
            if (DB::selectOne('SELECT current_setting(?,true) AS value', [$name])->value !== null) {
                throw new RuntimeException('Unsupported SQL audit/instrumentation boundary.');
            }
        }
        if (DB::selectOne("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname<>'plpgsql') OR EXISTS(SELECT 1 FROM pg_event_trigger) AS unsafe")->unsafe
            || DB::connection()->logging() || DB::connection()->getEventDispatcher()?->hasListeners(QueryExecuted::class)) {
            throw new RuntimeException('Unsupported deployment instrumentation.');
        }
        $host = config('database.connections.'.config('database.default').'.host');
        if (str_starts_with($host, '/')) {
            $stat = @stat($host);
            if (! $stat || is_link($host) || ($stat['mode'] & 0022) !== 0
                || ! in_array($stat['uid'], [0, posix_geteuid()], true)) {
                throw new RuntimeException('Untrusted local database socket directory.');
            }
        }
        $ssl = DB::selectOne('SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()');
        if (! str_starts_with($host, '/') && (! $ssl?->ssl
            || config('database.connections.'.config('database.default').'.sslmode') !== 'verify-full'
            || ! is_file((string) config('database.connections.'.config('database.default').'.sslrootcert')))) {
            throw new RuntimeException('Credential provisioning requires a local Unix socket or verified TLS.');
        }
    }

    public static function scram(string $password): string
    {
        // An ASCII high-entropy credential has no ambiguous SASLprep normalization.
        if (! preg_match('/^[A-Za-z0-9_-]{32,128}$/D', $password)) {
            throw new RuntimeException('Unsupported deployment credential encoding.');
        }
        $salt = random_bytes(16);
        $salted = hash_pbkdf2('sha256', $password, $salt, 4096, 32, true);
        $client = hash_hmac('sha256', 'Client Key', $salted, true);
        $stored = hash('sha256', $client, true);
        $server = hash_hmac('sha256', 'Server Key', $salted, true);

        return 'SCRAM-SHA-256$4096:'.base64_encode($salt).'$'.base64_encode($stored).':'.base64_encode($server);
    }

    public static function pinSession(): void
    {
        self::verify();
        foreach (['log_statement' => 'none', 'log_min_duration_statement' => '-1', 'log_min_duration_sample' => '-1',
            'log_transaction_sample_rate' => '0', 'log_duration' => 'off', 'log_min_error_statement' => 'panic',
            'log_parameter_max_length' => '0', 'log_parameter_max_length_on_error' => '0',
            'debug_print_parse' => 'off', 'debug_print_rewritten' => 'off', 'debug_print_plan' => 'off'] as $name => $value) {
            DB::selectOne('SELECT set_config(?,?,true)', [$name, $value]);
        }
    }
}
