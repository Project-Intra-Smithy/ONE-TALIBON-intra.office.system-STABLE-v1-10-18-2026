<?php

namespace Tests\Feature;

use App\Models\Employee;
use App\Models\User;
use Database\Seeders\MunicipalityStructureSeeder;
use Database\Seeders\WorkforceDemoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WorkforceShowcasePersonaTest extends TestCase
{
    use RefreshDatabase;

    public function test_showcase_accounts_cover_required_representatives_without_growing_testing_workforce(): void
    {
        $this->seed([MunicipalityStructureSeeder::class, WorkforceDemoSeeder::class]);

        $this->assertSame(40, Employee::query()->count());

        $expected = [
            'admin@talibon.demo' => 'system_admin',
            'mayor@talibon.demo' => 'mayor_approver',
            'planning@talibon.demo' => 'department_head',
            'engineering@talibon.demo' => 'department_head',
            'budget@talibon.demo' => 'department_head',
            'hr@talibon.demo' => 'hr_officer',
            'legislative@talibon.demo' => 'legislative_staff',
            'employee@talibon.demo' => 'employee',
        ];

        foreach ($expected as $email => $role) {
            $user = User::query()->where('email', $email)->firstOrFail();
            $this->assertSame($role, $user->role);
            $this->assertTrue($user->is_active);
            $this->assertNotNull($user->employee);
        }

        $this->assertSame('MPDO', User::query()->where('email', 'planning@talibon.demo')->firstOrFail()->employee->department->code);
    }
}
