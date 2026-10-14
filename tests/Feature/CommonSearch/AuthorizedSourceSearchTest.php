<?php

namespace Tests\Feature\CommonSearch;

use App\Domain\Correspondence\CorrespondenceClassification;
use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Domain\Identity\VerifiedMunicipalActor;
use App\Domain\TravelOrders\TravelOrderStatus;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\TravelOrder;
use App\Models\User;
use App\Services\CommonSearch\AuthorizedSourceSearch;
use App\Services\CorrespondenceAccessDecider;
use App\Services\TravelOrderAccess;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Tests\TestCase;

final class AuthorizedSourceSearchTest extends TestCase
{
    use RefreshDatabase;

    public function test_empty_and_unknown_queries_do_not_enumerate_records(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->correspondence($office, 'Office private filing');

        $this->actingAs($actor);
        $service = app(AuthorizedSourceSearch::class);

        $this->assertSame(['data' => [], 'meta' => [
            'page' => 1, 'per_page' => 20, 'total' => 0, 'last_page' => 0, 'has_more' => false,
        ]], $service->search($actor, '  '));
        $this->assertSame(0, $service->search($actor, 'does not exist')['meta']['total']);
    }

    public function test_authorized_sources_are_typed_and_never_mix_identical_public_ids(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $correspondence = $this->correspondence($office, 'Shared token registration');
        $this->makeTravelOrder($office, $actor->employee, 'Shared token travel', $correspondence->public_id);

        $this->actingAs($actor);
        $result = app(AuthorizedSourceSearch::class)->search($actor, 'shared token');

        $this->assertSame(2, $result['meta']['total']);
        $this->assertCount(2, $result['data']);
        $this->assertEqualsCanonicalizing(
            ['correspondence:'.$correspondence->public_id, 'travel_order:'.$correspondence->public_id],
            array_column($result['data'], 'key'),
        );
        $this->assertNotSame($result['data'][0]['url'], $result['data'][1]['url']);
        $this->assertSame(
            1,
            app(AuthorizedSourceSearch::class)->search($actor, 'shared token', source: 'correspondence')['meta']['total'],
        );
    }

    public function test_foreign_office_titles_urls_and_totals_never_enter_projection(): void
    {
        $own = $this->office();
        $other = $this->office();
        $actor = $this->actor($own);
        $foreign = $this->actor($other);
        $this->correspondence($own, 'Sentinel authorized correspondence');
        $this->correspondence($other, 'Sentinel foreign correspondence');
        $this->makeTravelOrder($own, $actor->employee, 'Sentinel authorized travel');
        $this->makeTravelOrder($other, $foreign->employee, 'Sentinel foreign travel');

        $this->actingAs($actor);
        $result = app(AuthorizedSourceSearch::class)->search($actor, 'Sentinel');

        $this->assertSame(2, $result['meta']['total']);
        $this->assertCount(2, $result['data']);
        $projection = json_encode($result);
        $this->assertStringNotContainsString('foreign', $projection);
        $this->assertStringNotContainsString('/transactions/', $projection);
    }

    public function test_moved_employee_loses_former_office_matches_even_with_cached_relations(): void
    {
        $old = $this->office();
        $new = $this->office();
        $actor = $this->actor($old);
        $this->correspondence($old, 'Transfer-bound office record');

        $this->actingAs($actor);
        $service = app(AuthorizedSourceSearch::class);
        $this->assertSame(1, $service->search($actor, 'Transfer-bound')['meta']['total']);

        $actor->load('employee.department');
        $actor->employee()->update(['department_id' => $new->id]);

        $this->assertSame(0, $service->search($actor, 'Transfer-bound')['meta']['total']);
    }

    public function test_separated_employee_cannot_search_with_a_retained_session(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->correspondence($office, 'Revoked staff item');
        $this->actingAs($actor);
        $actor->load('employee.department');
        $actor->employee()->update(['employment_status' => 'separated']);

        $this->expectException(AuthorizationException::class);
        app(AuthorizedSourceSearch::class)->search($actor, 'Revoked');
    }

