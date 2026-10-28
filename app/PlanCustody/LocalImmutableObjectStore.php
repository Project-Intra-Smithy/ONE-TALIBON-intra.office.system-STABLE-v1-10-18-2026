<?php

namespace App\PlanCustody;

use App\PlanCustody\Contracts\ImmutableObjectStore;
use App\PlanCustody\Exceptions\CustodyViolation;
use App\PlanCustody\Exceptions\ObjectCollision;
use Illuminate\Support\Facades\Storage;
use RuntimeException;

/**
 * Local executable contract only. Atomic create prevents overwrite on this
 * adapter, but it is not evidence of object lock/versioning in production.
 */
final class LocalImmutableObjectStore implements ImmutableObjectStore
{
    private function disk(): string
    {
        return (string) config('plan_custody.disk', 'plan_custody');
    }

    public function putIfAbsent(string $locator, $stream): void
    {
        $this->assertLocator($locator);
        $path = Storage::disk($this->disk())->path($locator);
        $directory = dirname($path);

        if (! is_dir($directory) && ! mkdir($directory, 0700, true) && ! is_dir($directory)) {
            throw new RuntimeException('Unable to create the private custody directory.');
        }

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
            @unlink($path);
            throw $exception;
        }

        fclose($destination);
    }

    public function openForVerification(string $locator)
    {
        $this->assertLocator($locator);
        $stream = Storage::disk($this->disk())->readStream($locator);
        if (! is_resource($stream)) {
            throw new CustodyViolation('The staged custody object cannot be independently verified.');
        }

        return $stream;
    }

    public function deleteUncommitted(string $locator): void
    {
        $this->assertLocator($locator);
        if (Storage::disk($this->disk())->exists($locator)
            && ! Storage::disk($this->disk())->delete($locator)) {
            throw new RuntimeException('Unable to remove the uncommitted custody object.');
        }
    }

    public function exists(string $locator): bool
    {
        $this->assertLocator($locator);

        return Storage::disk($this->disk())->exists($locator);
    }

    private function assertLocator(string $locator): void
    {
        if (preg_match('#^quarantine/[0-9a-f]{2}/[0-9a-f-]{36}\.pdf$#D', $locator) !== 1
            || str_contains($locator, '..')) {
            throw new CustodyViolation('The custody locator is invalid.');
        }
    }
}
