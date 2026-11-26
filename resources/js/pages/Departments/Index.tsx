import { Building2, Crown, Gavel, Network, RotateCcw, Search, Users } from 'lucide-react';
import { useId, useState } from 'react';
import OfficeLogo from '../../components/offices/OfficeLogo';
import { EmptyState, KpiCard, PageHeader } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { humanizeSlug } from '../../lib/format';

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
    const searchId = useId();
    const groupId = useId();
    const entries = directoryEntries ?? [];
    const groups = Array.from(new Set([...(directoryGroups ?? []), ...entries.map((entry) => entry.group)]));
    const visible = filterDirectoryEntries(entries, search, group);
    const groupedVisible = groupDirectoryEntries(visible, groups);

    if (directoryEntries != null) {
        return (
            <AppLayout title="Office Directory">
                <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                    {/* Reference municipal directory — subject to LGU validation */}
                    <PageHeader
                        eyebrow="ONE TALIBON · Reference directory"
                        title="Office Directory"
                        subtitle="Browse municipal offices by name, responsibility, or organizational group."
                    />

                    <section className="tcds-card flex flex-wrap items-center justify-between gap-4 border-l-4 border-l-[var(--brand-primary)] p-4 sm:p-5" aria-label="Directory scope">
                        <div className="flex min-w-0 items-start gap-3.5">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                <Building2 size={21} aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    Municipal office reference
                                </p>
                                <h2 className="mt-0.5 text-base font-bold text-[var(--ink-primary)]">Find the right office</h2>
                                <p className="mt-0.5 text-sm text-[var(--ink-secondary)]">
                                    Explore office responsibilities and available records access across executive and legislative departments.
                                </p>
                            </div>
                        </div>
                        <div
                            className="shrink-0 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-2.5 text-center"
                            aria-label={`${entries.length} catalog entries`}
                            role="group"
                        >
                            <div className="text-2xl font-extrabold tabular-nums text-[var(--ink-primary)]">{entries.length}</div>
                            <div className="text-xs font-semibold text-[var(--ink-secondary)]">
                                {entries.length === 1 ? 'Catalog entry' : 'Catalog entries'}
                            </div>
                        </div>
                    </section>

                    <search>
                        <section className="tcds-card space-y-3 p-4" aria-label="Office directory search and groups">
                            <div className="grid gap-3 sm:grid-cols-2">
                                <div>
                                    <label htmlFor={searchId} className="mb-1.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        <Search size={14} aria-hidden="true" />
                                        <span>Search offices</span>
                                    </label>
                                    <input
                                        id={searchId}
                                        type="search"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        placeholder="Office name, code, or responsibility…"
                                        className="tcds-input"
                                    />
                                </div>
                                <div>
                                    <label htmlFor={groupId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        Office group
                                    </label>
                                    <select
                                        id={groupId}
                                        value={group}
                                        onChange={(e) => setGroup(e.target.value)}
                                        className="tcds-input"
                                    >
                                        <option value="">All office groups</option>
                                        {groups.map((value) => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-default)] pt-2.5">
                                <p role="status" aria-live="polite" className="text-xs font-semibold text-[var(--ink-secondary)]">
                                    {visible.length} of {entries.length} {entries.length === 1 ? 'office' : 'offices'} · {groups.length} {groups.length === 1 ? 'group' : 'groups'}
                                </p>
                                {(search || group) && (
                                    <button
                                        type="button"
                                        onClick={() => { setSearch(''); setGroup(''); }}
                                        className="municipal-secondary-button"
                                    >
                                        <RotateCcw size={14} aria-hidden="true" />
                                        <span>Clear filters</span>
                                    </button>
                                )}
                            </div>
                        </section>
                    </search>

                    {visible.length === 0 ? (
                        <EmptyState
                            icon={<Building2 size={24} aria-hidden="true" />}
                            title={entries.length ? 'No matching offices' : 'No directory entries available'}
                            description={entries.length ? 'Try another search term or choose All office groups.' : 'No reference catalog entries were supplied for this directory.'}
                            action={
                                entries.length > 0 ? (
                                    <button type="button" onClick={() => { setSearch(''); setGroup(''); }} className="municipal-secondary-button">
                                        Clear filters
                                    </button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <div className="space-y-5" role="region" aria-label="Office directory grouped results">
                            {groupedVisible.map(({ groupName, entries: groupItems }, index) => (
                                <section
                                    key={groupName}
                                    className="tcds-card space-y-3 p-4 sm:p-5"
                                    aria-labelledby={`office-directory-group-${index}`}
                                >
                                    <div className="flex flex-wrap items-baseline justify-between gap-2 border-l-4 border-[var(--brand-primary)] pl-3">
                                        <h2 id={`office-directory-group-${index}`} className="text-lg font-bold text-[var(--ink-primary)]">
                                            {groupName}
                                        </h2>
                                        <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                            {groupItems.length} {groupItems.length === 1 ? 'office' : 'offices'} shown
                                        </span>
                                    </div>
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {groupItems.map((entry) => {
                                            const recordsHref = safeRecordsHref(entry);
                                            return (
                                                <article
                                                    key={entry.key}
                                                    className="flex min-w-0 flex-col rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 transition-colors hover:border-[var(--brand-primary)]"
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <OfficeLogo officeCode={entry.backingDepartmentCode} directoryKey={entry.key} officeName={entry.name} />
                                                        <span className="min-w-0 truncate text-sm font-bold text-[var(--brand-ink)]">
                                                            {entry.shortName}
                                                        </span>
                                                    </div>
                                                    <h3 className="mt-2.5 text-sm font-bold leading-snug text-[var(--ink-primary)]">{entry.name}</h3>
                                                    <p className="mt-1 flex-1 text-xs leading-5 text-[var(--ink-secondary)]">{entry.responsibility}</p>
                                                    <div className="mt-3 border-t border-[var(--border-default)] pt-2.5">
                                                        {recordsHref ? (
                                                            <a
                                                                className="inline-flex min-h-10 items-center text-xs font-semibold text-[var(--brand-ink)] hover:underline"
                                                                href={recordsHref}
                                                            >
                                                                Open authorized office records →
                                                            </a>
                                                        ) : (
                                                            <p className="text-xs text-[var(--ink-secondary)]">Records access unavailable — authority pending — office enrollment pending</p>
                                                        )}
                                                    </div>
                                                </article>
                                            );
                                        })}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </div>
            </AppLayout>
        );
    }

    const executive = departments.filter((office) => office.branch === 'executive');
    const legislative = departments.filter((office) => office.branch === 'legislative');

    const officeCard = (office: Office) => (
        <article key={office.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
            <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-ink)]" aria-hidden="true">
                    {office.is_executive ? <Crown size={20} /> : office.is_legislative ? <Gavel size={20} /> : <Building2 size={20} />}
                </span>
                <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--brand-ink)]">
                        {office.code} · {humanizeSlug(office.office_type)}
                    </p>
                    <h3 className="text-sm font-bold text-[var(--ink-primary)]">{office.name}</h3>
                    {office.short_name && office.short_name !== office.name && (
                        <p className="text-xs text-[var(--ink-secondary)]">{office.short_name}</p>
                    )}
                </div>
            </div>
            <dl className="flex items-center gap-5 text-xs">
                <div>
                    <dt className="text-[var(--ink-secondary)]">Active employees</dt>
                    <dd className="mt-0.5 text-base font-extrabold tabular-nums text-[var(--ink-primary)]">{office.active_employees_count}</dd>
                </div>
                <div>
                    <dt className="text-[var(--ink-secondary)]">Active work</dt>
                    <dd className="mt-0.5 text-base font-extrabold tabular-nums text-[var(--ink-primary)]">{office.active_transactions_count}</dd>
                </div>
            </dl>
        </article>
    );

    return (
        <AppLayout title="Municipal Offices">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                {/* Reference municipal directory — subject to LGU validation */}
                    <PageHeader
                    eyebrow="Municipal operating structure"
                    title="Municipal Offices"
                    subtitle="Explore municipal offices, their branch placement, and authorized summary counts."
                />

                <section aria-label="Municipal office summary" className="grid grid-cols-2 gap-3 lg:grid-cols-5">
                    <KpiCard label="Municipal offices" value={summary.offices} accent="brand" />
                    <KpiCard label="Executive" value={summary.executiveOffices} accent="neutral" />
                    <KpiCard label="Legislative" value={summary.legislativeOffices} accent="neutral" />
                    <KpiCard label="Active employees" value={summary.employees} accent="ok" />
                    <KpiCard label="Active routed work" value={summary.activeTransactions} accent="warn" />
                </section>

                <section className="tcds-card space-y-3 p-5" aria-labelledby="executive-offices-heading">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                            <Network size={14} aria-hidden="true" />
                            <span>Executive and administrative branch</span>
                        </div>
                        <h2 id="executive-offices-heading" className="mt-1 text-lg font-bold text-[var(--ink-primary)]">
                            Offices supporting municipal operations
                        </h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {executive.map(officeCard)}
                        {executive.length === 0 && <p className="text-sm text-[var(--ink-secondary)]">No executive or administrative offices supplied.</p>}
                    </div>
                </section>

                <section className="tcds-card space-y-3 p-5" aria-labelledby="legislative-offices-heading">
                    <div>
                        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                            <Users size={14} aria-hidden="true" />
                            <span>Legislative branch</span>
                        </div>
                        <h2 id="legislative-offices-heading" className="mt-1 text-lg font-bold text-[var(--ink-primary)]">
                            Vice Mayor, Sangguniang Bayan, and legislative support
                        </h2>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                        {legislative.map(officeCard)}
                        {legislative.length === 0 && <p className="text-sm text-[var(--ink-secondary)]">No legislative offices supplied.</p>}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
