<?php

namespace Tests\Feature\Tasks;

use App\Models\Task;
use App\Models\TaskEvent;
use App\Models\User;
use App\Services\TaskActivity\TaskActivityFeed;
use App\Services\TaskActivity\TaskActivityReader;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

/**
 * #94 read-path regression tests. Direct service calls intentionally avoid
 * inventing HTTP endpoints that are not part of the staging contract.
 */
final class TaskActivityPg16ReaderFeedTest extends TestCase
{
    use RefreshDatabase;
    use TaskActivityPg16Fixture;

    public function test_reader_handles_zero_one_and_three_events_with_timestamp_id_ties(): void
    {
        [$owner, $office] = $this->makeStaff('reader-shapes');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'reader shapes');
        $reader = app(TaskActivityReader::class);

        self::assertSame([
            'data' => [],
            'meta' => ['per_page' => 20, 'has_more' => false, 'next_before_event_id' => null],
        ], $reader->page($owner, $task->id));

        $earliest = $this->makeEvent($task, $owner, 'created', '2026-10-12T08:00:00+00:00');
        $one = $reader->page($owner, $task->id);
        self::assertSame([$earliest], array_column($one['data'], 'id'));
        self::assertSame('created', $one['data'][0]['action']);
        self::assertSame($owner->id, $one['data'][0]['actor_user_id']);
        self::assertNull($one['data'][0]['previous_state']);
        self::assertFalse($one['meta']['has_more']);

        $tieLow = $this->makeEvent($task, $owner, 'start', '2026-10-12T10:00:00+00:00', 'open', 'in_progress');
        $tieHigh = $this->makeEvent($task, $owner, 'complete', '2026-10-12T10:00:00+00:00', 'in_progress', 'completed');
        $all = $reader->page($owner, $task->id);
        self::assertSame([$tieHigh, $tieLow, $earliest], array_column($all['data'], 'id'));
        self::assertNull($all['meta']['next_before_event_id']);

        $first = $reader->page($owner, $task->id, 2);
        self::assertSame([$tieHigh, $tieLow], array_column($first['data'], 'id'));
        self::assertTrue($first['meta']['has_more']);
        self::assertSame($tieLow, $first['meta']['next_before_event_id']);

