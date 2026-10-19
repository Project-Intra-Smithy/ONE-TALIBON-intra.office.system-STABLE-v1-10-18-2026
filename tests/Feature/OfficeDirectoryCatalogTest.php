<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Services\AuthenticationAssurance;
use App\Services\OfficeDirectoryCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OfficeDirectoryCatalogTest extends TestCase
{
    use RefreshDatabase;

    /** @var array<string, int> */
    private const GROUP_COUNTS = [
        'Planning' => 1,
        'Executive' => 2,
        'Legislative' => 2,
        'Infrastructure' => 2,
        'Finance' => 4,
        'Administration' => 4,
        'Social' => 9,
        'Economic' => 8,
        'Environment' => 2,
        'Education' => 1,
        'Transport' => 1,
        'National Agency' => 1,
        'Community' => 1,
        'Community Partners' => 2,
    ];

    public function test_immutable_source_has_exact_complete_focal_catalog_and_group_order(): void
    {
        $raw = config('office_directory.entries');
        $this->assertCount(40, $raw);
        $this->assertCount(14, config('office_directory.groups'));
        $this->assertSame(array_keys(self::GROUP_COUNTS), config('office_directory.groups'));
        $this->assertSame(self::GROUP_COUNTS, array_count_values(array_column($raw, 'group')));
        $this->assertSame(array_map(static fn (int $n): string => sprintf('FOCAL-%03d', $n), range(1, 40)), array_column($raw, 'key'));
        $this->assertCount(40, array_unique(array_column($raw, 'name')));
        $this->assertCount(40, array_unique(array_column($raw, 'key')));
        foreach ($raw as $item) {
            foreach (['name', 'shortName', 'responsibility'] as $field) {
                $this->assertNotSame('', $item[$field]);
            }
        }
        // Full 40-row, all names, UTF-8 punctuation, group, service and mapping digest.
        $this->assertSame('bba6745fbb981cf47cd91abf9391cfe8cf2f8db1302862899050e15d7e87c768', hash('sha256', json_encode($raw, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR)));
    }

    public function test_missing_department_rows_never_delete_directory_cards_or_create_phantom_routing(): void
    {
        $result = app(OfficeDirectoryCatalog::class)->props();
        $this->assertCount(40, $result['directoryEntries']);
        $this->assertCount(14, $result['directoryGroups']);
        foreach ($result['directoryEntries'] as $entry) {
            $this->assertNull($entry['backingDepartmentCode']);
            $this->assertNull($entry['recordsHref']);
            $this->assertFalse($entry['routable']);
        }
        $this->assertSame(0, Department::query()->count());
    }

    public function test_exact_active_routable_department_code_is_the_only_mapping_source(): void
    {
        $routable = $this->department('MPDO', true, true);
        $inactive = $this->department('MAYOR', false, true);
        $disabled = $this->department('ENG', true, false);
        $before = Department::query()->orderBy('id')->pluck('code', 'id')->all();
        $result = collect(app(OfficeDirectoryCatalog::class)->props()['directoryEntries'])->keyBy('key');

        $this->assertSame($routable->code, $result['FOCAL-001']['backingDepartmentCode']);
        $this->assertTrue($result['FOCAL-001']['routable']);
        $this->assertSame($inactive->code, $result['FOCAL-002']['backingDepartmentCode']);
        $this->assertFalse($result['FOCAL-002']['routable']);
        $this->assertSame($disabled->code, $result['FOCAL-006']['backingDepartmentCode']);
        $this->assertFalse($result['FOCAL-006']['routable']);

        foreach (['FOCAL-003', 'FOCAL-025', 'FOCAL-037', 'FOCAL-039', 'FOCAL-040'] as $key) {
            $this->assertNull($result[$key]['backingDepartmentCode']);
            $this->assertFalse($result[$key]['routable']);
            $this->assertNull($result[$key]['recordsHref']);
        }
        $this->assertSame($before, Department::query()->orderBy('id')->pluck('code', 'id')->all());
        $this->assertSame(3, Department::query()->count());
    }

    public function test_employee_directory_view_preserves_existing_index_and_operational_summary(): void
    {
        $office = $this->department('MPDO', true, true);
        $actor = $this->human('department_staff', $office);
        $this->actingAs($actor)->get('/departments?view=directory')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Index')
                ->has('directoryEntries', 40)
                ->has('directoryGroups', 14)
                ->has('departments', 1)
                ->where('summary.offices', 1)
                ->missing('staffWorkload')
                ->missing('recentActivity')
                ->missing('metrics'));
    }

    public function test_head_default_still_workspace_but_explicit_directory_never_contains_workload(): void
    {
        $office = $this->department('MPDO', true, true);
        $head = $this->human('department_head', $office);
        $this->asAssured($head)->get('/departments')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->component('Departments/Workspace'));

        $this->asAssured($head)->get('/departments?view=directory')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Index')
                ->has('directoryEntries', 40)
                ->missing('staffWorkload')
                ->missing('recentActivity')
                ->missing('metrics')
                ->missing('oldestUnresolved'));
    }

    public function test_assured_system_admin_cannot_acquire_head_workload_from_query_view(): void
    {
        $office = $this->department('MPDO', true, true);
        $admin = $this->human('system_admin', $office);
        $response = $this->asAssured($admin)->get('/departments?view=directory')->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Index')
                ->has('directoryEntries', 40)
                ->missing('staffWorkload')
                ->missing('recentActivity'));
        $this->assertStringNotContainsString('PRIVATE-HOME-ADDRESS-SENTINEL', $response->getContent());
        $this->assertStringNotContainsString('PRIVATE-GSIS-SENTINEL', $response->getContent());
    }

    public function test_anonymous_request_cannot_read_directory_under_existing_middleware(): void
    {
        $this->get('/departments?view=directory')->assertRedirect(route('login'));
    }

    public function test_inactive_account_is_redirected_before_directory_projection(): void
    {
        $office = $this->department('MPDO', true, true);
        $actor = $this->human('department_staff', $office);
        $actor->forceFill(['is_active' => false])->save();

        $this->actingAs($actor)->get('/departments?view=directory')
            ->assertRedirect(route('login'));
    }

    public function test_mfa_pending_privileged_account_is_redirected_before_directory_projection(): void
    {
        $office = $this->department('MPDO', true, true);
        $admin = $this->human('system_admin', $office);
        $admin->forceFill([
            'mfa_secret' => 'local-test-only-mfa-secret',
            'mfa_confirmed_at' => now(),
            'mfa_version' => 1,
        ])->save();

        $this->actingAs($admin)->get('/departments?view=directory')
            ->assertRedirect(route('mfa.challenge'));
    }

    public function test_unknown_view_and_untrusted_catalog_key_cannot_create_departments(): void
    {
        $office = $this->department('MPDO', true, true);
        $actor = $this->human('department_staff', $office);
        $before = Department::query()->orderBy('id')->pluck('code', 'id')->all();

        $this->actingAs($actor)->get('/departments?view=FOCAL-039&receiver=FOCAL-040')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Departments/Index')
                ->has('directoryEntries', 40));
        $this->assertSame($before, Department::query()->orderBy('id')->pluck('code', 'id')->all());
    }

    private function department(string $code, bool $active, bool $routable): Department
    {
        return Department::query()->create([
            'code' => $code,
            'name' => 'Synthetic Department '.$code,
            'short_name' => $code,
            'branch' => 'executive',
            'office_type' => 'department',
            'sort_order' => 10,
            'is_active' => $active,
            'is_routable' => $routable,
        ]);
    }

    private function human(string $role, Department $department): User
    {
        $user = User::query()->create([
            'name' => 'Catalog Test Actor',
            'email' => 'catalog-'.$role.'@example.test',
            'password' => 'password',
            'role' => $role,
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'CAT-'.strtoupper($role),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic Test Officer',
            'employment_status' => 'active',
        ]);
        return $user->fresh('employee.department');
    }

    private function asAssured(User $user): static
    {
        $user->forceFill([
            'mfa_secret' => 'r17-local-synthetic-only',
            'mfa_confirmed_at' => now(),
            'mfa_version' => 1,
        ])->save();

        return $this->actingAs($user)->withSession([
            AuthenticationAssurance::SESSION_USER_KEY => $user->id,
            AuthenticationAssurance::SESSION_VERSION_KEY => 1,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
        ]);
    }
}