    public function test_each_search_operation_revalidates_identity_after_employment_revocation(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->correspondence($office, 'P4 operation-local authorization');
        $this->actingAs($actor);

        $service = app(AuthorizedSourceSearch::class);
        $this->assertSame(1, $service->search($actor, 'P4 operation-local')['meta']['total']);

        // The next invocation must query the live actor rather than reuse a
        // validated object or cached employee relation from the prior search.
        $actor->employee()->update(['employment_status' => 'separated']);

        $this->expectException(AuthorizationException::class);
        $service->search($actor, 'P4 operation-local');
    }

    public function test_verified_source_scope_rejects_context_from_another_signed_in_actor(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $other = $this->actor($this->office());

        $this->actingAs($actor);
        $verified = VerifiedMunicipalActor::forCurrentSession($actor);
        $this->actingAs($other);

        foreach ([
            fn () => app(CorrespondenceAccessDecider::class)
                ->scopeVisibleToVerifiedActor(CorrespondenceRecord::query(), $verified),
            fn () => app(TravelOrderAccess::class)
                ->scopeVisibleToVerifiedActor(TravelOrder::query(), $verified),
        ] as $scope) {
            try {
                $scope();
                $this->fail('Verified source scope must reject another signed-in actor.');
            } catch (AuthorizationException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_verified_source_scope_cannot_be_replayed_in_a_new_request(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->actingAs($actor);
        $verified = VerifiedMunicipalActor::forCurrentSession($actor);
        $originalRequest = request();

        try {
            app()->instance('request', Request::create('/different-request', 'GET'));

            $this->expectException(AuthorizationException::class);
            app(CorrespondenceAccessDecider::class)
                ->scopeVisibleToVerifiedActor(CorrespondenceRecord::query(), $verified);
        } finally {
            app()->instance('request', $originalRequest);
        }
    }

    public function test_inactive_office_and_inactive_user_are_denied(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->actingAs($actor);
        $office->update(['is_active' => false]);

        try {
            app(AuthorizedSourceSearch::class)->search($actor, 'record');
            $this->fail('Inactive office must not search.');
        } catch (AuthorizationException) {
            $this->assertTrue(true);
        }

        $office->update(['is_active' => true]);
        $actor->update(['is_active' => false]);
        $this->expectException(AuthorizationException::class);
        app(AuthorizedSourceSearch::class)->search($actor, 'record');
    }

    public function test_a_claimed_foreign_actor_cannot_borrow_another_session(): void
    {
        $office = $this->office();
        $own = $this->actor($office);
        $other = $this->actor($office);
        $this->actingAs($own);
        $this->expectException(AuthorizationException::class);
        app(AuthorizedSourceSearch::class)->search($other, 'record');
    }

    public function test_percent_underscore_backslash_and_quote_are_literal_not_wildcards(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->correspondence($office, "Budget 50%_\\' special marker");
        $this->correspondence($office, 'Budget 50ABC special marker');

        $this->actingAs($actor);
        $result = app(AuthorizedSourceSearch::class)->search($actor, "50%_\\'");

        $this->assertSame(1, $result['meta']['total']);
        $this->assertStringContainsString("50%_\\'", $result['data'][0]['title']);
    }

    public function test_search_result_link_is_reauthorized_at_the_destination_after_transfer(): void
    {
        $old = $this->office();
        $new = $this->office();
        $actor = $this->actor($old);
        $record = $this->correspondence($old, 'P4 transfer destination secret');

        $this->actingAs($actor);
        $results = app(AuthorizedSourceSearch::class)
            ->search($actor, 'P4 transfer destination secret', source: 'correspondence');
        $this->assertSame(1, $results['meta']['total']);
        $this->assertStringContainsString($record->public_id, $results['data'][0]['url']);

        // Search output is a navigation hint, not a durable authorization grant.
        $actor->employee()->update(['department_id' => $new->id]);
        $this->actingAs($actor->fresh('employee.department'));
        $this->get($results['data'][0]['url'])->assertForbidden();
    }

    public function test_pagination_limits_and_disallowed_domain_are_rejected(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $this->actingAs($actor);
        $service = app(AuthorizedSourceSearch::class);

        foreach ([
            fn () => $service->search($actor, 'item', 0),
            fn () => $service->search($actor, 'item', 1, 51),
            fn () => $service->search($actor, 'item', source: 'individual_task'),
            fn () => $service->search($actor, 'item', source: 'work_request'),
            fn () => $service->search($actor, str_repeat('x', 121)),
        ] as $invalid) {
            try {
                $invalid();
                $this->fail('Invalid request was not rejected.');
            } catch (InvalidArgumentException) {
                $this->assertTrue(true);
            }
        }
    }

    public function test_one_thousand_results_are_bounded_and_ordered_without_duplicate_pages(): void
    {
        $office = $this->office();
        $actor = $this->actor($office);
        $now = now();
        $rows = [];

        for ($i = 0; $i < 1000; $i++) {
            $rows[] = [
                'public_id' => (string) Str::uuid(),
                'external_reference_no' => 'P4-BULK-'.sprintf('%04d', $i),
                'source' => 'portal',
                'channel' => 'test',
                'sender_name' => 'Synthetic sender',
                'subject' => 'P4 scalable match',
                'received_at' => $now,
                'receiving_department_id' => $office->id,
                'classification' => CorrespondenceClassification::Internal->value,
                'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        foreach (array_chunk($rows, 200) as $batch) {
            CorrespondenceRecord::query()->insert($batch);
        }

        $this->actingAs($actor);
        DB::flushQueryLog();
        DB::enableQueryLog();
        try {
            $first = app(AuthorizedSourceSearch::class)->search($actor, 'P4 scalable', 1, 50);
            $second = app(AuthorizedSourceSearch::class)->search($actor, 'P4 scalable', 2, 50);
            $queryCount = count(DB::getQueryLog());
        } finally {
            DB::disableQueryLog();
            DB::flushQueryLog();
        }

        $this->assertSame(1000, $first['meta']['total']);
        $this->assertSame(1000, $second['meta']['total']);
        $this->assertCount(50, $first['data']);
        $this->assertCount(50, $second['data']);
        $this->assertTrue($first['meta']['has_more']);
        $this->assertEmpty(array_intersect(array_column($first['data'], 'key'), array_column($second['data'], 'key')));
        $this->assertLessThanOrEqual(12, $queryCount);
    }

    private function office(): Department
    {
        return Department::query()->create([
            'code' => 'P4-'.Str::upper(Str::random(8)),
            'name' => 'P4 Synthetic Office',
            'short_name' => 'P4',
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 10,
            'is_routable' => true,
            'is_active' => true,
        ]);
    }

    private function actor(Department $office): User
    {
        $user = User::query()->create([
            'name' => 'P4 Synthetic Actor',
            'email' => Str::lower(Str::random(16)).'@example.test',
            'password' => 'synthetic-only',
            'role' => 'department_head',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'P4-EMP-'.Str::upper(Str::random(12)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $office->id,
            'position_title' => 'Synthetic',
            'employment_status' => 'active',
        ]);

        return $user->fresh('employee.department');
    }

    private function correspondence(Department $office, string $title): CorrespondenceRecord
    {
        return CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'P4-COR-'.Str::upper(Str::random(12)),
            'source' => 'portal',
            'channel' => 'test',
            'sender_name' => 'Synthetic sender',
            'subject' => $title,
            'received_at' => now(),
            'receiving_department_id' => $office->id,
            'classification' => CorrespondenceClassification::Internal->value,
            'lifecycle_state' => CorrespondenceLifecycleState::Classified->value,
        ]);
    }

    private function makeTravelOrder(Department $office, Employee $employee, string $title, ?string $publicId = null): TravelOrder
    {
        $order = TravelOrder::query()->create([
            'public_id' => $publicId,
            'reference_number' => 'P4-TR-'.Str::upper(Str::random(12)),
            'issuance_date' => now()->toDateString(),
            'purpose' => $title,
            'destination' => 'Synthetic destination',
            'department_id' => $office->id,
            'travel_start_date' => now()->addDay()->toDateString(),
            'travel_end_date' => now()->addDays(2)->toDateString(),
            'status' => TravelOrderStatus::Approved,
        ]);
        $order->issuedTo()->sync([$employee->id]);

        return $order;
    }
}