        $second = $reader->page($owner, $task->id, 2, $tieLow);
        self::assertSame([$earliest], array_column($second['data'], 'id'));
        self::assertFalse($second['meta']['has_more']);
        self::assertNull($second['meta']['next_before_event_id']);
    }

    public function test_reader_stable_keyset_cursor_does_not_repeat_or_admit_newer_events(): void
    {
        [$owner, $office] = $this->makeStaff('reader-stable');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'stable reader');
        $reader = app(TaskActivityReader::class);

        $older = $this->makeEvent($task, $owner, 'older', '2026-10-12T07:00:00+00:00');
        $middle = $this->makeEvent($task, $owner, 'middle', '2026-10-12T09:00:00+00:00');
        $latest = $this->makeEvent($task, $owner, 'latest', '2026-10-12T10:00:00+00:00');
        $page = $reader->page($owner, $task->id, 2);
        self::assertSame([$latest, $middle], array_column($page['data'], 'id'));

        $newer = $this->makeEvent($task, $owner, 'newer', '2026-10-12T11:00:00+00:00');
        $remaining = $reader->page($owner, $task->id, 2, $page['meta']['next_before_event_id']);
        self::assertSame([$older], array_column($remaining['data'], 'id'));
        self::assertNotContains($newer, array_column($remaining['data'], 'id'));
    }

    public function test_reader_paginates_one_thousand_events_without_unbounded_history_loading(): void
    {
        [$owner, $office] = $this->makeStaff('reader-thousand');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, '1000 history');
        $this->makeEvents($task, $owner, 1000);

        [$first, $sql] = $this->traceRead(
            fn () => app(TaskActivityReader::class)->page($owner, $task->id, 50)
        );
        self::assertCount(50, $first['data']);
        self::assertTrue($first['meta']['has_more']);
        self::assertSame(50, $first['meta']['per_page']);
        self::assertSame(50, count(array_unique(array_column($first['data'], 'id'))));
        self::assertLessThanOrEqual(8, count($sql));
        $this->assertReadOnlySql($sql);

        $joinedSql = strtolower(implode("\n", array_column($sql, 'query')));
        self::assertStringContainsString('limit', $joinedSql);
        self::assertStringNotContainsString('count(*)', $joinedSql);

        $second = app(TaskActivityReader::class)->page(
            $owner, $task->id, 50, $first['meta']['next_before_event_id']
        );
        self::assertCount(50, $second['data']);
        self::assertSame([], array_values(array_intersect(
            array_column($first['data'], 'id'),
            array_column($second['data'], 'id')
        )));
        self::assertSame(1000, DB::table('task_events')->where('task_id', $task->id)->count());
    }

    public function test_reader_rejects_invalid_bounds_and_conceals_foreign_or_missing_cursors(): void
    {
        [$owner, $office] = $this->makeStaff('reader-owner');
        [$other] = $this->makeStaff('reader-foreign', $office);
        $this->actingAs($owner);
        $ownTask = $this->makePersonalTask($owner, $office, 'own');
        $foreignTask = $this->makePersonalTask($other, $office, 'coworker');
        $ownEvent = $this->makeEvent($ownTask, $owner, 'own');
        $foreignEvent = $this->makeEvent($foreignTask, $other, 'foreign');
        $reader = app(TaskActivityReader::class);

        foreach ([0, 51, -1] as $size) {
            $this->assertRejected(fn () => $reader->page($owner, $ownTask->id, $size), 'per_page');
        }
        foreach ([0, -1] as $cursor) {
            $this->assertRejected(fn () => $reader->page($owner, $ownTask->id, 20, $cursor), 'before_event_id');
        }

        $this->assertConcealed(fn () => $reader->page($owner, $ownTask->id, 20, $foreignEvent));
        $this->assertConcealed(fn () => $reader->page($owner, $ownTask->id, 20, $foreignEvent + 999999));
        $this->assertConcealed(fn () => $reader->page($owner, $foreignTask->id));
        self::assertSame([$ownEvent], array_column($reader->page($owner, $ownTask->id)['data'], 'id'));
    }

    public function test_feed_is_owner_only_across_same_office_assigned_official_and_legacy_tasks(): void
    {
        [$owner, $office] = $this->makeStaff('feed-owner');
        [$coworker] = $this->makeStaff('feed-coworker', $office);
        [$outsider, $otherOffice] = $this->makeStaff('feed-outsider');
        $this->actingAs($owner);

        $personal = $this->makePersonalTask($owner, $office, 'visible');
        $sameOffice = $this->makePersonalTask($coworker, $office, 'hidden coworker');
        $external = $this->makePersonalTask($outsider, $otherOffice, 'hidden elsewhere');
        $assigned = $this->makePersonalTask($owner, $office, 'hidden assigned', 'individual', $coworker);
        $official = $this->makePersonalTask($owner, $office, 'hidden official', 'official');
        $legacy = $this->makePersonalTask($owner, $office, 'hidden legacy', null);

        $visibleId = $this->makeEvent($personal, $owner, 'visible');
        foreach ([$sameOffice, $external, $assigned, $official, $legacy] as $hidden) {
            $this->makeEvent($hidden, $owner, 'hidden');
        }

        $feed = app(TaskActivityFeed::class)->page($owner);
        self::assertSame([$visibleId], array_column($feed['data'], 'id'));
        self::assertSame($personal->id, $feed['data'][0]['task']['id']);
        self::assertSame('T94 visible', $feed['data'][0]['task']['title']);
        self::assertNull($feed['data'][0]['task']['source']);
        self::assertFalse($feed['meta']['has_more']);
    }

    public function test_feed_has_stable_cross_task_pagination_and_id_tiebreaker(): void
    {
        [$owner, $office] = $this->makeStaff('feed-stable');
        $this->actingAs($owner);
        $one = $this->makePersonalTask($owner, $office, 'one');
        $two = $this->makePersonalTask($owner, $office, 'two');
        $three = $this->makePersonalTask($owner, $office, 'three');

        $earliest = $this->makeEvent($one, $owner, 'old', '2026-10-12T07:00:00+00:00');
        $tieLow = $this->makeEvent($two, $owner, 'tied-low', '2026-10-12T10:00:00+00:00');
        $tieHigh = $this->makeEvent($three, $owner, 'tied-high', '2026-10-12T10:00:00+00:00');
        $feed = app(TaskActivityFeed::class);

        $first = $feed->page($owner, 2);
        self::assertSame([$tieHigh, $tieLow], array_column($first['data'], 'id'));
        self::assertTrue($first['meta']['has_more']);
        self::assertSame($tieLow, $first['meta']['next_before_event_id']);

        $newer = $this->makeEvent($one, $owner, 'new', '2026-10-12T12:00:00+00:00');
        $second = $feed->page($owner, 2, $tieLow);
        self::assertSame([$earliest], array_column($second['data'], 'id'));
        self::assertFalse($second['meta']['has_more']);
        self::assertNotContains($newer, array_column($second['data'], 'id'));
    }

    public function test_feed_handles_zero_one_and_one_thousand_events_with_bounded_queries(): void
    {
        [$owner, $office] = $this->makeStaff('feed-thousand');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'feed 1000');
        $service = app(TaskActivityFeed::class);

        self::assertSame([], $service->page($owner)['data']);
        $this->makeEvent($task, $owner, 'first');
        self::assertCount(1, $service->page($owner)['data']);
        $this->makeEvents($task, $owner, 999);

        [$first, $queries] = $this->traceRead(fn () => $service->page($owner, 50));
        self::assertCount(50, $first['data']);
        self::assertTrue($first['meta']['has_more']);
        self::assertLessThanOrEqual(7, count($queries));
        $this->assertReadOnlySql($queries);
        self::assertStringContainsString('personal_tasks', strtolower(implode("\n", array_column($queries, 'query'))));
    }

    public function test_feed_rejects_bounds_and_conceals_foreign_anchors_even_in_same_office(): void
    {
        [$owner, $office] = $this->makeStaff('feed-cursor-owner');
        [$other] = $this->makeStaff('feed-cursor-other', $office);
        $this->actingAs($owner);
        $own = $this->makePersonalTask($owner, $office, 'own');
        $foreign = $this->makePersonalTask($other, $office, 'foreign');
        $visibleEvent = $this->makeEvent($own, $owner, 'own');
        $foreignEvent = $this->makeEvent($foreign, $other, 'foreign');
        $feed = app(TaskActivityFeed::class);

        foreach ([0, -2, 51] as $size) {
            $this->assertRejected(fn () => $feed->page($owner, $size), 'per_page');
        }
        foreach ([0, -1] as $cursor) {
            $this->assertRejected(fn () => $feed->page($owner, 20, $cursor), 'before_event_id');
        }
        $this->assertConcealed(fn () => $feed->page($owner, 20, $foreignEvent));
        $this->assertConcealed(fn () => $feed->page($owner, 20, $foreignEvent + 999999));
        self::assertSame([$visibleEvent], array_column($feed->page($owner)['data'], 'id'));
    }

    public function test_reader_and_feed_require_live_session_and_active_employment_office(): void
    {
        [$owner, $office] = $this->makeStaff('auth-owner');
        [$other] = $this->makeStaff('auth-other');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'guarded');
        $this->makeEvent($task, $owner, 'created');
        $reader = app(TaskActivityReader::class);
        $feed = app(TaskActivityFeed::class);

        auth()->logout();
        $this->assertAuthorizationDenied(fn () => $reader->page($owner, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($owner));

        $this->actingAs($other);
        $this->assertAuthorizationDenied(fn () => $reader->page($owner, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($owner));

        $this->actingAs($owner);
        User::query()->whereKey($owner->id)->update(['is_active' => false]);
        $this->assertAuthorizationDenied(fn () => $reader->page($owner, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($owner));

        User::query()->whereKey($owner->id)->update(['is_active' => true]);
        $owner->employee()->update(['employment_status' => 'separated']);
        $this->assertAuthorizationDenied(fn () => $reader->page($owner, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($owner));

        $owner->employee()->update(['employment_status' => 'active']);
        $office->update(['is_active' => false]);
        $this->assertAuthorizationDenied(fn () => $reader->page($owner, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($owner));

        $orphan = User::query()->create([
            'name' => 'T94 orphan',
            'email' => 't94-orphan@example.invalid',
            'password' => 'test-only',
            'is_active' => true,
        ]);
        $this->actingAs($orphan);
        $this->assertAuthorizationDenied(fn () => $reader->page($orphan, $task->id));
        $this->assertAuthorizationDenied(fn () => $feed->page($orphan));
        self::assertSame(1, TaskEvent::query()->where('task_id', $task->id)->count());
    }

    public function test_reader_and_feed_return_only_stored_actor_id_and_passive_source_without_writes(): void
    {
        [$owner, $office] = $this->makeStaff('profile-owner');
        [$historical] = $this->makeStaff('profile-actor');
        $this->actingAs($owner);
        $task = $this->makePersonalTask($owner, $office, 'passive reference');
        $task->forceFill([
            'source_domain' => 'work_request',
            'source_type' => 'transaction',
            'source_id' => 987654321,
        ])->save();

        $id = $this->makeEvent($task, $historical, 'created');
        $beforeTasks = DB::table('tasks')->where('id', $task->id)->first();
        $beforeEvents = DB::table('task_events')->where('task_id', $task->id)->get()->toArray();

        [$reader, $readerSql] = $this->traceRead(
            fn () => app(TaskActivityReader::class)->page($owner, $task->id)
        );
        [$feed, $feedSql] = $this->traceRead(
            fn () => app(TaskActivityFeed::class)->page($owner)
        );
        self::assertSame([$id], array_column($reader['data'], 'id'));
        self::assertSame([$id], array_column($feed['data'], 'id'));
        self::assertSame($historical->id, $reader['data'][0]['actor_user_id']);
        self::assertSame($historical->id, $feed['data'][0]['actor_user_id']);
        self::assertSame([
            'domain' => 'work_request', 'type' => 'transaction', 'id' => 987654321,
        ], $feed['data'][0]['task']['source']);

        foreach ([$reader, $feed] as $payload) {
            $json = json_encode($payload, JSON_THROW_ON_ERROR);
            self::assertStringNotContainsString($historical->email, $json);
            self::assertStringNotContainsString($historical->name, $json);
            self::assertStringNotContainsString('password', $json);
        }
        $this->assertReadOnlySql($readerSql);
        $this->assertReadOnlySql($feedSql);
        self::assertEquals($beforeTasks, DB::table('tasks')->where('id', $task->id)->first());
        self::assertEquals($beforeEvents, DB::table('task_events')->where('task_id', $task->id)->get()->toArray());
        self::assertSame(0, DB::table('transaction_events')->count());
        self::assertSame(0, DB::table('correspondence_events')->count());
    }
}
