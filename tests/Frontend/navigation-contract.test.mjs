import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Run the actual navigation source with only icon components stubbed. The
// staged-route guard is itself compiled from the source under test.
function loadModule(path, imports = {}) {
    const filename = fileURLToPath(new URL(path, import.meta.url));
    const { outputText, diagnostics } = ts.transpileModule(readFileSync(filename, 'utf8'), {
        fileName: filename,
        reportDiagnostics: true,
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    });
    assert.equal(diagnostics?.length ?? 0, 0, `TypeScript transpilation: ${path}`);
    const module = { exports: {} };
    runInNewContext(outputText, {
        module, exports: module.exports,
        require(name) {
            assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
            return imports[name];
        },
    }, { filename });
    return module.exports;
}
const staged = loadModule('../../resources/js/navigation/stagedRoutes.ts');
const nav = loadModule('../../resources/js/navigation/portalNavigation.ts', {
    './stagedRoutes': staged,
    'lucide-react': new Proxy({}, { get: (_target, property) => String(property) }),
});
const serverFlags = ['systemAdministration', 'dashboard', 'transactions', 'correspondence', 'records', 'travelOrders', 'reports', 'mayorOffice', 'memoranda', 'departments', 'audit'];
const permissions = (grant) => Object.fromEntries(serverFlags.map((key) => [key, grant]));
const visible = (grant) => [...nav.buildPortalNavigation('employee', permissions(grant))].flatMap((group) => [...group.items]);

test('catalog exactly preserves canonical 24 identity, group, and readiness relationships', () => {
    const catalog = [...nav.plannedPortalDestinations];
    assert.equal(catalog.length, 24);
    assert.equal(new Set(catalog.map((item) => item.key)).size, 24);
    assert.equal(nav.wiredPortalDestinations.length, 15);
    assert.equal(nav.integrationPendingPortalDestinations.length, 9);
    assert.deepEqual([...new Set(catalog.map((item) => item.group))].sort(),
        ['home','work','files','communication','schedule','people','organization','planning','administration','systems'].sort());
    assert.equal(catalog.some((item) => item.group === 'navigation'), false);
    assert.equal(catalog.some((item) => ['dashboard', 'transactions', 'audit'].includes(item.key)), false);
    assert.deepEqual([...nav.integrationPendingPortalDestinations].map((item) => item.key).sort(),
        ['procurementTracking','announcements','meetings','legislative','localSpecialBodies','projectMonitoring','users','adminDepartments','municipalSystems'].sort());
});

test('canonical paths and permission associations are not synthetic', () => {
    const d = Object.fromEntries([...nav.plannedPortalDestinations].map((entry) => [entry.key, entry]));
    assert.equal(d.home.href, '/dashboard');
    assert.equal(d.home.permission, 'dashboard');
    assert.equal(d.myWork.href, '/transactions');
    assert.equal(d.myWork.permission, 'transactions');
    assert.equal(d.documentCenter.href, '/documents');
    assert.equal(d.documentCenter.permission, 'records');
    assert.equal(d.executiveDepartments.group, 'organization');
    assert.equal(d.executiveDepartments.permission, 'departments');
    assert.equal(d.users.href, '/admin/users');
    assert.equal(d.users.readiness, 'integration_pending');
    assert.equal(d.users.permission, 'systemAdministration');
    assert.equal(d.municipalSystems.readiness, 'integration_pending');
    assert.equal(d.messages.permission, undefined);
});

test('permission denial, optional third builder argument and absent routes remain guarded', () => {
    assert.deepEqual(visible(false).map((item) => item.key).sort(), ['calendar','employeeDirectory','portalSearch','developmentPlans','ppas'].sort());
    const allowed = visible(true);
    assert.deepEqual(allowed.map((item) => item.key).sort(),
        ['home','myWork','correspondence','employeeDirectory','records','memoranda','calendar','executiveDepartments','portalSearch','documentCenter','developmentPlans','ppas','systemAdministration'].sort());
    assert.ok(allowed.every((item) => item.readiness === 'wired' && staged.isStagedInertiaPath(item.href)));
    assert.ok(!allowed.some((item) => item.href === '/messages'));
    assert.equal(JSON.stringify(nav.buildPortalNavigation('employee', permissions(true))),
        JSON.stringify(nav.buildPortalNavigation('employee', permissions(true), true)));
    assert.equal(nav.isPortalPathActive('/records?view=all', '/records'), true);
    assert.equal(nav.isPortalPathActive('/records-archive', '/records'), false);
});

test('already corrected dashboard and density presentation contracts remain intact', () => {
    const layout = readFileSync(fileURLToPath(new URL('../../resources/js/layouts/AppLayout.tsx', import.meta.url)), 'utf8');
    const frame = readFileSync(fileURLToPath(new URL('../../resources/js/components/PageFrame.tsx', import.meta.url)), 'utf8');
    assert.ok(layout.includes("presentation === 'portal-dashboard' ? 'dashboard' : undefined"));
    assert.match(frame, /density\?: Density/);
    assert.match(frame, /'compact'/);
});

test('PR44 My Department remains head-only and canonical Personal Tasks navigation stays present', () => {
    for (const role of ['employee', 'department_head', 'executive_oversight', 'system_administration', null]) {
        const items = [...nav.buildPortalNavigation(role, permissions(true))].flatMap(group => group.items);
        const department = items.filter(item => item.key === 'myDepartment');
        assert.equal(department.length, role === 'department_head' ? 1 : 0);
        if (department.length) assert.equal(department[0].href, '/dashboard#department-overview');
    }
    assert.equal(nav.isPortalPathActive('/dashboard#department-overview', '/dashboard#department-overview'), true);
    assert.equal(nav.isPortalPathActive('/dashboard#department-overview', '/dashboard'), false);
    assert.equal(nav.isPortalPathActive('/dashboard', '/dashboard#department-overview'), false);
    const sidebar = readFileSync(fileURLToPath(new URL('../../resources/js/components/shell/PortalSidebar.tsx', import.meta.url)), 'utf8');
    assert.match(sidebar, /href="\/dashboard#personal-tasks"/);
    assert.match(sidebar, /const tasksActive =/);
});
