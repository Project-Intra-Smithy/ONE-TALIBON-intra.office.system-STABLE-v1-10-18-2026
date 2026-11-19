<?php

declare(strict_types=1);

namespace App\Services\Custody\Broker;

use App\Domain\Custody\Exceptions\CustodyViolationException;

final class BrokerRootAttestation
{
    public const BACKEND_KIND = 'local_broker_v1';

    /**
     * Collect every Laravel storage/public/symlink root that the isolated K3 broker
     * root MUST remain strictly disjoint from.
     *
     * @return list<string>
     */
    public static function collectApplicationDisallowedRoots(): array
    {
        $roots = [];

        if (function_exists('config')) {
            $disks = config('filesystems.disks', []);
            if (is_array($disks)) {
                foreach ($disks as $disk) {
                    if (is_array($disk) && isset($disk['root']) && is_string($disk['root']) && trim($disk['root']) !== '') {
                        $roots[] = $disk['root'];
                    }
                }
            }

            $links = config('filesystems.links', []);
            if (is_array($links)) {
                foreach ($links as $linkPath => $targetPath) {
                    if (is_string($linkPath) && trim($linkPath) !== '') {
                        $roots[] = $linkPath;
                    }
                    if (is_string($targetPath) && trim($targetPath) !== '') {
                        $roots[] = $targetPath;
                    }
                }
            }
        }

        if (function_exists('storage_path')) {
            $roots[] = storage_path();
        }

        if (function_exists('public_path')) {
            $roots[] = public_path();
        }

        return array_values(array_unique(array_filter(
            $roots,
            static fn (string $path): bool => trim($path) !== '',
        )));
    }

    /**
     * Canonicalize the broker root without following symlinks and assert strict
     * physical disjointness from all Laravel Storage disks, storage_path(),
     * public_path(), and filesystems.links.
     *
     * @param  ?list<string>  $disallowedRoots
     * @return array{backend_kind: string, provider_identity: string, root_claim: string, namespace_id: string, canonical_root: string}
     */
    public function attest(
        string $brokerRoot,
        string $namespaceId,
        string $expectedBackendKind = self::BACKEND_KIND,
        ?array $disallowedRoots = null,
    ): array {
        if ($expectedBackendKind !== self::BACKEND_KIND) {
            throw new CustodyViolationException("Unsupported broker backend_kind [{$expectedBackendKind}].");
        }

        if (preg_match('/\A[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\z/', $namespaceId) !== 1) {
            throw new CustodyViolationException('Broker root attestation requires a valid lowercase UUID namespace_id.');
        }

        $canonicalRoot = $this->canonicalizeWithoutSymlinks($brokerRoot);
        $forbidden = $disallowedRoots ?? self::collectApplicationDisallowedRoots();

        $this->assertDisjointFromAll($canonicalRoot, $forbidden);

        return [
            'backend_kind' => self::BACKEND_KIND,
            'provider_identity' => self::BACKEND_KIND.':'.hash('sha256', $canonicalRoot),
            'root_claim' => $canonicalRoot,
            'namespace_id' => $namespaceId,
            'canonical_root' => $canonicalRoot,
        ];
    }

