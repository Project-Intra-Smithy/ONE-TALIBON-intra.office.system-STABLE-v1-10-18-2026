<?php

namespace Database\Seeders;

use App\Models\Message;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

final class PrototypeMessagingDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Message::query()->exists()) {
            return;
        }

        $users = User::query()
            ->whereIn('email', [
                'mayor@talibon.demo',
                'engineering@talibon.demo',
                'budget@talibon.demo',
                'hr@talibon.demo',
                'legislative@talibon.demo',
                'employee@talibon.demo',
            ])
            ->get()
            ->keyBy('email');

        foreach ([
            ["General", 'engineering@talibon.demo', 'Engineering has uploaded the updated accomplishment sheet for the project monitoring coordination meeting.', 92],
            ["General", 'budget@talibon.demo', 'Budget can provide the latest utilization figures before the afternoon coordination window.', 84],
            ["General", 'mayor@talibon.demo', 'Noted. Please include delayed milestones and the responsible offices in the coordination summary.', 77],
            ["Department Heads", 'engineering@talibon.demo', 'Engineering has two routed records awaiting office action today.', 68],
            ["Department Heads", 'budget@talibon.demo', 'Budget review is complete for the latest infrastructure endorsement package.', 63],
            ["Department Heads", 'mayor@talibon.demo', 'Please flag any item that needs executive attention before the end-of-day review.', 58],
            ["MPDO Planning", 'employee@talibon.demo', 'The planning inputs received this morning have been consolidated into the current working set.', 51],
            ["MPDO Planning", 'engineering@talibon.demo', 'Engineering will validate the physical accomplishment figures against the latest field report.', 46],
            ["MPDO Planning", 'budget@talibon.demo', 'Budget utilization figures are ready for inclusion in the planning coordination notes.', 41],
            ["Project Monitoring", 'engineering@talibon.demo', 'Road rehabilitation milestones were updated after the latest field validation.', 34],
            ["Project Monitoring", 'budget@talibon.demo', 'Financial utilization is aligned with the latest submitted accomplishment report.', 30],
            ["Project Monitoring", 'mayor@talibon.demo', 'Keep the delayed milestone items visible for the next executive monitoring review.', 26],
            ["Mayor's Office", 'mayor@talibon.demo', 'Please consolidate the pending endorsements that require executive review today.', 20],
            ["Mayor's Office", 'budget@talibon.demo', 'The budget endorsement packet is complete and ready for review.', 17],
            ["Mayor's Office", 'engineering@talibon.demo', 'Engineering has attached the supporting project status summary.', 14],
            ["Inter-Office Coordination", 'hr@talibon.demo', 'HR has updated the office coordination note for the scheduled personnel activity.', 10],
            ["Inter-Office Coordination", 'legislative@talibon.demo', 'The current legislative calendar is available for offices with related agenda items.', 7],
            ["Inter-Office Coordination", 'employee@talibon.demo', 'MPDO has consolidated the remaining cross-office follow-ups for today.', 4],
        ] as [$channel, $email, $body, $minutesAgo]) {
            $sender = $users->get($email);
            if (! $sender) {
                continue;
            }

            $createdAt = now()->subMinutes($minutesAgo);
            Message::query()->create([
                'public_id' => Str::uuid()->toString(),
                'channel' => $channel,
                'sender_user_id' => $sender->id,
                'body' => $body,
                'created_at' => $createdAt,
                'updated_at' => $createdAt,
            ]);
        }
    }
}
