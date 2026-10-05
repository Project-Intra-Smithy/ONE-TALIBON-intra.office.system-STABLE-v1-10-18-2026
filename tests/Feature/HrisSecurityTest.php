<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class HrisSecurityTest extends TestCase
{
    public function test_full_hris_runtime_is_de_exposed_while_employee_directory_remains_registered(): void
    {
        $this->assertTrue(Route::has('employees.index'));
        $this->assertTrue(Route::has('employees.show'));

        foreach ([
            'hris',
            'hris.dtr',
            'hris.payroll',
            'hris.leave.store',
            'hris.health.access',
            'hris.health.access.store',
            'hris.health.access.revoke',
            'hris.health.show',
            'hris.health.store',
            'hris.admin',
            'hris.leave.approve',
            'hris.leave.reject',
            'hris.dtr.generate',
            'hris.dtr.lock',
            'hris.payroll.link-dtr',
            'hris.development.index',
            'hris.development.performance.store',
            'hris.development.record.store',
            'hris.development.expiry.sync',
            'hris.lifecycle.index',
            'hris.lifecycle.onboarding.store',
            'hris.lifecycle.onboarding.show',
            'hris.lifecycle.onboarding.tasks.complete',
            'hris.lifecycle.onboarding.complete',
            'hris.lifecycle.movements.store',
            'hris.lifecycle.movement.tasks.complete',
            'hris.offboarding.index',
            'hris.offboarding.store',
            'hris.offboarding.show',
            'hris.offboarding.tasks.complete',
            'hris.offboarding.finalize',
        ] as $routeName) {
            $this->assertFalse(Route::has($routeName), "Excluded Full HRIS route {$routeName} must not be registered.");
        }
    }
}
