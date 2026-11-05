<?php

namespace App\PlanCustody;

use App\PlanCustody\Contracts\ImmutableObjectStore;
use App\PlanCustody\Exceptions\CustodyViolation;
use App\PlanCustody\Exceptions\ObjectCollision;
use Illuminate\Filesystem\FilesystemAdapter;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Local executable contract only. Atomic create prevents overwrite on this
 * adapter, but it is not evidence of object lock/versioning in production.
 */
final class LocalImmutableObjectStore implements ImmutableObjectStore
{
    private function disk(): FilesystemAdapter
    {
        $disk = (string) config('plan_custody.disk');
        $approvedDisk = 'plan_custody';
        $configuration = config("filesystems.disks.{$approvedDisk}");
        $trustedRoot = $this->canonicalPath(storage_path('app/plan-custody-quarantine'));

        if ($disk !== $approvedDisk
            || ! is_array($configuration)
            || ($configuration['driver'] ?? null) !== 'local'
            || ($configuration['visibility'] ?? null) !== 'private'
            || ($configuration['serve'] ?? null) !== false
            || ($configuration['throw'] ?? null) !== true
            || isset($configuration['url'])
            || ! is_string($configuration['root'] ?? null)
            || ! $this->samePath($this->canonicalPath($configuration['root']), $trustedRoot)
            || $this->isPubliclyExposed($trustedRoot)
            || $this->hasOverlappingDiskAlias($trustedRoot, $approvedDisk)) {
            throw new CustodyViolation('The isolated private custody disk configuration is not approved.');
        }

        $adapter = Storage::disk($approvedDisk);
        if (! $this->samePath($this->canonicalPath($adapter->path('')), $trustedRoot)) {
            throw new CustodyViolation('The isolated private custody disk configuration is not approved.');
        }

        return $adapter;
    }

    public function putIfAbsent(string $locator, $stream): void
    {
        $this->assertLocator($locator);
        $disk = $this->disk();
        $path = $this->objectPath($disk, $locator);
        $this->createObjectDirectory($disk, $locator);
        $path = $this->objectPath($disk, $locator);

        $destination = @fopen($path, 'xb');
        if ($destination === false) {
            if (is_file($path)) {
                throw new ObjectCollision('The server-selected custody locator already exists.');
            }
            throw new RuntimeException('Unable to create the private custody object.');
        }

        try {
            if (! is_resource($stream) || stream_copy_to_stream($stream, $destination) === false) {
                throw new RuntimeException('Unable to stream the private custody object.');
            }
            fflush($destination);
            @chmod($path, 0600);
        } catch (\Throwable $exception) {
            fclose($destination);
            $safeCleanupPath = $this->objectPath($disk, $locator);
            if (is_file($safeCleanupPath) && ! @unlink($safeCleanupPath)) {
                throw new RuntimeException('Unable to remove the incomplete private custody object.', 0, $exception);
            }
            throw $exception;
        }

        fclose($destination);
    }

    public function openForVerification(string $locator)
    {
        $this->assertLocator($locator);
        $path = $this->objectPath($this->disk(), $locator);
        $stream = @fopen($path, 'rb');
        if (! is_resource($stream)) {
            throw new CustodyViolation('The staged custody object cannot be independently verified.');
        }

        return $stream;
    }

    public function deleteUncommitted(string $locator): void
    {
        $this->assertLocator($locator);
        $path = $this->objectPath($this->disk(), $locator);
        if (is_file($path) && ! @unlink($path)) {
            throw new RuntimeException('Unable to remove the uncommitted custody object.');
        }
    }

    public function exists(string $locator): bool
    {
        $this->assertLocator($locator);

        return is_file($this->objectPath($this->disk(), $locator));
    }

    private function objectPath(FilesystemAdapter $disk, string $locator): string
    {
        $trustedRoot = $this->canonicalPath(storage_path('app/plan-custody-quarantine'));
        $actualRoot = $this->canonicalPath($disk->path(''));
        $actualPath = $this->canonicalPath($disk->path($locator), true);
        $expectedPath = $trustedRoot.DIRECTORY_SEPARATOR.str_replace('/', DIRECTORY_SEPARATOR, $locator);

        if (! $this->samePath($actualRoot, $trustedRoot)
            || ! $this->samePath($actualPath, $expectedPath)
            || ! $this->isStrictDescendant($actualPath, $trustedRoot)) {
            throw new CustodyViolation('The private custody object path is not approved.');
        }

        return $actualPath;
    }

    private function createObjectDirectory(FilesystemAdapter $disk, string $locator): void
    {
        $root = $this->canonicalPath($disk->path(''));
        $segments = explode('/', dirname($locator));
        $current = $root;

        foreach ($segments as $segment) {
            $current .= DIRECTORY_SEPARATOR.$segment;
            if (is_link($current) || (file_exists($current) && ! is_dir($current))) {
                throw new CustodyViolation('The private custody object path is not approved.');
            }
            if (! is_dir($current) && ! @mkdir($current, 0700) && ! is_dir($current)) {
                throw new RuntimeException('Unable to create the private custody directory.');
            }
            if (! $this->samePath($this->canonicalPath($current), $current)
                || ! $this->isStrictDescendant($current, $root)) {
                throw new CustodyViolation('The private custody object path is not approved.');
            }
        }
    }

