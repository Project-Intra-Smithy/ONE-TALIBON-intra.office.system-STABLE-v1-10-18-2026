<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class HrisSecurityTest extends TestCase
{
    public function test_only_directory_presence_and_self_attendance_are_active_people_routes(): void
    {
        foreach (['employees.index', 'employees.show', 'employees.presence', 'hris', 'hris.attendance'] as $routeName) {
            $this->assertTrue(Route::has($routeName), "People route {$routeName} must exist.");
            $middleware = Route::getRoutes()->getByName($routeName)?->gatherMiddleware() ?? [];
            $this->assertContains('auth', $middleware);
            $this->assertContains('active', $middleware);
            $this->assertContains('mfa.assured', $middleware);
        }

        foreach ([
            'hris.dtr', 'hris.payroll', 'hris.leave.store',
            'hris.health.access', 'hris.health.access.store', 'hris.health.access.revoke',
            'hris.health.show', 'hris.health.store',
            'hris.admin', 'hris.leave.approve', 'hris.leave.reject',
            'hris.dtr.generate', 'hris.dtr.lock', 'hris.payroll.link-dtr',
            'hris.development.index', 'hris.development.performance.store',
            'hris.development.record.store', 'hris.development.expiry.sync',
            'hris.lifecycle.index', 'hris.lifecycle.onboarding.store',
            'hris.lifecycle.onboarding.show', 'hris.lifecycle.onboarding.tasks.complete',
            'hris.lifecycle.onboarding.complete', 'hris.lifecycle.movements.store',
            'hris.lifecycle.movement.tasks.complete', 'hris.offboarding.index',
            'hris.offboarding.store', 'hris.offboarding.show',
            'hris.offboarding.tasks.complete', 'hris.offboarding.finalize',
        ] as $routeName) {
            $this->assertFalse(Route::has($routeName), "Deferred HRIS route {$routeName} must not be registered.");
        }
    }
}
