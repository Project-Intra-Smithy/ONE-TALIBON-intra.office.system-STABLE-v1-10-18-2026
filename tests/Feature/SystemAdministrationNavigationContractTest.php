<?php

namespace Tests\Feature;

use Tests\TestCase;

class SystemAdministrationNavigationContractTest extends TestCase
{
    public function test_system_navigation_remains_server_authoritative_under_current_navigation_modules(): void
    {
        $layout = file_get_contents(resource_path('js/layouts/AppLayout.tsx'));
        $navigation = file_get_contents(resource_path('js/navigation/portalNavigation.ts'));
        $access = file_get_contents(resource_path('js/navigation/navigationAccess.ts'));
        $destinations = file_get_contents(resource_path('js/navigation/navigationDestinations.ts'));
        $routePlan = file_get_contents(resource_path('js/navigation/navigationRoutePlan.ts'));

        $this->assertIsString($layout);
        $this->assertIsString($navigation);
        $this->assertIsString($access);
        $this->assertIsString($destinations);
        $this->assertIsString($routePlan);

        $activeNavigation = implode("\n", [$layout, $navigation, $access, $destinations, $routePlan]);

        $this->assertStringContainsString('pageProps.permissions?.navigation', $layout);
        $this->assertStringContainsString('pageProps.permissions?.reports', $layout);
        $this->assertStringContainsString('pageProps.permissions?.reports && navigation.reports', $layout);
        $this->assertStringContainsString('buildPortalNavigation(', $layout);
        $this->assertStringContainsString('isPortalDestinationVisible(destination, experience, permissions)', $navigation);
        $this->assertStringContainsString('permissions[destination.permission]', $access);
        $this->assertStringContainsString("systemAdministration: '/admin'", $routePlan);
        $this->assertStringContainsString("permission: 'systemAdministration'", $destinations);
        $this->assertStringContainsString("users: { key: 'users', label: 'Users'", $destinations);
        $this->assertStringContainsString("adminDepartments: { key: 'adminDepartments', label: 'Departments'", $destinations);

        foreach ([
            'systemAdministration' => 'wired',
            'users' => 'integration_pending',
            'adminDepartments' => 'integration_pending',
        ] as $destinationKey => $readiness) {
            $pattern = '/'.preg_quote($destinationKey, '/').": \\{ key: '".preg_quote($destinationKey, '/')."'[^\\n]*readiness: '".preg_quote($readiness, '/')."'/";
            $this->assertSame(1, preg_match($pattern, $destinations), "Expected {$destinationKey} readiness to remain {$readiness}.");
        }

        $this->assertStringNotContainsString('includes(user?.role', $activeNavigation);
        $this->assertStringNotContainsString("user?.role ===", $activeNavigation);
        $this->assertStringNotContainsString('Audit & Security', $destinations);
    }
}
