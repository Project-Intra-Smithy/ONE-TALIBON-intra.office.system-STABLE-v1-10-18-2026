<?php

namespace Tests\Feature\PrototypeMessaging;

use App\Models\PrototypeMessage;
use App\Prototype\Messaging\PrototypeMessagingChannels;
use Database\Seeders\MunicipalityStructureSeeder;
use Database\Seeders\PrototypeMessagingDemoSeeder;
use Database\Seeders\WorkforceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class PrototypeMessagingDemoSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_demo_seeder_populates_every_channel_once_with_real_featured_users(): void
    {
        $this->seed(MunicipalityStructureSeeder::class);
        $this->seed(WorkforceDemoSeeder::class);
        $this->seed(PrototypeMessagingDemoSeeder::class);

        foreach (PrototypeMessagingChannels::all() as $channel) {
            $this->assertGreaterThanOrEqual(
                3,
                PrototypeMessage::query()->where('channel', $channel)->count(),
                "Expected seeded messages for {$channel}.",
            );
        }

        $count = PrototypeMessage::query()->count();
        $this->seed(PrototypeMessagingDemoSeeder::class);

        $this->assertSame($count, PrototypeMessage::query()->count());
        $this->assertSame(18, $count);
        $this->assertSame(0, PrototypeMessage::query()->whereDoesntHave('sender')->count());
    }
}
