<?php

namespace Tests\Feature\Support;

use App\Support\ViteHotFileGuard;
use Tests\TestCase;

final class ViteHotFileGuardTest extends TestCase
{
    public function test_stale_hot_file_is_removed_when_dev_server_is_unreachable(): void
    {
        $hotFile = tempnam(sys_get_temp_dir(), 'vite-hot-');
        $this->assertNotFalse($hotFile);
        file_put_contents($hotFile, 'http://127.0.0.1:65534');

        $removed = ViteHotFileGuard::removeIfStale($hotFile, 0.01);

        $this->assertTrue($removed);
        $this->assertFileDoesNotExist($hotFile);
    }

    public function test_missing_hot_file_is_a_noop(): void
    {
        $hotFile = sys_get_temp_dir().DIRECTORY_SEPARATOR.'missing-vite-hot-'.uniqid('', true);

        $this->assertFalse(ViteHotFileGuard::removeIfStale($hotFile, 0.01));
        $this->assertFileDoesNotExist($hotFile);
    }
}
