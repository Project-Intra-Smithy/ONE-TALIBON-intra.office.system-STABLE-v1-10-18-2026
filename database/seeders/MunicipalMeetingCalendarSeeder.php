<?php

namespace Database\Seeders;

use App\Models\CalendarEvent;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Seeder;
use RuntimeException;

class MunicipalMeetingCalendarSeeder extends Seeder
{
    public function run(): void
    {
        $path = resource_path('js/data/municipal/meetings.json');
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new RuntimeException("Unable to read canonical municipal meeting data at {$path}.");
        }

        $meetings = json_decode($contents, true, flags: JSON_THROW_ON_ERROR);

        if (! is_array($meetings)) {
            throw new RuntimeException('Canonical municipal meeting data must decode to an array.');
        }

        $timezone = (string) config('app.timezone', 'Asia/Manila');
        $creatorId = User::query()->where('email', 'mayor@talibon.demo')->value('id');

        foreach ($meetings as $meeting) {
            if (! is_array($meeting)) {
                throw new RuntimeException('Canonical municipal meeting entry must be an object.');
            }

            foreach (['id', 'title', 'organizingOffice', 'date', 'time', 'venue', 'status'] as $required) {
                if (! isset($meeting[$required]) || ! is_string($meeting[$required]) || trim($meeting[$required]) === '') {
                    throw new RuntimeException("Canonical municipal meeting is missing required field {$required}.");
                }
            }

            $startsAt = CarbonImmutable::createFromFormat(
                '!Y-m-d H:i',
                $meeting['date'].' '.$meeting['time'],
                $timezone,
            );

            if (! $startsAt) {
                throw new RuntimeException("Invalid municipal meeting schedule for {$meeting['id']}.");
            }

            $participants = array_values(array_filter(
                (array) ($meeting['participants'] ?? []),
                fn (mixed $value): bool => is_string($value) && trim($value) !== '',
            ));
            $agenda = array_values(array_filter(
                (array) ($meeting['agenda'] ?? []),
                fn (mixed $value): bool => is_string($value) && trim($value) !== '',
            ));
            $documents = array_values(array_filter(
                (array) ($meeting['relatedDocuments'] ?? []),
                fn (mixed $value): bool => is_string($value) && trim($value) !== '',
            ));

            $descriptionParts = [
                'Organizing office: '.$meeting['organizingOffice'],
                $participants !== [] ? 'Participants: '.implode(', ', $participants) : null,
                $agenda !== [] ? 'Agenda: '.implode('; ', $agenda) : null,
                $documents !== [] ? 'Related records: '.implode('; ', $documents) : null,
            ];

            CalendarEvent::query()->updateOrCreate(
                ['event_key' => 'municipal-meeting-'.$meeting['id']],
                [
                    'event_type' => 'meeting',
                    'title' => $meeting['title'],
                    'description' => implode("\n", array_values(array_filter($descriptionParts))),
                    'scope' => 'municipality',
                    'department_id' => null,
                    'user_id' => null,
                    'source_domain' => 'meeting',
                    'source_type' => 'municipal_meeting_reference',
                    'source_id' => (int) preg_replace('/\D+/', '', $meeting['id']),
                    'priority' => 'normal',
                    'starts_at' => $startsAt,
                    'ends_at' => $startsAt->addHour(),
                    'all_day' => false,
                    'location' => $meeting['venue'],
                    'action_url' => '/meetings',
                    'status' => strtolower($meeting['status']),
                    'created_by_user_id' => $creatorId,
                ],
            );
        }
    }
}
