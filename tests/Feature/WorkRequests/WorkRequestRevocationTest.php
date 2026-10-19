<?php

namespace Tests\Feature\WorkRequests;

use App\Http\Middleware\HandleInertiaRequests;
use App\Models\CalendarEvent;
use App\Models\Department;
use App\Models\Document;
use App\Models\Employee;
use App\Models\LeaveRequest;
use App\Models\LegislativeAgendaItem;
use App\Models\LegislativeSession;
use App\Models\PlatformNotification;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CalendarService;
use App\Services\CalendarWorkspaceQueryService;
use App\Services\MayorOfficeWorkspaceQuery;
use App\Services\NotificationFeedQuery;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class WorkRequestRevocationTest extends TestCase
{
    use RefreshDatabase;

    /** @return array<string, string> */
    private function inertiaHeaders(): array
    {
        return [
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) app(HandleInertiaRequests::class)->version(request()),
        ];
    }

    public function test_separated_privileged_actor_loses_all_policy_actions_and_query_access_with_stale_relations(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);

        $this->assertTrue(Gate::forUser($admin)->allows('view', $transaction));
        $this->assertTrue(app(TransactionVisibilityQuery::class)->canViewAll($admin));

        $admin->load('employee.department'); // deliberately cached authority
        $admin->employee()->update(['employment_status' => 'separated']);

        $this->assertRevoked($admin, $transaction);
        $this->assertMayorWorkspaceDenied($admin);
        $this->assertSame('submitted', $transaction->fresh()->status);
        $this->assertSame(0, $transaction->events()->count());
    }

    public function test_inactive_department_revokes_even_system_administrator_and_mayor_workspace(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);

        $admin->load('employee.department');
        $admin->employee->department->update(['is_active' => false]);

        $this->assertRevoked($admin, $transaction);
        $this->assertMayorWorkspaceDenied($admin);
    }

    public function test_inactive_user_and_detached_employee_fail_closed(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);

        $admin->update(['is_active' => false]);
        $this->assertRevoked($admin, $transaction);

        // An active User without an Employee must never inherit role authority.
        $orphan = User::query()->create([
            'name' => 'Unlinked role',
            'email' => 'unlinked-wr95@example.test',
            'password' => 'disposable-test-password',
            'role' => 'system_admin',
            'is_active' => true,
        ]);
        $this->assertRevoked($orphan, $transaction);
    }

    public function test_transfer_removes_stale_office_access_without_changing_existing_transactions(): void
    {
        $this->seed();
        $actor = $this->user('engineering@talibon.demo');
        $origin = $actor->employee->department;
        $other = Department::query()->where('code', 'BUDGET')->firstOrFail();
        $transaction = $this->transaction($actor, $origin);

        $visibility = app(TransactionVisibilityQuery::class);
        $this->assertSame(1, $visibility->scope($actor)->whereKey($transaction->id)->count());

        $actor->load('employee.department');
        $actor->employee()->update(['department_id' => $other->id]);

        $this->assertSame(0, $visibility->scope($actor)->whereKey($transaction->id)->count());
        $this->assertFalse(Gate::forUser($actor)->allows('view', $transaction));
        $this->assertSame($origin->id, $transaction->fresh()->origin_department_id);
    }

    public function test_separated_administrator_cannot_read_work_request_titles_via_employee_profile(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $employee = $admin->employee;
        $transaction = $this->transaction($admin, $employee->department);
        $transaction->update(['assigned_employee_id' => $employee->id]);

        $before = $this->actingAs($admin)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('employees.show', $employee));
        $before->assertOk();
        // Seeded assignments may appear ahead of this fixture; order is not
        // part of the revocation contract. Assert set membership instead.
        $this->assertContains(
            $transaction->id,
            array_column($before->json('props.activeAssignments'), 'id'),
        );

        $employee->update(['employment_status' => 'separated']);

        $this->actingAs($admin)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('employees.show', $employee))
            ->assertForbidden();
    }

    public function test_separated_administrator_cannot_read_work_request_via_legislative_aggregates_or_agenda(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $office = Department::query()->where('code', 'SB')->firstOrFail();
        $transaction = $this->transaction($admin, $office);

        $session = LegislativeSession::query()->create([
            'session_code' => 'P1-REVOKE-AGENDA',
            'session_type' => 'regular',
            'title' => 'P1 security agenda fixture',
            'scheduled_at' => now()->addDay(),
            'status' => 'scheduled',
            'created_by_user_id' => $admin->id,
        ]);
        LegislativeAgendaItem::query()->create([
            'legislative_session_id' => $session->id,
            'sequence_no' => 1,
            'title' => 'Agenda entry',
            'transaction_id' => $transaction->id,
            'status' => 'pending',
        ]);

        $this->actingAs($admin)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('legislative.workspace'))
            ->assertOk()
            ->assertJsonPath('props.sessions.0.agenda_items.0.transaction.id', $transaction->id);

        $admin->employee()->update(['employment_status' => 'separated']);

        $this->actingAs($admin)
            ->withHeaders($this->inertiaHeaders())
            ->get(route('legislative.workspace'))
            ->assertForbidden();
    }

    public function test_calendar_drops_cached_work_request_deadline_after_privileged_employee_revocation(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);
        app(CalendarService::class)->syncTransactionDue($transaction);

        $calendar = app(CalendarWorkspaceQueryService::class);
        $today = now()->toDateString();
        $this->assertTrue(collect($calendar->workspace($admin, 'month', $today)['events'])
            ->contains('title', $transaction->reference_no.' due · '.$transaction->title));

        $admin->employee()->update(['employment_status' => 'separated']);

        $this->assertFalse(collect($calendar->workspace($admin, 'month', $today)['events'])
            ->contains('title', $transaction->reference_no.' due · '.$transaction->title));
    }

    public function test_cached_platform_transaction_notification_is_removed_after_revocation(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);
        $notification = PlatformNotification::query()->create([
            'user_id' => $admin->id,
            'department_id' => $admin->employee->department_id,
            'event_key' => 'p1-95-'.$transaction->id,
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $transaction->id,
            'priority' => 'info',
            'title' => $transaction->title,
            'message' => 'Protected transaction reference',
            'action_url' => '/transactions/'.$transaction->id,
        ]);

        $feed = app(NotificationFeedQuery::class);
        $this->assertTrue(collect($feed->feed($admin)['notifications'])
            ->contains('key', 'platform-'.$notification->id));

        $admin->employee()->update(['employment_status' => 'separated']);

        $this->assertFalse(collect($feed->feed($admin)['notifications'])
            ->contains('key', 'platform-'.$notification->id));
    }

    public function test_retained_session_cannot_read_or_mutate_work_request_or_download_evidence_after_separation(): void
    {
        $this->seed();
        Storage::fake('documents');
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);
        $secret = 'P1-H-PRIVATE-EVIDENCE-BYTES';
        Storage::disk('documents')->put('p1-h/revoked.txt', $secret);

        $document = Document::query()->create([
            'title' => 'P1-H classified attachment',
            'document_type' => 'supporting_document',
            'classification' => 'internal',
            'original_name' => 'revoked.txt',
            'mime_type' => 'text/plain',
            'storage_disk' => 'documents',
            'storage_path' => 'p1-h/revoked.txt',
            'owner_department_id' => $admin->employee->department_id,
            'uploaded_by_user_id' => $admin->id,
        ]);
        $document->links()->create([
            'linkable_type' => $transaction->getMorphClass(),
            'linkable_id' => $transaction->id,
            'relationship' => 'supporting_document',
            'created_by_user_id' => $admin->id,
        ]);

        $this->actingAs($admin)->get(route('transactions.show', $transaction))->assertOk();
        $this->actingAs($admin)->get(route('transactions.live', $transaction))->assertOk();
        $this->actingAs($admin)->get(route('documents.download', $document))->assertOk();

        $admin->load('employee.department');
        $admin->employee()->update(['employment_status' => 'separated']);
        $originalEvents = $transaction->events()->count();

        foreach ([
            route('transactions.show', $transaction),
            route('transactions.live', $transaction),
            route('documents.download', $document),
        ] as $url) {
            $response = $this->actingAs($admin)->get($url)->assertForbidden();
            $this->assertStringNotContainsString($secret, $response->getContent());
            $this->assertStringNotContainsString($transaction->title, $response->getContent());
            $this->assertStringNotContainsString($document->title, $response->getContent());
        }

        $this->actingAs($admin)
            ->post(route('transactions.transition', $transaction), [
                'action' => 'mark_review',
                'remarks' => 'MUST NOT PERSIST',
            ])->assertForbidden();

        $this->assertSame('submitted', $transaction->fresh()->status);
        $this->assertSame($originalEvents, $transaction->events()->count());
        $this->assertDatabaseMissing('transaction_events', [
            'transaction_id' => $transaction->id,
            'remarks' => 'MUST NOT PERSIST',
        ]);
    }

    public function test_private_employee_profiles_are_denied_after_separation_or_department_deactivation(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $target = $this->user('engineering@talibon.demo')->employee;
        $target->update([
            'tin_number' => '999-888-777-001',
            'personal_email' => 'protected-p1h@example.test',
        ]);

        $url = route('employees.show', $target);
        $this->actingAs($admin)->withHeaders($this->inertiaHeaders())
            ->get($url)->assertOk()
            ->assertJsonPath('props.privateProfile.government_ids.tin', '999-888-777-001');

        $admin->load('employee.department');
        $admin->employee()->update(['employment_status' => 'separated']);
        $separated = $this->actingAs($admin)->withHeaders($this->inertiaHeaders())
            ->get($url)->assertForbidden();
        $this->assertStringNotContainsString('999-888-777-001', $separated->getContent());
        $this->assertStringNotContainsString('protected-p1h@example.test', $separated->getContent());

        $admin->employee()->update(['employment_status' => 'active']);
        $admin->employee->department->update(['is_active' => false]);
        $this->actingAs($admin)->get($url)->assertForbidden();
    }

    public function test_retained_administrator_session_cannot_create_legislative_sessions_or_agenda_after_revocation(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $session = LegislativeSession::query()->create([
            'session_code' => 'P1-H-CURRENT',
            'session_type' => 'regular',
            'title' => 'P1-H SECRET LEGISLATIVE TITLE',
            'scheduled_at' => now()->addDay(),
            'status' => 'scheduled',
            'created_by_user_id' => $admin->id,
        ]);

        $admin->load('employee.department');
        $admin->employee()->update(['employment_status' => 'separated']);

        $response = $this->actingAs($admin)->get(route('legislative.workspace'))->assertForbidden();
        $this->assertStringNotContainsString($session->title, $response->getContent());

        $this->actingAs($admin)->post(route('legislative.sessions.store'), [
            'session_code' => 'P1-H-FORBIDDEN',
            'session_type' => 'regular',
            'title' => 'MUST NOT CREATE',
            'scheduled_at' => now()->addDays(2)->toDateTimeString(),
        ])->assertForbidden();
        $this->actingAs($admin)->post(route('legislative.sessions.agenda.store', $session), [
            'sequence_no' => 1,
            'title' => 'MUST NOT CREATE AGENDA',
        ])->assertForbidden();

        $this->assertDatabaseMissing('legislative_sessions', ['session_code' => 'P1-H-FORBIDDEN']);
        $this->assertDatabaseMissing('legislative_agenda_items', ['title' => 'MUST NOT CREATE AGENDA']);
        $this->assertDatabaseMissing('calendar_events', ['event_key' => 'legislative-session-P1-H-FORBIDDEN']);

        $admin->employee()->update(['employment_status' => 'active']);
        $admin->employee->department->update(['is_active' => false]);
        $this->actingAs($admin)->get(route('legislative.workspace'))->assertForbidden();
        $this->actingAs($admin)->post(route('legislative.sessions.store'), [
            'session_code' => 'P1-H-INACTIVE',
            'session_type' => 'regular',
            'title' => 'MUST NOT CREATE INACTIVE',
            'scheduled_at' => now()->addDays(3)->toDateTimeString(),
        ])->assertForbidden();
        $this->assertDatabaseMissing('legislative_sessions', ['session_code' => 'P1-H-INACTIVE']);
    }

    public function test_notification_tuple_collisions_and_stale_cached_links_are_concealed(): void
    {
        $this->seed();
        $actor = $this->user('engineering@talibon.demo');
        $allowed = $this->transaction($actor, $actor->employee->department);
        $budget = Department::query()->where('code', 'BUDGET')->firstOrFail();
        $foreign = $this->transaction($this->user('budget@talibon.demo'), $budget);
        $this->assertSame(1, app(TransactionVisibilityQuery::class)->scope($actor)->whereKey($allowed)->count());
        $this->assertSame(0, app(TransactionVisibilityQuery::class)->scope($actor)->whereKey($foreign)->count());

        foreach ([
            ['legacy', 'legacy_unknown', null, $allowed->id],
            ['wrong-domain', 'unrelated', WorkflowTransaction::class, $allowed->id],
            ['wrong-type', 'transaction', LeaveRequest::class, $allowed->id],
            ['alias', 'work_request', WorkflowTransaction::class, $allowed->id],
            ['foreign', 'transaction', WorkflowTransaction::class, $foreign->id],
        ] as [$key, $domain, $type, $id]) {
            PlatformNotification::query()->create([
                'user_id' => $actor->id,
                'event_key' => 'p1-h-'.$key,
                'source_domain' => $domain,
                'source_type' => $type,
                'source_id' => $id,
                'title' => 'P1-H-LEAK-'.$key,
                'message' => 'P1-H-FOREIGN-METADATA',
                'priority' => 'info',
                'action_url' => '/transactions/'.$foreign->id,
            ]);
        }

        $valid = PlatformNotification::query()->create([
            'user_id' => $actor->id,
            'event_key' => 'p1-h-valid',
            'source_domain' => 'transaction',
            'source_type' => WorkflowTransaction::class,
            'source_id' => $allowed->id,
            'title' => 'P1-H-AUTHORIZED',
            'message' => 'Authorized source notification',
            'priority' => 'info',
            // Attempt to poison cached destination independently of source ID.
            'action_url' => '/transactions/'.$foreign->id,
        ]);

        $result = app(NotificationFeedQuery::class)->feed($actor);
        $this->assertSame(1, $result['unreadPlatformNotificationCount']);
        $this->assertTrue(collect($result['notifications'])->contains('key', 'platform-'.$valid->id));
        $this->assertFalse(collect($result['notifications'])->contains('message', 'P1-H-FOREIGN-METADATA'));
        $projected = collect($result['notifications'])->firstWhere('key', 'platform-'.$valid->id);
        $this->assertSame('/transactions/'.$allowed->id, $projected['url']);
        $this->assertStringNotContainsString('P1-H-LEAK-', json_encode($result));

        $actor->employee()->update(['employment_status' => 'separated']);
        $revoked = app(NotificationFeedQuery::class)->feed($actor);
        $this->assertSame(0, $revoked['unreadPlatformNotificationCount']);
        $this->assertSame(0, $revoked['notificationCount']);
        $this->assertSame([], $revoked['notifications']);
        $this->assertStringNotContainsString('P1-H-AUTHORIZED', json_encode($revoked));
    }

    public function test_calendar_rejects_legacy_and_colliding_transaction_metadata(): void
    {
        $this->seed();
        $admin = $this->user('admin@talibon.demo');
        $transaction = $this->transaction($admin, $admin->employee->department);
        app(CalendarService::class)->syncTransactionDue($transaction);
        $today = now()->toDateString();

        foreach ([
            ['bad-domain', 'work_request', WorkflowTransaction::class],
            ['bad-type', 'transaction', LeaveRequest::class],
            ['legacy', 'legacy_unknown', null],
        ] as [$key, $domain, $type]) {
            CalendarEvent::query()->create([
                'event_key' => 'p1-h-calendar-'.$key,
                'scope' => 'municipality',
                'event_type' => 'transaction_due',
                'source_domain' => $domain,
                'source_type' => $type,
                'source_id' => $transaction->id,
                'title' => 'P1-H-LEAK-'.$key,
                'starts_at' => now()->addDay(),
                'all_day' => true,
                'action_url' => '/transactions/'.$transaction->id,
                'status' => 'scheduled',
            ]);
        }

        $workspace = app(CalendarWorkspaceQueryService::class);
        $visible = json_encode($workspace->workspace($admin, 'month', $today)['events']);
        $this->assertStringNotContainsString('P1-H-LEAK-', $visible);
        $this->assertStringContainsString($transaction->title, $visible);

        $admin->load('employee.department');
        $admin->employee()->update(['employment_status' => 'separated']);
        $revoked = json_encode($workspace->workspace($admin, 'month', $today)['events']);
        $this->assertStringNotContainsString($transaction->title, $revoked);
        $this->assertStringNotContainsString('/transactions/'.$transaction->id, $revoked);
        $this->assertSame(0, count($workspace->workspace($admin, 'month', $today)['events']));
    }

    public function test_office_transfer_invalidates_cached_privileged_views_without_unrelated_mutation(): void
    {
        $this->seed();
        $actor = $this->user('engineering@talibon.demo');
        $transaction = $this->transaction($actor, $actor->employee->department);
        $this->actingAs($actor)->get(route('transactions.show', $transaction))->assertOk();

        $actor->load('employee.department');
        $nextOffice = Department::query()->where('code', 'BUDGET')->firstOrFail();
        $actor->employee()->update(['department_id' => $nextOffice->id]);

        $this->actingAs($actor)->get(route('transactions.show', $transaction))->assertForbidden();
        $this->actingAs($actor)->get(route('transactions.live', $transaction))->assertForbidden();
        $this->assertSame('submitted', $transaction->fresh()->status);
        $this->assertSame(0, $transaction->events()->count());
    }

    private function assertRevoked(User $actor, WorkflowTransaction $transaction): void
    {
        foreach (['viewAny', 'create'] as $ability) {
            $this->assertFalse(Gate::forUser($actor)->allows($ability, WorkflowTransaction::class), $ability);
        }

        foreach (['view', 'transition', 'assign', 'mayorDecision'] as $ability) {
            $this->assertFalse(Gate::forUser($actor)->allows($ability, $transaction), $ability);
        }

        $visibility = app(TransactionVisibilityQuery::class);
        $this->assertFalse($visibility->canViewAll($actor));
        $this->assertSame(0, $visibility->scope($actor)->count());
    }

    private function assertMayorWorkspaceDenied(User $actor): void
    {
        try {
            app(MayorOfficeWorkspaceQuery::class)->workspace($actor);
            $this->fail('Revoked actor reached Mayor Work Request workspace.');
        } catch (HttpException $exception) {
            $this->assertSame(403, $exception->getStatusCode());
        }
    }

    private function user(string $email): User
    {
        return User::query()->where('email', $email)->with('employee.department')->firstOrFail();
    }

    private function transaction(User $creator, Department $office): WorkflowTransaction
    {
        return WorkflowTransaction::query()->create([
            'reference_no' => 'WR95-'.uniqid(),
            'transaction_type' => 'internal_request',
            'title' => 'Revocation boundary '.uniqid(),
            'priority' => 'normal',
            'origin_department_id' => $office->id,
            'current_department_id' => $office->id,
            'created_by_user_id' => $creator->id,
            'status' => 'submitted',
            'received_at' => now(),
            'due_at' => now()->addDays(3),
        ]);
    }
}
