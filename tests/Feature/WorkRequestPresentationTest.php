<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\User;
use App\Models\WorkflowTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class WorkRequestPresentationTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_form_exposes_dynamic_contract_and_office_people(): void
    {
        $this->seed();
        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();

        $this->actingAs($employee)->get('/transactions/create')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Transactions/Create')
                ->where('requestCategories.Planning & Development.6', 'GIS / Mapping')
                ->where('requestCategories.Zoning / Land Use.0', 'Locational Clearance')
                ->where('requestCategories.Procurement.0', 'Purchase Request')
                ->where('requestCategories.ICT / Digital Systems.0', 'Technical Support')
                ->has('departments')
                ->has('assignableEmployees')
                ->has('actionOptions'));
    }

    public function test_employee_can_submit_persist_and_open_assigned_work_request_with_private_evidence(): void
    {
        $this->seed();
        Storage::fake('documents');

        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();
        $assignee = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail()->employee;
        $png = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl7sWcAAAAASUVORK5CYII=', true);
        $this->assertIsString($png);

        $response = $this->actingAs($employee)->post('/transactions', [
            'request_category' => 'Planning & Development',
            'request_type' => 'GIS / Mapping',
            'action_required' => 'For Review',
            'priority' => 'high',
            'target_department_id' => $engineering->id,
            'assigned_employee_id' => $assignee->id,
            'due_at' => now()->addDays(3)->toDateString(),
            'title' => 'Showcase GIS mapping work request',
            'description' => 'Prepare the requested planning map for review.',
            'evidence' => [UploadedFile::fake()->createWithContent('map-evidence.png', $png)],
        ]);

        $transaction = WorkflowTransaction::query()->where('title', 'Showcase GIS mapping work request')->firstOrFail();
        $response->assertRedirect(route('transactions.show', $transaction));

        $this->assertSame('Planning & Development', $transaction->request_category);
        $this->assertSame('GIS / Mapping', $transaction->request_type);
        $this->assertSame('For Review', $transaction->action_required);
        $this->assertSame($employee->employee->department_id, $transaction->origin_department_id);
        $this->assertSame($engineering->id, $transaction->current_department_id);
        $this->assertSame($assignee->id, $transaction->assigned_employee_id);
        $this->assertDatabaseCount('documents', 1);

        $this->actingAs($employee)->get(route('transactions.show', $transaction))->assertOk();
    }


    public function test_detail_return_context_is_validated_and_does_not_replace_work_request_visibility(): void
    {
        $this->seed();
        $head = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $foreign = User::query()->where('email', 'budget@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();

        $transaction = WorkflowTransaction::query()->create([
            'reference_no' => 'P2-RETURN-0001',
            'transaction_type' => 'internal_request',
            'title' => 'Issue 45 synthetic filtered Work Request',
            'priority' => 'high',
            'origin_department_id' => $engineering->id,
            'current_department_id' => $engineering->id,
            'created_by_user_id' => $head->id,
            'status' => 'submitted',
            'received_at' => now(),
        ]);

        $path = '/transactions/'.$transaction->id;
        $list = '/transactions?view=office_queue&search=P2-RETURN-0001&status=submitted&priority=high&office_id='.$engineering->id.'&page=2';

        $this->actingAs($head)->get('/transactions?view=office_queue&search=P2-RETURN-0001')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Transactions/Index')
                ->where('records.data.0.id', $transaction->id));

        $this->actingAs($head)->get($path.'?return_to='.rawurlencode($list))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Transactions/Show')
                ->where('transaction.id', $transaction->id)
                ->where('returnTo', $list));

        $this->actingAs($head)->get($path)
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->component('Transactions/Show')
                ->where('returnTo', '/transactions'));

        $this->actingAs($foreign)->get($path.'?return_to='.rawurlencode($list))
            ->assertForbidden();
    }

    public function test_detail_return_context_rejects_external_injected_and_malformed_candidates(): void
    {
        $this->seed();
        $head = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();
        $transaction = WorkflowTransaction::query()->create([
            'reference_no' => 'P2-BAD-RETURN-0001',
            'transaction_type' => 'internal_request',
            'title' => 'Issue 45 synthetic malicious return target',
            'priority' => 'normal',
            'origin_department_id' => $engineering->id,
            'current_department_id' => $engineering->id,
            'created_by_user_id' => $head->id,
            'status' => 'submitted',
        ]);
        $path = '/transactions/'.$transaction->id;

        foreach ([
            'https://example.invalid/steal',
            '//example.invalid/path',
            '/records',
            '/correspondence?view=all',
            '/transactions/other',
            '/transactions%2f..%2frecords',
            '/%74ransactions',
            '/transactions\\../records',
            '/transactions?search=%0Dmalicious',
            '/transactions?return_to=https%3A%2F%2Fexample.invalid',
            '/transactions?return_to%5Bchild%5D=%2F%2Fevil.invalid',
            str_repeat('/transactions?search=long', 100),
        ] as $candidate) {
            $this->actingAs($head)->get($path.'?return_to='.rawurlencode($candidate))
                ->assertOk()->assertInertia(fn (Assert $page) => $page
                    ->component('Transactions/Show')
                    ->where('returnTo', '/transactions'));
        }

        $this->actingAs($head)->get($path.'?return_to%5B0%5D=%2Ftransactions')
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('returnTo', '/transactions'));

        $this->actingAs($head)->get($path.'?return_to='.rawurlencode('/transactions?view=office_queue&return_to=//evil.invalid'))
            ->assertOk()->assertInertia(fn (Assert $page) => $page
                ->where('returnTo', '/transactions?view=office_queue'));
    }

    public function test_cross_office_assignee_is_rejected(): void
    {
        $this->seed();

        $employee = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $engineering = Department::query()->where('code', 'ENG')->firstOrFail();
        $budgetEmployee = User::query()->where('email', 'budget@talibon.demo')->firstOrFail()->employee;

        $this->actingAs($employee)->from('/transactions/create')->post('/transactions', [
            'request_category' => 'Planning & Development',
            'request_type' => 'Project Monitoring',
            'action_required' => 'For Appropriate Action',
            'priority' => 'normal',
            'target_department_id' => $engineering->id,
            'assigned_employee_id' => $budgetEmployee->id,
            'due_at' => now()->addDays(5)->toDateString(),
            'title' => 'Invalid cross-office assignment',
        ])->assertRedirect('/transactions/create')->assertSessionHasErrors('assigned_employee_id');

        $this->assertDatabaseMissing('transactions', ['title' => 'Invalid cross-office assignment']);
    }

    public function test_legacy_transaction_contract_remains_compatible(): void
    {
        $this->seed();

        $engineering = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $budget = Department::query()->where('code', 'BUDGET')->firstOrFail();

        $this->actingAs($engineering)->post('/transactions', [
            'transaction_type' => 'funding_request',
            'title' => 'Legacy workflow compatibility',
            'priority' => 'high',
            'target_department_id' => $budget->id,
        ])->assertRedirect();

        $this->assertDatabaseHas('transactions', [
            'title' => 'Legacy workflow compatibility',
            'transaction_type' => 'funding_request',
        ]);
    }
}
