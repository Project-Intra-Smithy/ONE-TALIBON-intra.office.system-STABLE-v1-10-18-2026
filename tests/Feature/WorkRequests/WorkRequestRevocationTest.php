<?php

namespace Tests\Feature\WorkRequests;

use App\Models\Department;
use App\Models\LegislativeAgendaItem;
use App\Models\LegislativeSession;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\MayorOfficeWorkspaceQuery;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

final class WorkRequestRevocationTest extends TestCase
{
    use RefreshDatabase;

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

        $this->actingAs($admin)
            ->withHeaders(['X-Inertia' => 'true'])
            ->get(route('employees.show', $employee))
            ->assertOk()
            ->assertJsonPath('props.activeAssignments.0.id', $transaction->id);

        $employee->update(['employment_status' => 'separated']);

        $this->actingAs($admin)
            ->withHeaders(['X-Inertia' => 'true'])
            ->get(route('employees.show', $employee))
            ->assertOk()
            ->assertJsonPath('props.activeAssignments', []);
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
            ->withHeaders(['X-Inertia' => 'true'])
            ->get(route('legislative.workspace'))
            ->assertOk()
            ->assertJsonPath('props.sessions.0.agenda_items.0.transaction.id', $transaction->id);

        $admin->employee()->update(['employment_status' => 'separated']);

        $this->actingAs($admin)
            ->withHeaders(['X-Inertia' => 'true'])
            ->get(route('legislative.workspace'))
            ->assertOk()
            ->assertJsonPath('props.legislativeWork', [])
            ->assertJsonPath('props.sessions.0.agenda_items.0.transaction', null)
            ->assertJsonPath('props.sessions.0.agenda_items.0.transaction_id', null);
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
