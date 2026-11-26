<?php

declare(strict_types=1);

namespace Tests\Feature\WorkRequests;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\WorkRequestCreationOptions;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Gate;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

final class WorkRequestCreationOptionsTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_and_standalone_creation_share_real_filtered_options(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $originId = $actor->employee->department_id;
        $foreign = Department::query()->where('code', 'ENG')->firstOrFail();
        $inactive = Department::query()->where('code', 'BUDGET')->firstOrFail();
        $inactive->update(['is_active' => false]);
        $separated = Employee::query()->where('department_id', $foreign->id)->firstOrFail();
        $separated->update(['employment_status' => 'separated']);

        $response = $this->actingAs($actor)->get('/transactions/create')->assertOk();
        $props = json_decode(json_encode($response->viewData('page')['props']), true);
        $officeIds = array_column($props['departments'], 'id');
        $this->assertContains($foreign->id, $officeIds);
        $this->assertNotContains($originId, $officeIds);
        $this->assertNotContains($inactive->id, $officeIds);
        $this->assertNotContains($separated->id, array_column($props['assignableEmployees'], 'id'));
        foreach ($props['assignableEmployees'] as $employee) {
            $this->assertContains($employee['department_id'], $officeIds);
            $this->assertArrayNotHasKey('email', $employee);
            $this->assertArrayNotHasKey('password', $employee);
        }
        $this->actingAs($actor)->get('/transactions')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Transactions/Index')
            ->where('creationOptions.departments', $props['departments'])
            ->where('creationOptions.assignableEmployees', $props['assignableEmployees'])
            ->where('creationOptions.requestCategories', $props['requestCategories'])
            ->where('creationOptions.actionOptions', $props['actionOptions']));
    }

    public function test_denied_creation_does_not_serialize_options_on_the_register(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        Gate::before(fn ($user, string $ability) => $ability === 'create' ? false : null);
        $this->actingAs($actor)->get('/transactions')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->component('Transactions/Index')->where('creationOptions', null));
        $this->actingAs($actor)->get('/transactions/create')->assertForbidden();
        $this->expectException(AuthorizationException::class);
        app(WorkRequestCreationOptions::class)->for($actor);
    }

    public function test_empty_receiving_offices_are_real_empty_options_without_synthetic_fallback(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        Department::query()->where('id', '!=', $actor->employee->department_id)->update(['is_routable' => false]);
        $this->actingAs($actor)->get('/transactions')->assertOk()->assertInertia(fn (Assert $page) => $page
            ->where('creationOptions.departments', [])
            ->where('creationOptions.assignableEmployees', []));
    }

    public function test_stale_receiving_office_is_revalidated_when_the_shared_form_submits(): void
    {
        $this->seed();
        $actor = User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
        $target = Department::query()->where('code', 'ENG')->firstOrFail();
        $this->actingAs($actor)->get('/transactions')->assertOk();
        $target->update(['is_active' => false]);
        $before = WorkflowTransaction::count();
        $this->actingAs($actor)->post('/transactions', [
            'title' => 'Synthetic stale-option request', 'target_department_id' => $target->id,
            'request_category' => 'Planning & Development', 'request_type' => 'GIS / Mapping',
            'action_required' => 'For Review', 'priority' => 'normal',
        ])->assertSessionHasErrors('target_department_id');
        $this->assertSame($before, WorkflowTransaction::count());
    }
}
