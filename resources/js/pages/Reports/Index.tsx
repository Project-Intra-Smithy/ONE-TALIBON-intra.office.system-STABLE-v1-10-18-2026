import { Link, router, useForm } from '@inertiajs/react';
import { ArrowRight, Download, FileBarChart, LoaderCircle, RotateCcw, Search } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';
import ProgressiveFilterBar from '../../components/filters/ProgressiveFilterBar';
import PageHeader from '../../components/PageHeader';
import { DateInput } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';

type Column = { key: string; label: string };
type Report = {
    key: string;
    label: string;
    description: string;
    filters: string[];
    columns: Column[];
    kind: 'aggregate' | 'rows';
};
type Option = { id: number; label: string };
type FilterOptions = {
    offices: Option[];
    statuses: string[];
    priorities: string[];
    transactionTypes: string[];
    lifecycles: string[];
    classifications: string[];
};
type Row = Record<string, string | number | null | undefined> & { id: string | number; detailUrl?: string };
type PageLink = { url: string | null; label: string; active: boolean };
type Result = {
    data: Row[];
    total: number;
    current_page: number;
    last_page: number;
    per_page: number;
    links: PageLink[];
};
type Filters = {
    report: string;
    date_from: string;
    date_to: string;
    office: string;
    status: string;
    priority: string;
    transaction_type: string;
    lifecycle: string;
    classification: string;
};
type Props = {
    catalog: Report[];
    activeReport: string;
    filters: Partial<Filters>;
    filterOptions: FilterOptions;
    result: Result;
    errors?: Record<string, string>;
};

const headline = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const fieldClass = 'mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)] dark:border-[var(--border-control)]';
const leadKeys: Record<string, string[]> = {
    'office-workload': ['office'],
    'transaction-aging': ['reference', 'title'],
    'correspondence-status': ['municipalReference', 'subject'],
    'document-movement': ['municipalReference', 'subject'],
    'completed-work': ['reference', 'title'],
    'overdue-action-required': ['reference', 'title'],
};
const emphasisKeys = new Set(['status', 'priority', 'dueState', 'lifecycle', 'classification', 'event', 'hasEvidence', 'finalStatus']);

