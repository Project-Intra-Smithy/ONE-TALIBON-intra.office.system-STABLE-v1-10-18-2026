<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use App\Services\TaskActivity\TaskActivityOverview;
use Carbon\CarbonImmutable;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * #94 PostgreSQL 16 coverage of read-only, all-or-nothing Task overviews.
 */
final class TaskActivityPg16OverviewTest extends TestCase
{
    use RefreshDatabase;
    use TaskActivityPg16Fixture;

    public function test_overview_handles_empty_one_three_and_one_thousand_event_histories(): void
    {
        [$owner, $office] = $this->makeStaff('overview-shapes');
        $this->actingAs($owner);
        $zero = $this->makePersonalTask($owner, $office, 'zero history');
        $one = $this->makePersonalTask($owner, $office, 'one history');
        $three = $this->makePersonalTask($owner, $office, 'three history');
        $thousand = $this->makePersonalTask($owner, $office, 'thousand history');

        $service = app(TaskActivityOverview::class);
        self::assertSame(['data' => [], 'meta' => ['task_count' => 0]], $service->summarize($owner, []));

        $this->makeEvent($one, $owner, 'created', '2026-10-12T08:00:00+00:00');
        $this->makeEvent($three, $owner, 'created', '2026-10-12T08:00:00+00:00');
        $tieLow = $this->makeEvent($three, $owner, 'start', '2026-10-12T10:00:00+00:00');
        $tieHigh = $this->makeEvent($three, $owner, 'complete', '2026-10-12T10:00:00+00:00');
        self::assertGreaterThan($tieLow, $tieHigh);
        $this->makeEvents($thousand, $owner, 1000);

        $ids = [$thousand->id, $zero->id, $three->id, $one->id];
        $summary = $service->summarize($owner, $ids);
        self::assertSame($ids, array_column(array_column($summary['data'], 'task'), 'id'));
        self::assertSame(4, $summary['meta']['task_count']);
        self::assertSame([1000, 0, 3, 1], array_column($summary['data'], 'event_count'));
        self::assertSame(['fixture', null, 'complete', 'created'], array_column($summary['data'], 'latest_action'));
        self::assertNull($summary['data'][1]['latest_event_at']);
        self::assertSame([
            'source' => 'task', 'kind' => 'individual', 'id' => $three->id,
        ], $summary['data'][2]['task']);
        self::assertTrue(CarbonImmutable::parse($summary['data'][2]['latest_event_at'])->equalTo(
            CarbonImmutable::parse('2026-10-12T10:00:00+00:00')
        ));
        self::assertSame(1000, TaskEvent::query()->where('task_id', $thousand->id)->count());
    }

    public function test_overview_latest_is_ordered_by_timestamp_before_id_and_uses_id_for_ties(): void
    {
        [$owner, $office] = $this->makeStaff('overview-latest');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'latest ordering');
        $this->makeEvent($task, $owner, 'late-time', '2026-10-12T13:00:00+00:00');
        $this->makeEvent($task, $owner, 'older-id-higher', '2026-10-12T09:00:00+00:00');
        $result = app(TaskActivityOverview::class)->summarize($owner, [$task->id]);
        self::assertSame(2, $result['data'][0]['event_count']);
        self::assertSame('late-time', $result['data'][0]['latest_action']);