    public function canonicalizeWithoutSymlinks(string $rawPath): string
    {
        if ($rawPath === '' || trim($rawPath) === '') {
            throw new CustodyViolationException('Isolated broker root path is unset or empty.');
        }

        if (preg_match('/[\x00-\x1F\x7F]/', $rawPath) === 1) {
            throw new CustodyViolationException('Broker root path contains NUL or control characters.');
        }

        $isWindows = DIRECTORY_SEPARATOR === '\\';

        if ($isWindows) {
            if (str_starts_with($rawPath, '\\\\') || str_starts_with($rawPath, '//')) {
                throw new CustodyViolationException('UNC network paths are prohibited for the local custody broker root.');
            }
            if (preg_match('/\A[A-Za-z]:[\\\\\/]/', $rawPath) !== 1) {
                throw new CustodyViolationException('Broker root path must be an absolute local path.');
            }
        } else {
            if (! str_starts_with($rawPath, '/')) {
                throw new CustodyViolationException('Broker root path must be an absolute POSIX path.');
            }
        }

        $normalized = str_replace('\\', '/', $rawPath);
        $trimmed = rtrim($normalized, '/');

        if ($isWindows) {
            if (preg_match('/\A([A-Za-z]:)(?:\/(.*))?\z/', $trimmed, $m) !== 1) {
                throw new CustodyViolationException('Invalid Windows absolute broker root path.');
            }
            $prefix = strtoupper($m[1]);
            $remainder = $m[2] ?? '';
            $segments = $remainder === '' ? [] : explode('/', $remainder);
        } else {
            $prefix = '';
            $remainder = ltrim($trimmed, '/');
            $segments = $remainder === '' ? [] : explode('/', $remainder);
        }

        if ($segments === []) {
            throw new CustodyViolationException('Filesystem root directory cannot be used as the isolated broker root.');
        }

        foreach ($segments as $segment) {
            if ($segment === '' || $segment === '.' || $segment === '..') {
                throw new CustodyViolationException('Broker root path must not contain empty, dot, or traversal segments.');
            }
        }

        // Walk every path component from root down to leaf rejecting any symlink/junction.
        $current = $isWindows ? $prefix : '';
        foreach ($segments as $segment) {
            $current .= '/'.$segment;
            $probe = $isWindows ? str_replace('/', '\\', $current) : $current;
            clearstatcache(true, $probe);

            if (is_link($probe)) {
                throw new CustodyViolationException("Broker root path component [{$probe}] is a symlink or reparse point.");
            }
        }

        $targetPath = $isWindows ? str_replace('/', '\\', $current) : $current;
        clearstatcache(true, $targetPath);

        if (! file_exists($targetPath) || ! is_dir($targetPath) || is_link($targetPath)) {
            throw new CustodyViolationException("Broker root [{$targetPath}] does not exist or is not a real directory.");
        }

        if (! is_readable($targetPath) || ! is_writable($targetPath)) {
            throw new CustodyViolationException("Broker root [{$targetPath}] is not readable and writable by the broker process.");
        }

        $real = realpath($targetPath);
        if ($real === false) {
            throw new CustodyViolationException("Failed to resolve canonical realpath for broker root [{$targetPath}].");
        }

        $normalizedTarget = $this->normalizeComparable($targetPath, $isWindows);
        $normalizedReal = $this->normalizeComparable($real, $isWindows);

        if ($normalizedTarget !== $normalizedReal) {
            throw new CustodyViolationException(
                "Broker root [{$targetPath}] resolved through an alias or symlink to [{$real}]."
            );
        }

        return $this->normalizeCanonicalDisplay($real, $isWindows);
    }

    /**
     * @param  list<string>  $disallowedRoots
     */
    private function assertDisjointFromAll(string $canonicalBrokerRoot, array $disallowedRoots): void
    {
        $isWindows = DIRECTORY_SEPARATOR === '\\';
        $brokerComp = $this->normalizeComparable($canonicalBrokerRoot, $isWindows);

        foreach ($disallowedRoots as $rawDisallowed) {
            $candidates = $this->expandComparableCandidates($rawDisallowed, $isWindows);

            foreach ($candidates as $disallowedComp) {
                if ($brokerComp === $disallowedComp
                    || str_starts_with($brokerComp.'/', $disallowedComp.'/')
                    || str_starts_with($disallowedComp.'/', $brokerComp.'/')) {
                    throw new CustodyViolationException(
                        "Broker root [{$canonicalBrokerRoot}] overlaps forbidden application storage root [{$rawDisallowed}]."
                    );
                }
            }
        }
    }

    /**
     * @return list<string>
     */
    private function expandComparableCandidates(string $rawPath, bool $isWindows): array
    {
        $trimmed = trim($rawPath);
        if ($trimmed === '') {
            return [];
        }

        $candidates = [];
        $lexical = $this->lexicallyNormalize($trimmed, $isWindows);
        if ($lexical !== '') {
            $candidates[] = $this->normalizeComparable($lexical, $isWindows);
        }

        clearstatcache(true, $trimmed);
        $real = @realpath($trimmed);
        if (is_string($real) && $real !== '') {
            $candidates[] = $this->normalizeComparable($real, $isWindows);
        }

        return array_values(array_unique($candidates));
    }

    private function lexicallyNormalize(string $path, bool $isWindows): string
    {
        $slash = str_replace('\\', '/', $path);
        $prefix = '';
        $body = $slash;

        if ($isWindows && preg_match('/\A([A-Za-z]:)(.*)\z/', $slash, $m) === 1) {
            $prefix = strtoupper($m[1]);
            $body = $m[2];
        } elseif (str_starts_with($slash, '/')) {
            $prefix = '/';
            $body = substr($slash, 1);
        }

        $parts = [];
        foreach (explode('/', $body) as $part) {
            if ($part === '' || $part === '.') {
                continue;
            }
            if ($part === '..') {
                array_pop($parts);

                continue;
            }
            $parts[] = $part;
        }

        if ($prefix === '/') {
            return '/'.implode('/', $parts);
        }

        if ($prefix !== '') {
            return $prefix.'/'.implode('/', $parts);
        }

        return implode('/', $parts);
    }

    private function normalizeComparable(string $path, bool $isWindows): string
    {
        $slash = rtrim(str_replace('\\', '/', $path), '/');

        return $isWindows ? strtolower($slash) : $slash;
    }

    private function normalizeCanonicalDisplay(string $realPath, bool $isWindows): string
    {
        $slash = rtrim(str_replace('\\', '/', $realPath), '/');
        if ($isWindows && strlen($slash) >= 2 && $slash[1] === ':') {
            $slash = strtoupper($slash[0]).substr($slash, 1);
        }

        return $slash;
    }
}