export default function ReportsIndex({ catalog, activeReport, filters, filterOptions, result, errors = {} }: Props) {
    const report = catalog.find((item) => item.key === activeReport) ?? catalog[0];
    const { data, setData, get, processing } = useForm<Filters>({
        report: activeReport,
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        office: filters.office?.toString() ?? '',
        status: filters.status ?? '',
        priority: filters.priority ?? '',
        transaction_type: filters.transaction_type ?? '',
        lifecycle: filters.lifecycle ?? '',
        classification: filters.classification ?? '',
    });

    const supports = (filter: string) => report.filters.includes(filter);
    const apply = (event: FormEvent) => {
        event.preventDefault();
        get('/reports', { preserveScroll: true, preserveState: true, replace: true });
    };
    const selectReport = (key: string) => router.get('/reports', { report: key }, { preserveScroll: true });
    const reset = () => router.get('/reports', { report: activeReport }, { preserveScroll: true, replace: true });
    const exportParams = new URLSearchParams(
        Object.entries(filters).filter(([, value]) => value !== '' && value !== undefined) as [string, string][],
    );
    const exportUrl = `/reports/export/${activeReport}${exportParams.size ? `?${exportParams}` : ''}`;
    const selectedOffice = filterOptions.offices.find((office) => String(office.id) === data.office);
    const activeFilters = [
        data.date_from ? `From: ${data.date_from}` : '',
        data.date_to ? `To: ${data.date_to}` : '',
        data.office ? `Office: ${selectedOffice?.label || data.office}` : '',
        data.status ? `Status: ${headline(data.status)}` : '',
        data.priority ? `Priority: ${headline(data.priority)}` : '',
        data.transaction_type ? `Type: ${headline(data.transaction_type)}` : '',
        data.lifecycle ? `Lifecycle: ${headline(data.lifecycle)}` : '',
        data.classification ? `Class: ${headline(data.classification)}` : '',
    ].filter(Boolean);
    const hasCommonFilters = supports('office') || supports('status');
    const hasAdvancedFilters = ['date_from', 'date_to', 'priority', 'transaction_type', 'lifecycle', 'classification'].some(supports);

    return <AppLayout title="Operational Reports">
        <div className="mx-auto max-w-7xl space-y-4">
            <PageHeader eyebrow="Municipal operational reporting" title="Operational Reports" icon={FileBarChart}
                description="Generated summaries and export views over authorized operational data. Use Records Register for authoritative individual records; this is not a separate archive."
                aside={
                <label className="block min-w-64 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)] sm:text-xs">Report view
                    <select value={activeReport} onChange={(event) => selectReport(event.target.value)} className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm normal-case tracking-normal text-slate-900 dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)] dark:border-[var(--border-control)]">
                        {catalog.map((item) => <option key={item.key} value={item.key}>{item.label}</option>)}
                    </select>
                </label>
                }
            />

            <form onSubmit={apply} className="space-y-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0"><div className="text-xs font-bold uppercase tracking-[0.13em] text-[var(--brand-ink)]">Selected report</div><h2 className="mt-0.5 font-bold text-[var(--ink-primary)]">{report.label}</h2><p className="mt-1 max-w-3xl text-xs leading-5 text-[var(--ink-secondary)]">{report.description}</p></div>
                    {errors.export ? (
                        <button
                            type="button"
                            disabled
                            title={errors.export}
                            className="inline-flex min-h-10 w-fit cursor-not-allowed items-center gap-2 rounded-lg border border-[var(--border-control)] bg-[var(--surface-recessed)] px-3.5 py-2 text-xs font-semibold text-[var(--ink-secondary)] opacity-80"
                        >
                            <Download size={15} aria-hidden="true" />
                            <span>CSV export disabled (preview)</span>
                        </button>
                    ) : (
                        <a href={exportUrl} className="inline-flex min-h-10 w-fit items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[var(--brand-primary-hover)]"><Download size={15} aria-hidden="true" /> Export CSV</a>
                    )}
                </div>

                <ProgressiveFilterBar
                    title="Filter scope"
                    activeFilters={activeFilters}
                    primary={(
                        <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-2.5">
                            <div className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--brand-ink)]">Filter scope</div>
                            <div className="mt-0.5 text-xs font-semibold text-[var(--ink-primary)]">Filters apply to {report.label} only.</div>
                        </div>
                    )}
                    common={hasCommonFilters ? (
                        <>
                            {supports('office') && <Field label="Office" error={errors.office}><select value={data.office} onChange={(event) => setData('office', event.target.value)} className={fieldClass}><option value="">All authorized offices</option>{filterOptions.offices.map((office) => <option key={office.id} value={office.id}>{office.label}</option>)}</select></Field>}
                            {supports('status') && <Choice label="Status" value={data.status} values={filterOptions.statuses} onChange={(value) => setData('status', value)} error={errors.status} />}
                        </>
                    ) : undefined}
                    advanced={hasAdvancedFilters ? (
                        <>
                            {supports('date_from') && <Field label="Date from" error={errors.date_from}><DateInput value={data.date_from} onChange={(next) => setData('date_from', next)} presets="range_start" className="mt-1.5" /></Field>}
                            {supports('date_to') && <Field label="Date to" error={errors.date_to}><DateInput value={data.date_to} onChange={(next) => setData('date_to', next)} className="mt-1.5" /></Field>}
                            {supports('priority') && <Choice label="Priority" value={data.priority} values={filterOptions.priorities} onChange={(value) => setData('priority', value)} error={errors.priority} />}
                            {supports('transaction_type') && <Choice label="Transaction type" value={data.transaction_type} values={filterOptions.transactionTypes} onChange={(value) => setData('transaction_type', value)} error={errors.transaction_type} />}
                            {supports('lifecycle') && <Choice label="Lifecycle" value={data.lifecycle} values={filterOptions.lifecycles} onChange={(value) => setData('lifecycle', value)} error={errors.lifecycle} />}
                            {supports('classification') && <Choice label="Classification" value={data.classification} values={filterOptions.classifications} onChange={(value) => setData('classification', value)} error={errors.classification} />}
                        </>
                    ) : undefined}
                    actions={(
                        <>
                            <button disabled={processing} className="municipal-primary-button disabled:opacity-60">{processing ? <LoaderCircle className="animate-spin" size={15} /> : <Search size={15} />} Apply</button>
                            <button type="button" onClick={reset} className="municipal-secondary-button"><RotateCcw size={14} /> Reset</button>
                        </>
                    )}
                />
            </form>

            <section aria-label={`${report.label} results`} className="tcds-card overflow-hidden">
                <div className="flex flex-col gap-1 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div>
                        <div className="text-sm font-bold text-[var(--ink-primary)]">Results · {report.kind === 'aggregate' ? 'Office summary' : 'Detailed results'}</div>
                        <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">{report.label}</div>
                    </div>
                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">{result.total.toLocaleString('en-PH')} {result.total === 1 ? 'result' : 'results'}</span>
                </div>

                {result.data.length === 0 ? (
                    <div className="px-5 py-8 text-center">
                        <div className="text-sm font-semibold text-[var(--ink-secondary)]">No authorized report results match these filters.</div>
                        <div className="mt-1 text-xs text-[var(--ink-secondary)]">Adjust the report criteria or reset the filters.</div>
                    </div>
                ) : <ReportResultList report={report} rows={result.data} />}

                {result.last_page > 1 && <nav aria-label="Report result pages" className="flex flex-wrap gap-1 border-t border-[var(--border-default)] px-4 py-2.5">{result.links.map((link, index) => { const text = link.label.replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&').replace(/<[^>]+>/g, '').trim(); return link.url ? <Link key={`${text}-${index}`} href={link.url} preserveScroll className={`inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-xs font-semibold ${link.active ? 'bg-[var(--brand-primary)] text-white' : 'border border-[var(--border-control)] text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]'}`}>{text}</Link> : <span key={`${text}-${index}`} className="inline-flex min-h-10 items-center rounded-lg px-3 py-1.5 text-xs text-[var(--ink-secondary)] opacity-60">{text}</span>; })}</nav>}
            </section>
        </div>
    </AppLayout>;
}

function ReportResultList({ report, rows }: { report: Report; rows: Row[] }) {
    if (report.kind === 'aggregate' && report.columns.length <= 6) {
        return (
            <div tabIndex={0} role="region" aria-label={`${report.label} summary table`} className="overflow-x-auto">
                <table className="tcds-table" data-stack-mobile="true">
                    <thead>
                        <tr>
                            {report.columns.map((column, idx) => (
                                <th key={column.key} scope="col" className={idx > 0 ? 'text-right' : ''}>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {report.columns.map((column, idx) =>
                                    idx === 0 ? (
                                        <th key={column.key} scope="row" className="font-semibold text-[var(--ink-primary)]">
                                            {display(row[column.key])}
                                        </th>
                                    ) : (
                                        <td
                                            key={column.key}
                                            data-label={column.label}
                                            className={`tabular-nums sm:text-right ${
                                                column.key === 'overdue' && Number(row[column.key]) > 0
                                                    ? 'font-bold text-[var(--status-danger-fg)]'
                                                    : column.key === 'due_soon' && Number(row[column.key]) > 0
                                                      ? 'font-semibold text-[var(--status-warn-fg)]'
                                                      : 'font-semibold text-[var(--ink-primary)]'
                                            }`}
                                        >
                                            {display(row[column.key])}
                                        </td>
                                    ),
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    const leads = leadKeys[report.key] ?? report.columns.slice(0, 2).map((column) => column.key);
    const leadColumns = report.columns.filter((column) => leads.includes(column.key));
    const metaColumns = report.columns.filter((column) => !leads.includes(column.key));
    const primary = leadColumns[0];
    const secondary = leadColumns[1];

    return <div className="divide-y divide-[var(--border-default)]">
        {rows.map((row) => (
            <article key={row.id} className="px-4 py-3 sm:px-5">
                <div className="grid gap-4 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,2.2fr)_auto] lg:items-start">
                    <div className="min-w-0">
                        {primary && <>
                            <div className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-secondary)]">{primary.label}</div>
                            {row.detailUrl ? (
                                <Link href={row.detailUrl} className="mt-1 block w-fit max-w-full break-words text-xs font-bold text-[var(--brand-ink)] hover:underline">{display(row[primary.key])}</Link>
                            ) : (
                                <div className="mt-1 break-words text-sm font-bold text-[var(--ink-primary)]">{display(row[primary.key])}</div>
                            )}
                        </>}
                        {secondary && <>
                            <div className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-secondary)]">{secondary.label}</div>
                            <h3 className="mt-1 break-words text-sm font-semibold leading-5 text-[var(--ink-primary)]">{display(row[secondary.key])}</h3>
                        </>}
                    </div>

                    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3 xl:grid-cols-4">
                        {metaColumns.map((column) => (
                            <div key={column.key} className="min-w-0">
                                <dt className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--ink-secondary)]">{column.label}</dt>
                                <dd className="mt-1 break-words text-xs font-medium leading-4 text-[var(--ink-secondary)]">
                                    {emphasisKeys.has(column.key) ? (
                                        <span className={resultEmphasisClass(column.key, row[column.key])}>{display(row[column.key])}</span>
                                    ) : display(row[column.key])}
                                </dd>
                            </div>
                        ))}
                    </dl>

                    {row.detailUrl && (
                        <Link href={row.detailUrl} aria-label={`Open ${report.label} result ${display(row[primary?.key ?? 'id'])}`} className="municipal-secondary-button w-fit px-3 text-xs lg:justify-self-end">
                            Open <ArrowRight size={14} />
                        </Link>
                    )}
                </div>
            </article>
        ))}
    </div>;
}

function resultEmphasisClass(key: string, value: string | number | null | undefined) {
    const overdue = key === 'dueState' && String(value).toLowerCase() === 'overdue';
    return `inline-flex max-w-full rounded-md border px-1.5 py-0.5 text-xs font-bold sm:text-xs ${overdue ? 'border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-rose-700' : 'border-slate-200 bg-slate-50 text-slate-700 dark:bg-[var(--surface-card)] dark:text-[var(--ink-secondary)] dark:border-[var(--border-control)]'}`;
}

function display(value: string | number | null | undefined) {
    return value === null || value === undefined || value === '' ? '—' : String(value);
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
    return <label className="block min-w-40 text-xs font-semibold text-[var(--ink-secondary)]">{label}{children}{error && <span className="mt-1 block text-xs text-rose-700">{error}</span>}</label>;
}

function Choice({ label, value, values, onChange, error }: { label: string; value: string; values: string[]; onChange: (value: string) => void; error?: string }) {
    return <Field label={label} error={error}><select value={value} onChange={(event) => onChange(event.target.value)} className={fieldClass}><option value="">All authorized values</option>{values.map((option) => <option key={option} value={option}>{headline(option)}</option>)}</select></Field>;
}
