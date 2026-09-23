<?php

namespace App\Prototype\Messaging;

final class PrototypeMessagingChannels
{
    private const CHANNELS = [
        'General',
        'Department Heads',
        'MPDO Planning',
        'Project Monitoring',
        "Mayor's Office",
        'Inter-Office Coordination',
    ];

    /** @return list<string> */
    public static function all(): array
    {
        return self::CHANNELS;
    }

    public static function contains(string $channel): bool
    {
        return in_array($channel, self::CHANNELS, true);
    }
}
