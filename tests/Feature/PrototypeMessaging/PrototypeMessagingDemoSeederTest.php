<?php

namespace Tests\Feature\PrototypeMessaging;

use App\Models\Message;
use App\Messaging\MessagingChannels;
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

        foreach (MessagingChannels::all() as $channel) {
            $this->assertGreaterThanOrEqual(
                3,
                Message::query()->where('channel', $channel)->count(),
                "Expected seeded messages for {$channel}.",
            );
        }

        $count = Message::query()->count();
        $this->seed(PrototypeMessagingDemoSeeder::class);

        $this->assertSame($count, Message::query()->count());
        $this->assertSame(18, $count);
        $this->assertSame(0, Message::query()->whereDoesntHave('sender')->count());
    }
}
