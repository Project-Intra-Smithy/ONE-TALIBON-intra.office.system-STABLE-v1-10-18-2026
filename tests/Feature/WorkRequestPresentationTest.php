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
