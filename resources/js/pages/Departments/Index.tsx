import '../../../css/aj-page-workspace.css';
import '../../../css/ot-r6-modules.css';
import '../../../css/r8-directory.css';
import { useState } from 'react';
import { Building2, Crown, Gavel, Network, Search, Users } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import AppLayout from '../../layouts/AppLayout';
import OfficeLogo from '../../components/offices/OfficeLogo';

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


/** Presentation-only. The backend retains responsibility for every access decision. */
export function filterDirectoryEntries(entries: readonly DirectoryEntry[], search: string, group: string): DirectoryEntry[] {
    const normalize = (value: string) => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
    const needle = normalize(search);
    return entries.filter((entry) =>
        (!group || entry.group === group)
        && (!needle || [entry.shortName, entry.name, entry.responsibility, entry.backingDepartmentCode ?? '']
            .some((value) => normalize(value).includes(needle))),
    );
}

/** Respect server group order while never silently dropping an unexpected catalog entry. */
export function groupDirectoryEntries(entries: readonly DirectoryEntry[], groupOrder: readonly string[]) {
    const extraGroups = Array.from(new Set(entries.map((entry) => entry.group).filter((group) => !groupOrder.includes(group))));
    return [...groupOrder, ...extraGroups]
        .map((groupName) => ({ groupName, entries: entries.filter((entry) => entry.group === groupName) }))
        .filter((group) => group.entries.length > 0);
}

/** Never turn an untrusted catalog key, external URL, or arbitrary path into a Records link. */
export function safeRecordsHref(entry: DirectoryEntry): string | null {
    return entry.recordsHref === '/records' ? '/records' : null;
}

