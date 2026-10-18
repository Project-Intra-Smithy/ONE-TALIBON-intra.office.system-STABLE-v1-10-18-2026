import { useState } from 'react';
import { Building2, Crown, Gavel, Network, Users } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';

type Office = {
    id: number;
    code: string;
    name: string;
    short_name?: string | null;
    branch: string;
    office_type: string;
    is_routable: boolean;
    active_employees_count: number;
    active_transactions_count: number;
    is_executive: boolean;
    is_legislative: boolean;
};

type Summary = {
    offices: number;
    executiveOffices: number;
    legislativeOffices: number;
    employees: number;
    activeTransactions: number;
};

const officeTypeLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, letter => letter.toUpperCase());

type DirectoryEntry = {
    key: string;
    group: string;
    shortName: string;
    name: string;
    responsibility: string;
    backingDepartmentCode: string | null;
    recordsHref: string | null;
    routable: boolean;
};

export default function Index({ departments, summary, directoryEntries = [], directoryGroups = [] }: {
    departments: Office[];
    summary: Summary;
    directoryEntries?: DirectoryEntry[];
    directoryGroups?: string[];
}) {
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('');
    const query = search.trim().toLocaleLowerCase();
    const visible = directoryEntries.filter(entry =>
        (!group || entry.group === group) &&
        (!query || [entry.shortName, entry.name, entry.responsibility].some(value => value.toLocaleLowerCase().includes(query)))
    );
    if (directoryEntries.length) return <AppLayout title="Office Directory">
        <PageFrame>
            <PageHeader eyebrow="One Talibon · Municipal directory" title="Office Directory"
                description="Browse the 40 offices, units, agencies and community partners provided by the municipal focal person. Directory listing does not grant access to another office's protected records." icon={Building2}/>
            <section className="municipal-panel space-y-4 p-4" aria-label="Office directory search and groups">
                <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold">Search offices
                        <input aria-label="Search offices" type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Office, abbreviation or service" className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                    </label>
                    <label className="block text-sm font-semibold">Office group
                        <select aria-label="Office group" value={group} onChange={e => setGroup(e.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-300 bg-white p-3 text-slate-900 dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                            <option value="">All office groups</option>
                            {directoryGroups.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>
                </div>
                <p role="status" aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">{visible.length} matching offices · {directoryEntries.length} total directory entries · {directoryGroups.length} groups</p>
            </section>
            {visible.length === 0 ? <div role="status" className="municipal-panel p-8 text-center">No matching offices</div> :
                <section aria-label="Office cards" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {visible.map(entry => <article key={entry.key} className="municipal-panel min-w-0 space-y-2 p-4">
                        <div className="flex flex-wrap items-center gap-2"><Building2 size={17} aria-hidden="true"/>
                            <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-700 dark:text-white">{entry.group}</span>
                            <span className="text-xs text-slate-500">{entry.shortName}</span>
                        </div>
                        <h2 className="break-words text-base font-bold">{entry.name}</h2>
                        <p className="break-words text-sm text-slate-600 dark:text-slate-300">{entry.responsibility}</p>
                        {entry.recordsHref ? <a className="inline-flex min-h-10 items-center text-sm underline" href={entry.recordsHref}>Open authorized office records</a> :
                            <p className="text-xs text-slate-500">Office-specific records access is not available in this directory.</p>}
                    </article>)}
                </section>}
        </PageFrame>
    </AppLayout>;
    const executive = departments.filter((office) => office.branch === 'executive');
    const legislative = departments.filter((office) => office.branch === 'legislative');

    const officeCard = (office: Office) => (
        <article key={office.id} className="municipal-panel min-w-0 p-4 transition-colors hover:border-blue-200 dark:hover:border-blue-800 sm:p-5">
            <div className="flex items-start gap-3">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${office.is_executive ? 'bg-blue-900 text-white' : office.is_legislative ? 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'}`}>
                    {office.is_executive ? <Crown size={17} aria-hidden="true" /> : office.is_legislative ? <Gavel size={17} aria-hidden="true" /> : <Building2 size={17} aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200">{office.code}</span>
                        <span className="break-words text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">{officeTypeLabel(office.office_type)}</span>
                    </div>
                    <h2 className="mt-2 break-words text-sm font-bold leading-5 text-slate-950 dark:text-slate-100 sm:text-base">{office.name}</h2>
                    {office.short_name && office.short_name !== office.name ? <div className="mt-0.5 break-words text-xs text-slate-500 dark:text-slate-400 sm:text-xs">{office.short_name}</div> : null}
                </div>
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-slate-700">
                <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400">Active employees</dt><dd className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">{office.active_employees_count}</dd></div>
                <div><dt className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-400">Active work</dt><dd className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">{office.active_transactions_count}</dd></div>
            </dl>
        </article>
    );

    const summaryItems = [
        { label: 'Municipal offices', value: summary.offices, icon: Network },
        { label: 'Executive / administrative', value: summary.executiveOffices, icon: Crown },
        { label: 'Legislative offices', value: summary.legislativeOffices, icon: Gavel },
        { label: 'Active employees', value: summary.employees, icon: Users },
        { label: 'Active routed work', value: summary.activeTransactions, icon: Building2 },
    ];

    return <AppLayout title="Municipal Offices">
        <PageFrame>
            <PageHeader
                eyebrow="Municipal operating structure"
                title="Municipal Offices"
                description="Directory of active municipal offices, branch placement, staffing, and current routed workload used across the intra-office portal."
                icon={Building2}
            />

            <section aria-label="Municipal office summary" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {summaryItems.map(({ label, value, icon: Icon }) => (
                    <div key={label} className="municipal-stat">
                        <Icon className="text-blue-800 dark:text-blue-300" size={17} aria-hidden="true" />
                        <div className="mt-2 text-xl font-bold text-slate-950 dark:text-slate-100 sm:text-2xl">{value}</div>
                        <div className="mt-0.5 break-words text-xs font-semibold leading-4 text-slate-500 dark:text-slate-400 sm:text-xs">{label}</div>
                    </div>
                ))}
            </section>

            <section className="space-y-3" aria-labelledby="executive-offices-heading">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">Executive and administrative branch</div>
                    <h2 id="executive-offices-heading" className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">Offices supporting municipal operations</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{executive.map(officeCard)}</div>
            </section>

            <section className="space-y-3" aria-labelledby="legislative-offices-heading">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">Legislative branch</div>
                    <h2 id="legislative-offices-heading" className="mt-1 break-words text-lg font-bold text-slate-950 dark:text-slate-100">Vice Mayor, Sangguniang Bayan, and legislative support</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{legislative.map(officeCard)}</div>
            </section>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-5 text-slate-600 transition-colors dark:border-slate-700 dark:bg-[#142236] dark:text-slate-300 sm:text-xs">
                Office names, branch placement, and routing availability reflect the municipality structure currently configured for this portal.
            </div>
        </PageFrame>
    </AppLayout>;
}
