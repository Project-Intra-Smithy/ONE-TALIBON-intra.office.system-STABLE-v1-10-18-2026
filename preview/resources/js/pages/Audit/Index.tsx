import { router } from '@inertiajs/react';
import { RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { type FormEvent, useId, useState } from 'react';
import { KpiCard, PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH } from '../../lib/format';

type Department = { id: number; name: string; short_name?: string | null };
type AuditEvent = {
    id: number;
    action: string;
    outcome: string;
    summary?: string | null;
    created_at?: string | null;
    occurred_at?: string | null;
    actor_name?: string | null;
    actor?: { name: string; employee?: { department?: Department | null } | null } | null;
    actor_department?: Department | null;
    department?: Department | null;
};
type Props = {
    events: AuditEvent[];
    summary: { events24h: number; denied24h: number; events7d: number; distinctActors7d: number };
    filters: { outcome?: string; action?: string; department_id?: string | number };
    departments: Department[];
};

const ACRONYMS = new Set(['hris', 'dtr', 'mfa', 'mpdc', 'mpdo', 'lgu', 'ppa', 'gis', 'clup', 'drrm']);

function formatEventLabel(value: string): string {
    return value
        .replace(/[._-]+/g, ' ')
        .split(/\s+/)
        .filter(Boolean)
        .map((word) => (ACRONYMS.has(word.toLowerCase()) ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
        .join(' ');
}

function resolveDepartmentName(event: AuditEvent): string {
    return (
        event.actor?.employee?.department?.short_name
        || event.actor?.employee?.department?.name
        || event.actor_department?.short_name
        || event.actor_department?.name
        || event.department?.short_name
        || event.department?.name
        || 'Not recorded'
    );
}

function resolveActorName(event: AuditEvent): string {
    return event.actor?.name || event.actor_name || 'System';
}

export default function Index({ events, summary, filters, departments }: Props) {
    const outcomeId = useId();
    const actionId = useId();
    const officeId = useId();

    const [outcome, setOutcome] = useState(String(filters.outcome || ''));
    const [action, setAction] = useState(String(filters.action || ''));
    const [departmentId, setDepartmentId] = useState(String(filters.department_id || ''));

    const apply = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            '/audit',
            {
                outcome: outcome || undefined,
                action: action || undefined,
                department_id: departmentId || undefined,
            },
            { preserveState: true, replace: true },
        );
    };

    const clear = () => {
        setOutcome('');
        setAction('');
        setDepartmentId('');
        router.get('/audit', {}, { replace: true });
    };

    return (
        <AppLayout title="Audit & Security">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Security & accountability evidence"
                    title="Audit & Security"
                    subtitle="Review sign-ins, privileged actions, and denied access attempts across authorized municipal workspaces."
                />

                <section aria-label="Audit activity summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <KpiCard label="Events · 24h" value={summary.events24h} accent="brand" />
                    <KpiCard label="Denied · 24h" value={summary.denied24h} accent={summary.denied24h > 0 ? 'danger' : 'ok'} />
                    <KpiCard label="Events · 7d" value={summary.events7d} accent="neutral" />
                    <KpiCard label="Actors · 7d" value={summary.distinctActors7d} accent="ok" />
                </section>

                <search>
                    <form
                        onSubmit={apply}
                        aria-label="Audit event filters"
                        className="tcds-card grid gap-3 p-4 md:grid-cols-[9.5rem_minmax(0,1fr)_10.5rem_auto] md:items-end"
                    >
                        <div>
                            <label htmlFor={outcomeId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Outcome
                            </label>
                            <select
                                id={outcomeId}
                                value={outcome}
                                onChange={(e) => setOutcome(e.target.value)}
                                className="tcds-input"
                            >
                                <option value="">All outcomes</option>
                                <option value="allowed">Allowed</option>
                                <option value="denied">Denied</option>
                            </select>
                        </div>

                        <div className="min-w-0">
                            <label htmlFor={actionId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Event code contains
                            </label>
                            <div className="relative">
                                <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--ink-secondary)]" />
                                <input
                                    id={actionId}
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    placeholder="e.g., account.reviewed, planning_map"
                                    className="tcds-input pl-9"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor={officeId} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Office
                            </label>
                            <select
                                id={officeId}
                                value={departmentId}
                                onChange={(e) => setDepartmentId(e.target.value)}
                                className="tcds-input"
                            >
                                <option value="">All offices</option>
                                {departments.map((d) => (
                                    <option key={d.id} value={d.id}>
                                        {d.short_name || d.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button type="submit" className="municipal-primary-button">
                                Apply
                            </button>
                            <button type="button" onClick={clear} className="municipal-secondary-button">
                                <RotateCcw size={15} aria-hidden="true" />
                                <span>Clear</span>
                            </button>
                        </div>
                    </form>
                </search>

                <section aria-label="Audit event results" className="tcds-card overflow-hidden">
                    <div className="flex items-center justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={16} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <div>
                                <h2 className="text-sm font-bold text-[var(--ink-primary)]">Recorded events</h2>
                                <p className="text-xs text-[var(--ink-secondary)]">Audited event summaries, actors, and timestamps (Asia/Manila).</p>
                            </div>
                        </div>
                        <span className="shrink-0 text-xs font-semibold text-[var(--ink-secondary)]">
                            {events.length} {events.length === 1 ? 'event' : 'events'}
                        </span>
                    </div>

                    <div className="divide-y divide-[var(--border-default)]">
                        {events.map((event) => {
                            const timestamp = event.created_at || event.occurred_at;
                            const isDenied = event.outcome === 'denied';
                            return (
                                <article
                                    key={event.id}
                                    className="grid min-w-0 gap-3 px-4 py-3.5 transition-colors hover:bg-[var(--surface-hover)] sm:px-5 lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,0.75fr)_190px] lg:items-start"
                                >
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="text-sm font-bold text-[var(--ink-primary)]">
                                                {formatEventLabel(event.action)}
                                            </h3>
                                            <StatusBadge tone={isDenied ? 'danger' : 'ok'}>
                                                {isDenied ? 'Denied' : event.outcome === 'success' ? 'Recorded' : 'Allowed'}
                                            </StatusBadge>
                                        </div>
                                        <p className="mt-1 text-xs leading-5 text-[var(--ink-secondary)]">
                                            {event.summary || 'No additional event summary was recorded.'}
                                        </p>
                                        <div className="mt-2">
                                            <code className="inline-block rounded-md border border-[var(--border-default)] bg-[var(--surface-recessed)] px-2 py-0.5 font-mono text-xs text-[var(--ink-secondary)]">
                                                {event.action}
                                            </code>
                                        </div>
                                    </div>

                                    <dl className="grid grid-cols-2 gap-3 text-xs lg:grid-cols-1 lg:gap-1.5">
                                        <div className="min-w-0">
                                            <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Actor</dt>
                                            <dd className="mt-0.5 font-semibold text-[var(--ink-primary)]">{resolveActorName(event)}</dd>
                                        </div>
                                        <div className="min-w-0">
                                            <dt className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Office</dt>
                                            <dd className="mt-0.5 text-[var(--ink-secondary)]">{resolveDepartmentName(event)}</dd>
                                        </div>
                                    </dl>

                                    <div className="text-xs lg:text-right">
                                        <div className="font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Recorded</div>
                                        {timestamp ? (
                                            <time className="mt-0.5 block font-semibold text-[var(--ink-primary)]" dateTime={timestamp}>
                                                {formatDateTimePH(timestamp)}
                                            </time>
                                        ) : (
                                            <span className="mt-0.5 block text-[var(--ink-secondary)]">Not recorded</span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}

                        {events.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm text-[var(--ink-secondary)]">
                                No audit events match the current filters.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
