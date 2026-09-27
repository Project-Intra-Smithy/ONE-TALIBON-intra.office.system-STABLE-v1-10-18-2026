<?php

namespace App\Services;

use App\Models\Memorandum;
use App\Models\MemoRecipient;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemorandumService
{
    public function __construct(
        private readonly AuditLogger $audit,
        private readonly MemorandumAuthority $authority,
    ) {
    }

    public function publish(User $actor, array $data): Memorandum
    {
        $authority = $this->authority->requirePublisher($actor);
        $departmentId = (int) ($authority['issuingOffice']['id'] ?? 0);

        if ($departmentId <= 0) {
            throw ValidationException::withMessages([
                'issuer' => 'The issuing account must have an active employee department.',
            ]);
        }

        $audienceType = (string) ($data['audience_type'] ?? '');
        if (! in_array($audienceType, $authority['allowedAudienceTypes'], true)) {
            throw ValidationException::withMessages([
                'audience_type' => 'The selected audience is outside this issuing authority.',
            ]);
        }

        $audienceIds = array_values(array_unique(array_map('intval', $data['audience_ids'] ?? [])));
        $recipients = $this->resolveRecipients($actor, $authority, $audienceType, $audienceIds);

        if ($recipients->isEmpty()) {
            throw ValidationException::withMessages([
                'audience_ids' => 'The selected audience has no active employee accounts.',
            ]);
        }

        return DB::transaction(function () use ($actor, $data, $departmentId, $recipients, $audienceType): Memorandum {
            $memo = Memorandum::query()->create([
                'memo_number' => $data['memo_number'],
                'title' => $data['title'],
                'body' => $data['body'],
                'issued_by_user_id' => $actor->id,
                'issued_by_department_id' => $departmentId,
                'audience_type' => $audienceType,
                'requires_acknowledgement' => (bool) ($data['requires_acknowledgement'] ?? false),
                'classification' => $data['classification'] ?? 'internal',
                'status' => 'published',
                'published_at' => now(),
                'expires_at' => $data['expires_at'] ?? null,
            ]);

            $now = now();
            foreach ($recipients as $recipient) {
                MemoRecipient::query()->create([
                    'memorandum_id' => $memo->id,
                    'user_id' => $recipient->id,
                    'delivered_at' => $now,
                ]);
            }

            $this->audit->record(
                $actor,
                'memorandum.published',
                "Published {$memo->memo_number} to {$recipients->count()} recipient(s).",
                'allowed',
                Memorandum::class,
                $memo->id,
            );

            return $memo->fresh(['issuer', 'issuingDepartment', 'recipients']);
        });
    }

    public function acknowledge(User $actor, Memorandum $memorandum): bool
    {
        return DB::transaction(function () use ($actor, $memorandum): bool {
            $recipient = MemoRecipient::query()
                ->where('memorandum_id', $memorandum->id)
                ->where('user_id', $actor->id)
                ->lockForUpdate()
                ->firstOrFail();

            $requiresAcknowledgement = Memorandum::query()
                ->whereKey($memorandum->id)
                ->value('requires_acknowledgement');

            abort_unless((bool) $requiresAcknowledgement, 422);

            if ($recipient->acknowledged_at !== null) {
                return false;
            }

            $acknowledgedAt = now();
            $recipient->update([
                'viewed_at' => $recipient->viewed_at ?? $acknowledgedAt,
                'acknowledged_at' => $acknowledgedAt,
            ]);

            $this->audit->record(
                $actor,
                'memorandum.acknowledged',
                "Acknowledged {$memorandum->memo_number}.",
                'allowed',
                Memorandum::class,
                $memorandum->id,
            );

            return true;
        });
    }

    /** @param array<string, mixed> $authority */
    private function resolveRecipients(
        User $actor,
        array $authority,
        string $audienceType,
        array $audienceIds,
    ): Collection {
        $query = User::query()
            ->where('is_active', true)
            ->whereHas('employee', fn ($q) => $q->where('employment_status', 'active'));

        if ($authority['scope'] === 'department') {
            $departmentId = (int) $authority['issuingOffice']['id'];

            if ($audienceType === 'departments') {
                if ($audienceIds !== [$departmentId]) {
                    throw ValidationException::withMessages([
                        'audience_ids' => 'Department memoranda may only target the issuing office.',
                    ]);
                }

                $query->whereHas('employee', fn ($q) => $q->where('department_id', $departmentId));
            } elseif ($audienceType === 'employees') {
                if ($audienceIds === []) {
                    throw ValidationException::withMessages([
                        'audience_ids' => 'Select at least one employee from the issuing office.',
                    ]);
                }

                $outOfScope = User::query()
                    ->where('is_active', true)
                    ->whereHas('employee', fn ($q) => $q
                        ->whereIn('id', $audienceIds)
                        ->where('department_id', '!=', $departmentId))
                    ->exists();

                if ($outOfScope) {
                    throw ValidationException::withMessages([
                        'audience_ids' => 'Department memoranda cannot target employees outside the issuing office.',
                    ]);
                }

                $query->whereHas('employee', fn ($q) => $q
                    ->whereIn('id', $audienceIds)
                    ->where('department_id', $departmentId));
            }

            return $query->get();
        }

        if ($audienceType === 'departments') {
            if ($audienceIds === []) {
                throw ValidationException::withMessages([
                    'audience_ids' => 'Select at least one department.',
                ]);
            }

            $query->whereHas('employee', fn ($q) => $q->whereIn('department_id', $audienceIds));
        } elseif ($audienceType === 'employees') {
            if ($audienceIds === []) {
                throw ValidationException::withMessages([
                    'audience_ids' => 'Select at least one employee.',
                ]);
            }

            $query->whereHas('employee', fn ($q) => $q->whereIn('id', $audienceIds));
        }

        return $query->get();
    }
}