    private function isStrictDescendant(string $path, string $root): bool
    {
        $prefix = rtrim($root, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        return DIRECTORY_SEPARATOR === '\\'
            ? str_starts_with(strtolower($path), strtolower($prefix))
            : str_starts_with($path, $prefix);
    }

    private function assertLocator(string $locator): void
    {
        if (preg_match('#^quarantine/[0-9a-f]{2}/[0-9a-f-]{36}\.pdf$#D', $locator) !== 1
            || str_contains($locator, '..')) {
            throw new CustodyViolation('The custody locator is invalid.');
        }
    }

    private function samePath(string $left, string $right): bool
    {
        if ($left === '' || $right === '') {
            return false;
        }

        return DIRECTORY_SEPARATOR === '\\'
            ? strcasecmp($left, $right) === 0
            : hash_equals($left, $right);
    }

    private function isPubliclyExposed(string $root): bool
    {
        $publicRoot = $this->canonicalPath(public_path());
        if ($this->pathsOverlap($root, $publicRoot)) {
            return true;
        }

        foreach ((array) config('filesystems.links', []) as $link => $target) {
            if (! is_string($link) || ! is_string($target)) {
                return true;
            }
            if ($this->pathsOverlap($root, $this->canonicalPath($link))
                || $this->pathsOverlap($root, $this->canonicalPath($target))) {
                return true;
            }
        }

        return false;
    }

    private function hasOverlappingDiskAlias(string $trustedRoot, string $approvedDisk): bool
    {
        foreach ((array) config('filesystems.disks', []) as $name => $configuration) {
            if ($name === $approvedDisk) {
                continue;
            }
            if (! is_array($configuration)) {
                return true;
            }
            $root = $configuration['root'] ?? null;
            if ($root === null) {
                if (($configuration['driver'] ?? null) === 'local') {
                    return true;
                }

                continue;
            }
            if (! is_string($root) || $this->pathsOverlap($trustedRoot, $this->canonicalPath($root))) {
                return true;
            }
        }

        return false;
    }

    private function pathsOverlap(string $left, string $right): bool
    {
        if ($this->samePath($left, $right)) {
            return true;
        }

        $leftPrefix = rtrim($left, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;
        $rightPrefix = rtrim($right, DIRECTORY_SEPARATOR).DIRECTORY_SEPARATOR;

        return DIRECTORY_SEPARATOR === '\\'
            ? str_starts_with(strtolower($left), strtolower($rightPrefix))
                || str_starts_with(strtolower($right), strtolower($leftPrefix))
            : str_starts_with($left, $rightPrefix) || str_starts_with($right, $leftPrefix);
    }

    private function canonicalPath(string $path, bool $allowFile = false): string
    {
        if ($path === '' || str_contains($path, "\0") || ! $this->isAbsolutePath($path)) {
            throw new CustodyViolation('The isolated private custody path is invalid.');
        }

        $normalized = rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $path), DIRECTORY_SEPARATOR);
        $parts = preg_split('#[\\\\/]+#', $normalized);
        if ($parts === false || in_array('.', $parts, true) || in_array('..', $parts, true)) {
            throw new CustodyViolation('The isolated private custody path is invalid.');
        }

        $current = $normalized;
        $missing = [];
        while (! file_exists($current) && ! is_link($current)) {
            $parent = dirname($current);
            if ($parent === $current) {
                throw new CustodyViolation('The isolated private custody path cannot be resolved.');
            }
            array_unshift($missing, basename($current));
            $current = $parent;
        }

        if ($this->hasSymlinkComponent($current)) {
            throw new CustodyViolation('The isolated private custody path cannot use a symbolic alias.');
        }
        $canonical = realpath($current);
        if ($canonical === false
            || (file_exists($normalized) && ($allowFile ? ! is_file($normalized) : ! is_dir($normalized)))) {
            throw new CustodyViolation('The isolated private custody path cannot be resolved.');
        }

        foreach ($missing as $segment) {
            $canonical .= DIRECTORY_SEPARATOR.$segment;
        }

        return rtrim(str_replace(['/', '\\'], DIRECTORY_SEPARATOR, $canonical), DIRECTORY_SEPARATOR);
    }

    private function hasSymlinkComponent(string $path): bool
    {
        $current = $path;
        while ($current !== dirname($current)) {
            if (is_link($current)) {
                return true;
            }
            $current = dirname($current);
        }

        return is_link($current);
    }

    private function isAbsolutePath(string $path): bool
    {
        return DIRECTORY_SEPARATOR === '\\'
            ? preg_match('#^(?:[A-Za-z]:[\\\\/]|\\\\\\\\[^\\\\/]+[\\\\/][^\\\\/]+)#D', $path) === 1
            : str_starts_with($path, '/');
    }
}
