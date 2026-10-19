<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Route;
use Tests\TestCase;

class HrisSecurityTest extends TestCase
{
    public function test_restored_hris_runtime_preserves_authentication_assurance_and_admin_boundaries(): void
    {
        $this->assertTrue(Route::has('employees.index'));
        $this->assertTrue(Route::has('employees.show'));

        $routes = [
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
        ];

        foreach ($routes as $routeName) {
            $this->assertTrue(Route::has($routeName), "Restored HRIS route {$routeName} must be registered.");
            $middleware = Route::getRoutes()->getByName($routeName)?->gatherMiddleware() ?? [];
            $this->assertContains('auth', $middleware, "{$routeName} must require authentication.");
            $this->assertContains('active', $middleware, "{$routeName} must require an active account.");
            $this->assertContains('mfa.assured', $middleware, "{$routeName} must require MFA assurance.");
        }

        foreach ([
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
            $middleware = Route::getRoutes()->getByName($routeName)?->gatherMiddleware() ?? [];
            $this->assertContains('hris.admin', $middleware, "{$routeName} must retain HRIS administrator authorization.");
        }
    }
}
