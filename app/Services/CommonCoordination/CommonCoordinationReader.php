<?php

namespace App\Services\CommonCoordination;

use App\Messaging\MessagingChannels;
use App\Models\User;

/**
 * Standalone P0-backed read contract. No controller is wired in this draft.
 * P1 Task/Work Request consumers and LGU W06/W07 decisions remain CONTRACT_HOLD.
 */
final readonly class CommonCoordinationReader
{
    public function __construct(
        private NotificationContextReader $notifications,
        private CalendarResponsibilityReader $calendar,
    ) {}

    /** @return array<string,mixed> */
    public function snapshot(
        User $actor,
        ?string $date = null,
        int $limit = 10,
        ?int $notificationBeforeId = null,
    ): array {
        $eligible = CoordinationActor::from($actor);
        if (! $eligible) {
            return [
                'notifications' => ['leave_updates' => [], 'memoranda' => [], 'next_cursor' => null],
                'calendar' => ['events' => [], 'range_start' => null, 'range_end' => null, 'timezone' => null, 'truncated' => false],
                'chats' => [],
            ];
        }

        return [
            'notifications' => $this->notifications->read($eligible, $limit, $notificationBeforeId),
            'calendar' => $this->calendar->read($eligible, $date),
            'chats' => array_map(
                fn (string $channel): array => [
                    'channel' => $channel,
                    'url' => '/messages?channel='.rawurlencode($channel),
                ],
                MessagingChannels::all(),
            ),
        ];
    }

    /** @return array{channel:string,url:string}|null */
    public function chatLink(User $actor, string $channel): ?array
    {
        if (! MessagingChannels::contains($channel) || ! CoordinationActor::from($actor)) {
            return null;
        }

        return ['channel' => $channel, 'url' => '/messages?channel='.rawurlencode($channel)];
    }
}
