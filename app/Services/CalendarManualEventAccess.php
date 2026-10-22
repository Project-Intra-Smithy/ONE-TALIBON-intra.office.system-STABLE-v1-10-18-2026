<?php

namespace App\Services;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CalendarEvent;
use App\Models\User;
use Illuminate\Auth\Access\AuthorizationException;

/**
 * Manual beta events only. Workflow deadlines, leave, and all other
 * source-owned events are never mutable through the calendar UI.
 *
 * This is a conservative beta policy: municipality publication is withheld.
 */
final class CalendarManualEventAccess
{
    public function abilities(User $claimed): array
    {
        $actor = VerifiedMunicipalActor::forCurrentSession($claimed)->user();

        return [
            'personal' => true,
            'office' => $actor->isRole('department_head'),
            'municipality' => false,
        ];
    }

    public function authorizeCreate(User $claimed, string $scope): User
    {
        $actor = VerifiedMunicipalActor::forCurrentSession($claimed)->user();

        if ($scope === 'personal'
            || ($scope === 'office' && $actor->isRole('department_head'))) {
            return $actor;
        }

        throw new AuthorizationException('Calendar scope is not available.');
    }

    public function authorizeMutation(User $claimed, CalendarEvent $event): User
    {
        $actor = VerifiedMunicipalActor::forCurrentSession($claimed)->user();

        // Never modify source-owned or injected/malformed calendar events.
        if ($event->event_type !== 'manual_event'
            || $event->source_domain !== 'calendar_manual'
            || $event->source_type !== null
            || $event->source_id !== null
            || $event->created_by_user_id !== $actor->id
            || $event->status !== 'scheduled') {
            throw new AuthorizationException('Calendar event cannot be modified.');
        }

        if ($event->scope === 'personal'
            && $event->user_id === $actor->id
            && $event->department_id === null) {
            return $actor;
        }

        if ($event->scope === 'department'
            && $actor->isRole('department_head')
            && $event->user_id === null
            && $event->department_id === $actor->employee->department_id) {
            return $actor;
        }

        throw new AuthorizationException('Calendar event is outside your authority.');
    }
}
