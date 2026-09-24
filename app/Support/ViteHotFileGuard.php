<?php

namespace App\Support;

final class ViteHotFileGuard
{
    public static function removeIfStale(string $hotFile, float $timeoutSeconds = 0.15): bool
    {
        if (! is_file($hotFile)) {
            return false;
        }

        $url = trim((string) @file_get_contents($hotFile));

        if ($url !== '' && self::isReachable($url, $timeoutSeconds)) {
            return false;
        }

        @unlink($hotFile);

        return true;
    }

    private static function isReachable(string $url, float $timeoutSeconds): bool
    {
        $parts = parse_url($url);

        if (! is_array($parts) || empty($parts['host'])) {
            return false;
        }

        $scheme = strtolower((string) ($parts['scheme'] ?? 'http'));
        if (! in_array($scheme, ['http', 'https'], true)) {
            return false;
        }

        $host = (string) $parts['host'];
        $port = (int) ($parts['port'] ?? ($scheme === 'https' ? 443 : 80));
        $socketHost = str_contains($host, ':') ? "[$host]" : $host;
        $target = sprintf('tcp://%s:%d', $socketHost, $port);

        $socket = @stream_socket_client(
            $target,
            $errorCode,
            $errorMessage,
            $timeoutSeconds,
            STREAM_CLIENT_CONNECT,
        );

        if (! is_resource($socket)) {
            return false;
        }

        fclose($socket);

        return true;
    }
}