        $this->makeEvent($task, $owner, 'later-tie-low', '2026-10-12T14:00:00+00:00');
        $this->makeEvent($task, $owner, 'later-tie-high', '2026-10-12T14:00:00+00:00');
        $result = app(TaskActivityOverview::class)->summarize($owner, [$task->id]);
        self::assertSame('later-tie-high', $result['data'][0]['latest_action']);
        self::assertSame(4, $result['data'][0]['event_count']);
    }

    public function test_overview_accepts_exactly_fifty_ids_and_deduplicates_in_first_seen_order(): void
    {
        [$owner, $office] = $this->makeStaff('overview-bounds');
        $this->actingAs($owner);
        $ids = [];

        for ($i = 0; $i < 50; $i++) {
            $ids[] = $this->makePersonalTask($owner, $office, 'bounded '.$i)->id;
        }

        $service = app(TaskActivityOverview::class);
        $result = $service->summarize($owner, array_reverse($ids));
        self::assertSame(50, $result['meta']['task_count']);
        self::assertSame(array_reverse($ids), array_column(array_column($result['data'], 'task'), 'id'));
        self::assertSame(array_fill(0, 50, 0), array_column($result['data'], 'event_count'));

        $duplicated = $service->summarize($owner, [$ids[5], $ids[2], $ids[5], $ids[0], $ids[2]]);
        self::assertSame(3, $duplicated['meta']['task_count']);
        self::assertSame([$ids[5], $ids[2], $ids[0]], array_column(array_column($duplicated['data'], 'task'), 'id'));

        $this->assertRejected(
            fn () => $service->summarize($owner, array_fill(0, 51, $ids[0])),
            'task_ids'
        );
        $this->assertRejected(
            fn () => $service->summarize($owner, [...$ids, $ids[0]]),
            'task_ids'
        );
        self::assertSame(0, DB::table('task_events')->count());
    }

    public function test_overview_rejects_nonpositive_or_noninteger_ids_before_querying_history(): void
    {
        [$owner, $office] = $this->makeStaff('overview-invalid');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'valid');
        $service = app(TaskActivityOverview::class);

        foreach ([0, -1, '1', 1.5, null, true] as $invalid) {
            $this->assertRejected(fn () => $service->summarize($owner, [$task->id, $invalid]), 'task_ids');
        }
        self::assertSame([$task->id], array_column(
            array_column($service->summarize($owner, [$task->id])['data'], 'task'),
            'id'
        ));
    }

    public function test_overview_mixed_foreign_missing_same_office_assigned_official_and_legacy_ids_fail_wholly(): void
    {
        [$owner, $office] = $this->makeStaff('overview-owner');
        [$coworker] = $this->makeStaff('overview-coworker', $office);
        [$outsider, $outsideOffice] = $this->makeStaff('overview-outside');
        $this->actingAs($owner);
        $own = $this->makePersonalTask($owner, $office, 'visible');
        $sameOffice = $this->makePersonalTask($coworker, $office, 'coworker hidden');
        $outside = $this->makePersonalTask($outsider, $outsideOffice, 'outside hidden');
        $assigned = $this->makePersonalTask($owner, $office, 'assigned hidden', 'individual', $coworker);
        $official = $this->makePersonalTask($owner, $office, 'official hidden', 'official');
        $legacy = $this->makePersonalTask($owner, $office, 'legacy hidden', null);

        foreach ([$own, $sameOffice, $outside, $assigned, $official, $legacy] as $task) {
            $this->makeEvent($task, $owner, 'synthetic');
        }

        $service = app(TaskActivityOverview::class);
        foreach ([
            $sameOffice->id, $outside->id, $assigned->id, $official->id,
            $legacy->id, $legacy->id + 999999,
        ] as $hiddenId) {
            $this->assertConcealed(fn () => $service->summarize($owner, [$own->id, $hiddenId]));
            $this->assertConcealed(fn () => $service->summarize($owner, [$hiddenId, $own->id]));
            $this->assertConcealed(fn () => $service->summarize($owner, [$hiddenId]));
        }

        $allowed = $service->summarize($owner, [$own->id]);
        self::assertSame(1, $allowed['data'][0]['event_count']);
        self::assertSame($own->id, $allowed['data'][0]['task']['id']);
        self::assertSame(6, DB::table('task_events')->count());
    }

    public function test_overview_rechecks_guest_spoof_inactive_user_employment_office_and_empty_request(): void
    {
        [$owner, $office] = $this->makeStaff('overview-actor');
        [$other] = $this->makeStaff('overview-other');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'secured');
        $this->makeEvent($task, $owner, 'created');
        $service = app(TaskActivityOverview::class);

        auth()->logout();
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, []));
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, [$task->id]));

        $this->actingAs($other);
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, [$task->id]));
        $this->assertConcealed(fn () => $service->summarize($other, [$task->id]));

        $this->actingAs($owner);
        User::query()->whereKey($owner->id)->update(['is_active' => false]);
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, []));
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, [$task->id]));

        User::query()->whereKey($owner->id)->update(['is_active' => true]);
        $owner->employee()->update(['employment_status' => 'separated']);
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, []));
        $owner->employee()->update(['employment_status' => 'active']);

        $office->update(['is_active' => false]);
        $this->assertAuthorizationDenied(fn () => $service->summarize($owner, []));

        $orphan = User::query()->create([
            'name' => 'T94 overview unlinked',
            'email' => 't94-overview-unlinked@example.invalid',
            'password' => 'test-only',
            'is_active' => true,
        ]);
        $this->actingAs($orphan);
        $this->assertAuthorizationDenied(fn () => $service->summarize($orphan, []));
        self::assertSame(1, TaskEvent::query()->where('task_id', $task->id)->count());
    }

    public function test_overview_uses_pg16_left_lateral_correlated_count_and_flat_query_counts_for_one_ten_fifty(): void
    {
        [$owner, $office] = $this->makeStaff('overview-sql');
        $this->actingAs($owner);
        $ids = [];

        for ($i = 0; $i < 50; $i++) {
            $task = $this->makePersonalTask($owner, $office, 'SQL '.$i);
            $ids[] = $task->id;
            if ($i % 2 === 0) {
                $this->makeEvent($task, $owner, 'event');
            }
        }

        $service = app(TaskActivityOverview::class);
        $queryCounts = [];

        foreach ([1, 10, 50] as $size) {
            [$result, $log] = $this->traceRead(
                fn () => $service->summarize($owner, array_slice($ids, 0, $size))
            );
            self::assertSame($size, $result['meta']['task_count']);
            $this->assertReadOnlySql($log);
            self::assertLessThanOrEqual(6, count($log));
            $queryCounts[] = count($log);

            $statements = array_column($log, 'query');
            $overviewSql = strtolower(implode("\n", array_filter(
                $statements,
                static fn (string $statement): bool => str_contains(strtolower($statement), 'lateral')
            )));
            self::assertNotSame('', $overviewSql);
            self::assertStringContainsString('left join lateral', $overviewSql);
            self::assertStringContainsString('count(*)', $overviewSql);
            self::assertStringContainsString('limit 1', $overviewSql);
            self::assertStringContainsString('recent', $overviewSql);
            self::assertStringContainsString('task_events', $overviewSql);
            self::assertStringNotContainsString('join "users"', $overviewSql);
        }

        self::assertSame([$queryCounts[0], $queryCounts[0], $queryCounts[0]], $queryCounts);
    }

    public function test_overview_does_not_mutate_tasks_events_or_disclose_actor_profiles(): void
    {
        [$owner, $office] = $this->makeStaff('overview-readonly');
        [$historical] = $this->makeStaff('overview-historical');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'reference only');
        $task->forceFill([
            'source_domain' => 'work_request',
            'source_type' => 'transaction',
            'source_id' => 87654321,
        ])->save();
        $this->makeEvent($task, $historical, 'recorded');

        $beforeTask = DB::table('tasks')->where('id', $task->id)->first();
        $beforeEvents = DB::table('task_events')->where('task_id', $task->id)->get()->toArray();
        [$result, $sql] = $this->traceRead(
            fn () => app(TaskActivityOverview::class)->summarize($owner, [$task->id])
        );

        self::assertSame(1, $result['data'][0]['event_count']);
        self::assertSame('recorded', $result['data'][0]['latest_action']);
        self::assertSame(['source' => 'task', 'kind' => 'individual', 'id' => $task->id], $result['data'][0]['task']);
        $json = json_encode($result, JSON_THROW_ON_ERROR);
        self::assertStringNotContainsString($historical->name, $json);
        self::assertStringNotContainsString($historical->email, $json);
        self::assertStringNotContainsString('work_request', $json);
        self::assertStringNotContainsString('87654321', $json);

        $this->assertReadOnlySql($sql);
        self::assertEquals($beforeTask, DB::table('tasks')->where('id', $task->id)->first());
        self::assertEquals($beforeEvents, DB::table('task_events')->where('task_id', $task->id)->get()->toArray());
        self::assertSame(0, DB::table('transaction_events')->count());
        self::assertSame(0, DB::table('correspondence_events')->count());
    }
}