export default function Index({ departments, summary, directoryEntries, directoryGroups }: {
    departments: Office[];
    summary: Summary;
    directoryEntries?: DirectoryEntry[] | null;
    directoryGroups?: string[] | null;
}) {
    const [search, setSearch] = useState('');
    const [group, setGroup] = useState('');
    const entries = directoryEntries ?? [];
    const groups = Array.from(new Set([...(directoryGroups ?? []), ...entries.map(entry => entry.group)]));
    const visible = filterDirectoryEntries(entries, search, group);
    const groupedVisible = groupDirectoryEntries(visible, groups);
    if (directoryEntries != null) return <AppLayout title="Office Directory">
        <PageFrame className="ot-r6-modules ot-r6-departments r8-directory aj-page-workspace" density="comfortable">
            <PageHeader eyebrow="One Talibon · Reference directory" title="Office Directory"
                description="Browse the supplied municipal office reference catalog by office, responsibility or group. Entries remain subject to LGU validation." icon={Building2}/>
            <section className="r8-directory-intro" aria-label="Directory scope">
                <div className="r8-directory-intro__icon"><Building2 size={23} aria-hidden="true" /></div>
                <div className="r8-directory-intro__copy">
                    <p className="r8-directory-kicker">Municipal office reference</p>
                    <h2>Find the right office</h2>
                    <p>Explore office responsibilities and available records access. Reference entries are not verified departmental workspaces.</p>
                </div>
                <div className="r8-directory-intro__count" aria-label={`${entries.length} supplied reference entries`}>
                    <strong>{entries.length}</strong><span>Catalog entries</span>
                </div>
            </section>
            <section className="municipal-panel ot-r6-filter-panel r8-directory-controls space-y-3 rounded-lg p-3 sm:p-4" aria-label="Office directory search and groups">
                <div className="r8-directory-controls__fields grid gap-3 sm:grid-cols-2">
                    <label className="block text-sm font-semibold"><span className="r8-directory-field-label"><Search size={15} aria-hidden="true" />Search offices</span>
                        <input aria-label="Search offices" type="search" value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Office, code or service" className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white p-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145A43] dark:border-slate-600 dark:bg-slate-900 dark:text-white" />
                    </label>
                    <label className="block text-sm font-semibold">Office group
                        <select aria-label="Office group" value={group} onChange={e => setGroup(e.target.value)}
                            className="mt-1 min-h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white p-3 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#145A43] dark:border-slate-600 dark:bg-slate-900 dark:text-white">
                            <option value="">All office groups</option>
                            {groups.map(value => <option key={value} value={value}>{value}</option>)}
                        </select>
                    </label>
                </div>
                <div className="r8-directory-results flex flex-wrap items-center justify-between gap-2 border-t border-[var(--municipal-border)] pt-2">
                    <p role="status" aria-live="polite" className="text-xs font-semibold text-[var(--municipal-muted)]">{visible.length} of {entries.length} reference entries · {groups.length} groups</p>
                    {(search || group) && <button type="button" onClick={() => { setSearch(''); setGroup(''); }} className="ot-r6-reset min-h-11 rounded-md px-3 text-xs font-semibold text-[var(--municipal-brand)]">Clear filters</button>}
                </div>
            </section>
            {visible.length === 0 ? (
                <section role="status" aria-live="polite" className="municipal-panel p-8 text-center">
                    <h2 className="text-lg font-bold">{entries.length ? 'No matching offices' : 'No directory entries available'}</h2>
                    <p className="mt-2 text-sm">{entries.length ? 'Try another search or choose All office groups.' : 'No reference catalog entries were supplied for this directory.'}</p>
                    <button type="button" onClick={() => { setSearch(''); setGroup(''); }}
                        className="mt-3 min-h-11 rounded-lg border border-emerald-800 px-4 py-2 font-semibold text-[#145A43] focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-800">
                        Clear filters
                    </button>
                </section>
            ) : (
                <div className="r8-directory-groups min-w-0 space-y-4" aria-label="Office directory grouped results">
                    {groupedVisible.map(({ groupName, entries }, index) => (
                        <section key={groupName} className="ot-r6-office-group r8-directory-group min-w-0 space-y-2 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-labelledby={`office-directory-group-${index}`}>
                            <h2 id={`office-directory-group-${index}`} className="break-words border-l-4 border-[#145A43] pl-3 text-lg font-bold text-slate-950 dark:text-slate-100">
                                {groupName} <span className="r8-directory-group__count text-sm font-medium text-slate-600 dark:text-slate-300">{entries.length} {entries.length === 1 ? 'office' : 'offices'} shown</span>
                            </h2>
                            <div className="ot-r6-office-grid grid min-w-0 gap-2 sm:grid-cols-2 xl:grid-cols-3">
                                {entries.map((entry) => {
                                    const recordsHref = safeRecordsHref(entry);
                                    return (
                                        <article key={entry.key} className="ot-r6-office-card r8-directory-card min-w-0 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <OfficeLogo officeCode={entry.backingDepartmentCode} directoryKey={entry.key} officeName={entry.name} />
                                                <span className="min-w-0 break-words text-sm font-semibold text-[#145A43] dark:text-emerald-300">{entry.shortName}</span>
                                            </div>
                                            <h3 className="mt-2 break-words text-[13px] font-bold leading-5 text-[var(--municipal-text)]">{entry.name}</h3>
                                            <p className="mt-1 break-words text-xs leading-5 text-[var(--municipal-muted)]">{entry.responsibility}</p>
                                            {recordsHref ? (
                                                <a className="ot-r6-office-action r8-directory-card__link mt-2 inline-flex min-h-11 max-w-full items-center text-xs font-semibold text-[#145A43] underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800 dark:text-emerald-300" href={recordsHref}>
                                                    Open authorized office records
                                                </a>
                                            ) : (
                                                <p className="ot-r6-office-action r8-directory-card__pending mt-2 text-xs text-[var(--municipal-muted)]">Records access unavailable — authority pending</p>
                                            )}
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    ))}
                </div>
            )}
        </PageFrame>
    </AppLayout>;
    const executive = departments.filter((office) => office.branch === 'executive');
    const legislative = departments.filter((office) => office.branch === 'legislative');

    const officeCard = (office: Office) => (
        <article key={office.id} className="aj-office-row ot-r6-live-office-card">
            <div className="aj-office-identity">
                <span className="aj-office-mark" aria-hidden="true">
                    {office.is_executive ? <Crown size={24} /> : office.is_legislative ? <Gavel size={24} /> : <Building2 size={24} />}
                </span>
                <div className="min-w-0">
                    <p className="aj-office-kind">{office.code} <span aria-hidden="true">/</span> {officeTypeLabel(office.office_type)}</p>
                    <h3>{office.name}</h3>
                    {office.short_name && office.short_name !== office.name && <p className="aj-office-short-name">{office.short_name}</p>}
                </div>
            </div>
            <dl className="aj-office-counts">
                <div><dt>Active employees</dt><dd>{office.active_employees_count}</dd></div>
                <div><dt>Active work</dt><dd>{office.active_transactions_count}</dd></div>
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
        <PageFrame className="ot-r6-modules ot-r6-departments r8-directory aj-page-workspace" density="comfortable">
            <PageHeader
                eyebrow="Municipal operating structure"
                title="Municipal Offices"
                description="Explore server-supplied municipal offices, their branch placement and authorized summary counts."
                icon={Building2}
            />

            <dl aria-label="Municipal office summary" className="aj-office-statistics">
                {summaryItems.map(({ label, value }) => (
                    <div key={label}><dt>{label}</dt><dd>{value.toLocaleString()}</dd></div>
                ))}
            </dl>

            <section className="r8-directory-live-group aj-office-branch" aria-labelledby="executive-offices-heading">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--municipal-brand)]">Executive and administrative branch</div>
                    <h2 id="executive-offices-heading" className="mt-1 text-lg font-bold text-slate-950 dark:text-slate-100">Offices supporting municipal operations</h2>
                </div>
                <div className="aj-office-list">{executive.map(officeCard)}{executive.length === 0 && <p className="aj-office-empty">No executive or administrative offices supplied.</p>}</div>
            </section>

            <section className="r8-directory-live-group aj-office-branch" aria-labelledby="legislative-offices-heading">
                <div>
                    <div className="text-xs font-bold uppercase tracking-wider text-[var(--municipal-brand)]">Legislative branch</div>
                    <h2 id="legislative-offices-heading" className="mt-1 break-words text-lg font-bold text-slate-950 dark:text-slate-100">Vice Mayor, Sangguniang Bayan, and legislative support</h2>
                </div>
                <div className="aj-office-list">{legislative.map(officeCard)}{legislative.length === 0 && <p className="aj-office-empty">No legislative offices supplied.</p>}</div>
            </section>

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-[13px] leading-5 text-slate-600 transition-colors dark:border-slate-700 dark:bg-[#142236] dark:text-slate-300 sm:text-xs">
                Office names, branch placement, and routing availability reflect the municipality structure currently configured for this portal.
            </div>
        </PageFrame>
    </AppLayout>;
}
