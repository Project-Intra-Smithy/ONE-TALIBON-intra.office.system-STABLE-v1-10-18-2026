import { installPreviewNetworkBoundary } from './networkBoundary';
import '../resources/css/app.css';
import './standalone.css';
import React, { Component, Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { StandalonePageProvider } from './inertia';
import { fixtureFor, fixturePageForRole, sharedProps, type RoleKey } from './fixtures';
import { resolveCatalogPage, resolveStandalonePage } from './departmentHeadFixtures';
import { installSyntheticTaskReadAdapter } from './syntheticTaskReadAdapter';
import { installSyntheticNotificationAdapter } from './syntheticNotificationAdapter';
import { blockSyntheticFormSubmission } from './syntheticWriteBoundary';
import { initializeAppearance } from '../resources/js/theme/appearance';

const pageLoaders = import.meta.glob<{ default: React.ComponentType<any> }>('../resources/js/pages/**/*.tsx');
const allPageNames = Object.keys(pageLoaders)
    .map((path) => path.replace('../resources/js/pages/', '').replace('.tsx', ''))
    .sort();

const lazyCache = new Map<string, React.LazyExoticComponent<React.ComponentType<any>>>();
function getLazyPage(name: string) {
    const resolvedName = pageLoaders[`../resources/js/pages/${name}.tsx`] ? name : 'Errors/Status';
    let cached = lazyCache.get(resolvedName);
    if (!cached) {
        const loader = pageLoaders[`../resources/js/pages/${resolvedName}.tsx`];
        cached = lazy(loader);
        lazyCache.set(resolvedName, cached);
    }
    return cached;
}

const routeMap: Record<string, string> = {
    '/': 'Public/Home',
    '/login': 'Auth/Login',
    '/activate-account': 'Auth/ActivateAccount',
    '/dashboard': 'Dashboard',
    '/security/account': 'Auth/AccountSecurity',
    '/work-requests/origin-delivery-exceptions': 'Transactions/DeliveryExceptions',
    '/my-department': 'Departments/Workspace',
    '/departments': 'Departments/Index',
    '/my-tasks': 'Tasks/Index',
    '/work-requests': 'Transactions/Index',
    '/transactions': 'Transactions/Index',
    '/transactions/create': 'Transactions/Create',
    '/correspondence': 'Correspondence/Index',
    '/documents': 'Documents/Index',
    '/records': 'Records/Index',
    '/calendar': 'Calendar/Index',
    '/messages': 'Messages/Index',
    '/hris': 'Hris/Admin',
    '/hris/admin': 'Hris/Admin',
    '/hris/dashboard': 'Hris/Dashboard',
    '/hris/dtr': 'Hris/Dtr',
    '/hris/payroll': 'Hris/Payroll',
    '/hris/attendance': 'Hris/Attendance',
    '/hris/health-access': 'Hris/HealthAccess',
    '/mayor-office': 'MayorOffice',
    '/property': 'Property/Index',
    '/property/lifecycle': 'Property/Lifecycle',
    '/travel-orders': 'TravelOrders/Index',
    '/legislation': 'Legislation/Index',
    '/legislative-workspace': 'Legislation/Workspace',
    '/admin': 'Admin/Index',
    '/audit': 'Audit/Index',
    '/employees': 'Employees/Index',
    '/memoranda': 'Memoranda/Index',
    '/municipal-systems': 'MunicipalSystems/Index',
    '/local-special-bodies': 'LocalBodies/Index',
    '/development-plans': 'Plans/Index',
    '/planning-maps': 'PlanningMaps/Index',
    '/ppas': 'PPAs/Index',
    '/reports': 'Reports/Index',
    '/portal-search': 'Search/Index',
    '/announcements': 'Announcements/Index',
    '/meetings': 'Meetings/Index',
    '/operations': 'Operations/Index',
    '/project-monitoring': 'ProjectMonitoring/Index',
    '/procurement': 'Operations/Index',
};

const featured = Object.entries(routeMap);
const WRITE_GUARDED_PAGES = new Set([
    'Transactions/Create',
    'TravelOrders/Create',
    'Memoranda/Create',
    'Legislation/Create',
]);

class Boundary extends Component<{ children: React.ReactNode; page: string }, { error?: Error }> {
    state: { error?: Error } = {};
    static getDerivedStateFromError(error: Error) { return { error }; }
    componentDidUpdate(previous: { page: string }) {
        if (previous.page !== this.props.page && this.state.error) this.setState({ error: undefined });
    }
    render() {
        return this.state.error ? (
            <main className="isolation-error">
                <h1>Fixture adaptation required</h1>
                <p>The component <code>{this.props.page}</code> encountered a synthetic fixture mismatch.</p>
                <pre>{this.state.error.message}</pre>
            </main>
        ) : this.props.children;
    }
}

function PageFallback() {
    return (
        <div className="tcds-page-loading" role="status" aria-live="polite">
            <span className="tcds-spinner" aria-hidden="true" />
            <span>Loading municipal workspace…</span>
        </div>
    );
}

function locationNow() { return `${window.location.pathname || '/'}${window.location.search}${window.location.hash}`; }

export function projectStandalonePageUrl(pageName: string, path: string, search: string, actualUrl: string) {
    const isWorkRequestIndex = pageName === 'Transactions/Index' && (path === '/work-requests' || path === '/transactions');
    return isWorkRequestIndex ? `/transactions${search}` : actualUrl;
}

function App() {
    const [locationKey, setLocationKey] = useState(locationNow);
    const [role, setRole] = useState<RoleKey>(() => (localStorage.getItem('ot.synthetic.role') as RoleKey) || 'employee');
    const [writeSubmitAttempted, setWriteSubmitAttempted] = useState(false);
    const [blockedAction, setBlockedAction] = useState<string | null>(null);

    useEffect(() => {
        const blocked = () => setBlockedAction('Preview action unavailable. No municipal record was submitted or saved.');
        window.addEventListener('ot:preview-write-blocked', blocked);
        return () => window.removeEventListener('ot:preview-write-blocked', blocked);
    }, []);

    useEffect(() => {
        const update = () => setLocationKey(locationNow());
        addEventListener('popstate', update);
        return () => removeEventListener('popstate', update);
    }, []);

    const path = window.location.pathname || '/';
    const searchParams = new URLSearchParams(window.location.search);
    const resolvedPageName = resolveStandalonePage(path, role, window.location.search)
        || resolveCatalogPage(searchParams.get('page'), role)
        || routeMap[path]
        || 'Errors/Status';
    const pageName = fixturePageForRole(resolvedPageName, role);
    const isCreatePreview = WRITE_GUARDED_PAGES.has(pageName);

    useEffect(() => { setWriteSubmitAttempted(false); setBlockedAction(null); }, [pageName]);

    const Page = getLazyPage(pageName);
    const props = useMemo(() => fixtureFor(pageName, role, searchParams, path), [pageName, role, locationKey]);
    const page = { url: projectStandalonePageUrl(pageName, path, window.location.search, locationKey), props: { ...sharedProps(role), ...props }, flash: props.flash };

    const chooseRole = (next: RoleKey) => {
        localStorage.setItem('ot.synthetic.role', next);
        setRole(next);
    };

    return (
        <StandalonePageProvider page={page}>
            <div className="isolation-toolbar" role="region" aria-label="Isolated frontend controls">
                <strong>ISOLATED UI · SYNTHETIC DATA</strong>
                <label>
                    Role
                    <select value={role} onChange={(event) => chooseRole(event.target.value as RoleKey)}>
                        {(['employee', 'mpdc_designated_staff', 'department_head', 'executive_oversight', 'hr', 'system_administration'] as const).map((item) => (
                            <option key={item} value={item}>{item === 'mpdc_designated_staff' ? 'MPDC designated staff' : item.replaceAll('_', ' ')}</option>
                        ))}
                    </select>
                </label>
                <details>
                    <summary>Screens ({allPageNames.length})</summary>
                    <div className="isolation-route-grid">
                        {featured.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
                        {allPageNames
                            .filter((name) => !Object.values(routeMap).includes(name))
                            .map((name) => <a key={name} href={`/?page=${encodeURIComponent(name)}`}>{name}</a>)}
                    </div>
                </details>
            </div>
            {blockedAction && (
                <aside role="status" className="isolation-write-boundary">
                    <strong>{blockedAction}</strong>
                    <button type="button" onClick={() => setBlockedAction(null)} aria-label="Dismiss preview action notice">Dismiss</button>
                </aside>
            )}
            {isCreatePreview && (
                <aside className="isolation-write-boundary" role="status">
                    <strong>Isolated preview · No municipal records can be submitted</strong>
                    <span>The form below is for evaluating its design only. It is not connected to municipal records.</span>
                    {writeSubmitAttempted && (
                        <strong className="isolation-write-denied" role="alert">
                            Not submitted. No request was created or saved.
                        </strong>
                    )}
                </aside>
            )}
            <div
                data-preview-page={pageName}
                onSubmitCapture={isCreatePreview ? (event) => {
                    const target = event.target;
                    if (!(target instanceof HTMLFormElement) || !target.closest('.civic-page') || target.closest('search')) return;
                    blockSyntheticFormSubmission(event);
                    setWriteSubmitAttempted(true);
                } : undefined}
            >
                <Boundary page={pageName}>
                    <Suspense fallback={<PageFallback />}>
                        <Page {...props} />
                    </Suspense>
                </Boundary>
            </div>
            {isCreatePreview && writeSubmitAttempted && (
                <div className="isolation-write-toast" role="alert">
                    <div>
                        <strong>Not submitted.</strong> No municipal record was created or saved in this isolated preview.
                    </div>
                    <button
                        type="button"
                        onClick={() => setWriteSubmitAttempted(false)}
                        className="isolation-write-toast-close"
                        aria-label="Dismiss preview notice"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </StandalonePageProvider>
    );
}

initializeAppearance();
const getCurrentRole = () => (localStorage.getItem('ot.synthetic.role') as RoleKey) || 'employee';
installPreviewNetworkBoundary();
installSyntheticTaskReadAdapter(getCurrentRole);
installSyntheticNotificationAdapter(getCurrentRole);
const rootContainer = document.getElementById('root')!;
const globalStore = globalThis as typeof globalThis & { __oneTalibonRoot?: ReturnType<typeof createRoot> };
globalStore.__oneTalibonRoot ??= createRoot(rootContainer);
globalStore.__oneTalibonRoot.render(<App />);
