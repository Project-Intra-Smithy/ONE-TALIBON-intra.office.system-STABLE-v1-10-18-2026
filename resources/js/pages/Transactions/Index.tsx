import { Link, router } from '@inertiajs/react';
import { BriefcaseBusiness, Plus, Search, X } from 'lucide-react';
import { type FormEvent, useEffect, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import StaffWorkloadTable from '../../components/work-queue/StaffWorkloadTable';
import WorkItemList from '../../components/work-queue/WorkItemList';
import WorkScopeTabs from '../../components/work-queue/WorkScopeTabs';
import type { Filters, Office, Paginator, ScopeGroup, StaffWorkload } from '../../components/work-queue/types';
import AppLayout from '../../layouts/AppLayout';

type Props = {
    records: Paginator;
    filters: Filters;
    scopeGroups: ScopeGroup[];
    filterOptions: { statuses: string[]; priorities: string[]; offices: Office[] };
    experience: {
        profile: string;
        department: { id: number; code: string; name: string; shortName?: string | null };
        hasOfficeScope: boolean;
        hasMunicipalScope: boolean;
    };
    staffWorkload: StaffWorkload[];
};

const humanize = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());

const experienceCopy = (profile: string) => {
    if (profile === 'executive_oversight') {
        return {
            eyebrow: 'Executive workflow',
            description: 'Municipality-wide authorized work, approvals and decisions',
        };
    }

    if (profile === 'system_administration') {
        return {
            eyebrow: 'Administrative workflow',
            description: 'Authorized municipal workflow visibility',
        };
    }

    if (profile === 'department_head') {
        return {
            eyebrow: 'Personal and office workflow',
            description: 'Personal tasks and office accountability',
        };
    }

    return {
        eyebrow: 'Personal workflow',
        description: 'Assigned tasks and daily workflow',
    };
};

export default function Index({ records, filters, scopeGroups, filterOptions, experience, staffWorkload }: Props) {
    const currentView = filters.view || scopeGroups[0]?.views[0]?.key || 'all';
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [priority, setPriority] = useState(filters.priority);
    const [officeId, setOfficeId] = useState(filters.office_id ? String(filters.office_id) : '');
    const currentQueue = scopeGroups.flatMap((group) => group.views).find((view) => view.key === currentView);
    const currentTitle = currentQueue?.label || 'Work';
    const copy = experienceCopy(experience.profile);

    useEffect(() => {
        setSearch(filters.search);
        setStatus(filters.status);
        setPriority(filters.priority);
        setOfficeId(filters.office_id ? String(filters.office_id) : '');
    }, [filters.search, filters.status, filters.priority, filters.office_id]);

    const queryData = (overrides: Partial<Filters> = {}) => {
        const next = {
            view: overrides.view ?? currentView,
            search: overrides.search ?? search,
            status: overrides.status ?? status,
            priority: overrides.priority ?? priority,
            office_id: overrides.office_id ?? (officeId ? Number(officeId) : null),
        };
        return Object.fromEntries(Object.entries(next).filter(([, value]) => value !== '' && value !== null && value !== undefined));
    };

    const applyFilters = (event: FormEvent) => {
        event.preventDefault();
        router.get('/transactions', queryData(), { preserveState: true, preserveScroll: true, replace: true });
    };

    const selectView = (view: string) => {
        router.get('/transactions', queryData({ view }), { preserveState: true, preserveScroll: true, replace: true });
    };

    const clearFilters = () => {
        setSearch('');
        setStatus('');
        setPriority('');
        setOfficeId('');
        router.get('/transactions', { view: currentView }, { preserveState: true, preserveScroll: true, replace: true });
    };

    const activeFilterCount = [search, status, priority, officeId].filter(Boolean).length;

    return (
        <AppLayout title="Tasks & Assignments">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow={copy.eyebrow}
                    title="Tasks & Assignments"
                    description={`${copy.description} · ${experience.department.name} · ${currentTitle} · ${currentQueue?.count ?? records.total} item${(currentQueue?.count ?? records.total) === 1 ? '' : 's'}`}
                    icon={BriefcaseBusiness}
                    aside={<Link href="/transactions/create" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-[var(--municipal-brand-deep)] px-3.5 text-xs font-semibold text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"><Plus size={15} /> New Request</Link>}
                />

                <WorkScopeTabs groups={scopeGroups} currentView={currentView} onSelect={selectView} />

                <form onSubmit={applyFilters} className="municipal-panel p-3">
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto] md:items-end">
                        <label className="block min-w-0">
                            <span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search tasks</span>
                            <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" size={15} /><input value={search} onChange={(event) => setSearch(event.target.value)} className="min-h-11 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" placeholder="Reference, title, office, assignee..." /></div>
                        </label>
                        <label className="block min-w-0"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Status</span><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"><option value="">All statuses</option>{filterOptions.statuses.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>
                        <label className="block min-w-0"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Priority</span><select value={priority} onChange={(event) => setPriority(event.target.value)} className="min-h-11 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"><option value="">All priorities</option>{filterOptions.priorities.map((value) => <option key={value} value={value}>{humanize(value)}</option>)}</select></label>
                        <label className="block min-w-0"><span className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Current office</span><select value={officeId} onChange={(event) => setOfficeId(event.target.value)} className="min-h-11 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"><option value="">All authorized offices</option>{filterOptions.offices.map((office) => <option key={office.id} value={office.id}>{office.shortName || office.name}</option>)}</select></label>
                        <div className="flex gap-2"><button className="min-h-11 rounded-md bg-[var(--municipal-brand-deep)] px-3.5 text-xs font-bold text-white">Apply{activeFilterCount > 0 ? ` / ${activeFilterCount}` : ''}</button><button type="button" onClick={clearFilters} className="flex min-h-11 min-w-11 items-center justify-center rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]" aria-label="Clear filters"><X size={15} /></button></div>
                    </div>
                </form>

                {currentView === 'staff_workload' ? <StaffWorkloadTable rows={staffWorkload} /> : <WorkItemList records={records} title={currentTitle} />}
            </PageFrame>
        </AppLayout>
    );
}
