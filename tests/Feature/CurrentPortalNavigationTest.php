<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Route;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class CurrentPortalNavigationTest extends TestCase
{
    use RefreshDatabase;

    public function test_current_one_talibon_navigation_uses_authority_modules_and_current_wired_scope(): void
    {
        $layout = file_get_contents(resource_path('js/layouts/AppLayout.tsx'));
        $navigation = file_get_contents(resource_path('js/navigation/portalNavigation.ts'));
        $access = file_get_contents(resource_path('js/navigation/navigationAccess.ts'));
        $destinations = file_get_contents(resource_path('js/navigation/navigationDestinations.ts'));
        $routePlan = file_get_contents(resource_path('js/navigation/navigationRoutePlan.ts'));
        $order = file_get_contents(resource_path('js/navigation/navigationOrder.ts'));

        $this->assertIsString($layout);
        $this->assertIsString($navigation);
        $this->assertIsString($access);
        $this->assertIsString($destinations);
        $this->assertIsString($routePlan);
        $this->assertIsString($order);

        $activeNavigation = implode("\n", [$layout, $navigation, $access, $destinations, $routePlan]);

        $this->assertStringContainsString('pageProps.permissions?.navigation', $layout);
        $this->assertStringContainsString('pageProps.permissions?.reports && navigation.reports', $layout);
        $this->assertStringContainsString('isPortalDestinationVisible(destination, experience, permissions)', $navigation);
        $this->assertStringContainsString('permissions[destination.permission]', $access);
        $this->assertStringContainsString('workspaceExperience', $layout);

        foreach ([
            'documentCenter' => 'wired',
            'myWork' => 'wired',
            'employeeDirectory' => 'wired',
            'messages' => 'wired',
            'systemAdministration' => 'wired',
            'procurementTracking' => 'integration_pending',
            'announcements' => 'integration_pending',
            'meetings' => 'integration_pending',
            'projectMonitoring' => 'integration_pending',
            'users' => 'integration_pending',
            'adminDepartments' => 'integration_pending',
            'municipalSystems' => 'integration_pending',
        ] as $destinationKey => $readiness) {
            $pattern = '/'.preg_quote($destinationKey, '/').": \\{ key: '".preg_quote($destinationKey, '/')."'[^\\n]*readiness: '".preg_quote($readiness, '/')."'/";
            $this->assertSame(1, preg_match($pattern, $destinations), "Expected {$destinationKey} readiness to remain {$readiness}.");
        }

        foreach ([
            "home: '/dashboard'", "myWork: '/transactions'", "correspondence: '/correspondence'", "procurementTracking: '/procurement'", "records: '/records'", "memoranda: '/memoranda'", "announcements: '/announcements'", "calendar: '/calendar'", "meetings: '/meetings'", "messages: '/messages'", "executiveDepartments: '/departments'", "employeeDirectory: '/employees'", "legislative: '/legislation'", "localSpecialBodies: '/local-special-bodies'", "developmentPlans: '/development-plans'", "ppas: '/ppas'", "projectMonitoring: '/operations'", "systemAdministration: '/admin'", "municipalSystems: '/municipal-systems'",
        ] as $routeContract) {
            $this->assertStringContainsString($routeContract, $routePlan);
        }

        $this->assertStringContainsString("procurementTracking: { key: 'procurementTracking', label: 'Procurement / PR Tracking'", $destinations);
        $this->assertStringContainsString("employeeDirectory: { key: 'employeeDirectory', label: 'Employee & Office Directory'", $destinations);
        $this->assertStringContainsString("icon: Users, group: 'people', readiness: 'wired'", $destinations);

        $workOrder = ["'documentCenter'", "'myWork'", "'correspondence'", "'procurementTracking'", "'employeeDirectory'", "'records'", "'memoranda'", "'announcements'", "'calendar'", "'meetings'", "'messages'"];
        $cursor = -1;
        foreach ($workOrder as $destinationKey) {
            $position = strpos($order, $destinationKey);
            $this->assertNotFalse($position, "Expected {$destinationKey} in navigation order.");
            $this->assertGreaterThan($cursor, $position, "Expected {$destinationKey} to preserve Work ordering.");
            $cursor = $position;
        }

        $this->assertStringContainsString("users: { key: 'users', label: 'Users'", $destinations);
        $this->assertStringContainsString("adminDepartments: { key: 'adminDepartments', label: 'Departments'", $destinations);
        $this->assertStringContainsString("readiness: 'integration_pending', permission: 'systemAdministration'", $destinations);
        $this->assertStringNotContainsString('Audit & Security', $destinations);
        $this->assertStringNotContainsString("audit: {", $destinations);
        $this->assertStringNotContainsString('includes(user?.role', $activeNavigation);
        $this->assertStringNotContainsString("user?.role ===", $activeNavigation);
    }

    public function test_grouped_navigation_preserves_current_municipal_labels_without_legacy_engineering_sections(): void
    {
        $destinations = file_get_contents(resource_path('js/navigation/navigationDestinations.ts'));
        $this->assertIsString($destinations);

        foreach (['Search Portal', 'Document Center', 'Home', 'Work Requests', 'Correspondence', 'Procurement / PR Tracking', 'Employee & Office Directory', 'Municipal Records', 'Official Memoranda', 'Announcements', 'Calendar', 'Meetings', 'Messages', 'Executive Departments', 'Ordinances & Issuances', 'Councils, Boards & Committees', 'Development Plans', 'PPAs', 'Project Monitoring', 'Users', 'Departments', 'System Administration', 'Future Integrations'] as $label) {
            $this->assertStringContainsString("label: '{$label}'", $destinations);
        }

        foreach (['Staff Directory', 'Office Overview', 'Executive Overview', 'System Overview', 'Accounts & Access', 'For Decision', 'Audit & Security', 'Tasks & Assignments', 'HR Employee Portal'] as $legacyLabel) {
            $this->assertStringNotContainsString($legacyLabel, $destinations);
        }
    }

    public function test_shell_navigation_renders_current_groups_without_runtime_showcase_controls(): void
    {
        $sidebar = file_get_contents(resource_path('js/components/shell/PortalSidebar.tsx'));
        $section = file_get_contents(resource_path('js/components/shell/SidebarSection.tsx'));
        $footer = file_get_contents(resource_path('js/components/shell/SidebarFooter.tsx'));
        $layout = file_get_contents(resource_path('js/layouts/AppLayout.tsx'));

        $this->assertIsString($sidebar);
        $this->assertIsString($section);
        $this->assertIsString($footer);
        $this->assertIsString($layout);

        $this->assertStringContainsString('navigationGroups.map((group)', $sidebar);
        $this->assertStringContainsString('group.items.map(({ key, label, href, icon: Icon })', $sidebar);
        $this->assertStringContainsString('onToggleCollapsed', $sidebar);
        $this->assertStringContainsString('<AppearanceControl compact />', $sidebar);
        $this->assertStringContainsString("router.post('/logout')", $sidebar);
        $this->assertStringNotContainsString('useState(active)', $section);
        $this->assertStringContainsString('expanded?: boolean;', $section);
        $this->assertStringContainsString('onToggle?: () => void;', $section);
        $this->assertStringContainsString('onClick={onToggle}', $section);
        $this->assertStringContainsString('<details className="portal-account-tools">', $footer);

        foreach (['WorkspaceSwitcher', 'showcaseSession', '/showcase/switch', 'FirstRunGate'] as $retired) {
            $this->assertStringNotContainsString($retired, $footer."\n".$layout);
        }
    }

    public function test_current_and_hidden_backend_routes_remain_registered(): void
    {
        foreach (['admin.index', 'dashboard', 'transactions.index', 'correspondence.index', 'records.index', 'memoranda.index', 'calendar.index', 'operations.index', 'legislation.index', 'employees.index', 'announcements.index', 'meetings.index', 'messages.index', 'local-special-bodies.index', 'development-plans.index', 'ppas.index', 'procurement.reference', 'municipal-systems.index'] as $routeName) {
            $this->assertTrue(Route::has($routeName), "Expected current route {$routeName} to remain registered.");
        }

        foreach (['audit', 'mfa.settings', 'mfa.recovery.show', 'mfa.recovery.regenerate', 'mfa.reset', 'mfa.disable', 'property.index', 'property.lifecycle.index', 'reports.index', 'hris', 'hris.attendance', 'employees.presence'] as $routeName) {
            $this->assertTrue(Route::has($routeName), "Expected hidden backend route {$routeName} to remain registered.");
        }

        foreach (['procurement.showcase', 'showcase.session.store', 'showcase.session.switch', 'hris.payroll', 'hris.leave.store', 'hris.admin', 'hris.health.show', 'hris.offboarding.index'] as $routeName) {
            $this->assertFalse(Route::has($routeName), "Expected excluded/transitional route {$routeName} to be absent.");
        }
    }

    public function test_public_routes_are_separate_while_internal_routes_keep_security_middleware(): void
    {
        $this->assertTrue(Route::has('public.home'));
        $this->assertTrue(Route::has('public.activate-account'));

        foreach (['admin.index', 'dashboard', 'transactions.index', 'correspondence.index', 'records.index', 'reports.index', 'procurement.reference'] as $routeName) {
            $route = Route::getRoutes()->getByName($routeName);
            $this->assertNotNull($route);
            $middleware = $route->gatherMiddleware();
            $this->assertContains('auth', $middleware, "{$routeName} must remain authenticated.");
            $this->assertContains('active', $middleware, "{$routeName} must preserve active-account enforcement.");
            $this->assertContains('mfa.assured', $middleware, "{$routeName} must preserve MFA assurance.");
        }
    }

    public function test_dashboard_response_does_not_serialize_hidden_domain_rollups(): void
    {
        $this->seed();
        $mayor = User::query()->where('email', 'mayor@talibon.demo')->firstOrFail();

        $this->actingAs($mayor)->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->missing('centralRecords')
                ->missing('operationsSnapshot')
                ->missing('workspace.canAccessHris')
                ->missing('workspace.canManageLegislation'));
    }
}
