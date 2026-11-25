import { Link, useForm } from '@inertiajs/react';
import {
    ArrowLeft,
    ArrowRight,
    Building2,
    CalendarClock,
    CheckCircle2,
    Clock3,
    FileText,
    Radio,
    RotateCcw,
    Send,
    UserRoundCheck,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import EvidenceFields from '../../components/documents/EvidenceFields';
import EvidenceList, { type EvidencePayload } from '../../components/documents/EvidenceList';
import { StatusBadge, toneForWorkState } from '../../components/ui';
import { useVisiblePolling } from '../../hooks/useVisiblePolling';
import AppLayout from '../../layouts/AppLayout';
import { formatDatePH, formatDateTimePH, humanizeSlug } from '../../lib/format';

type Dept = { id: number; code: string; name: string; short_name?: string };
type Employee = { id: number; employee_number: string; full_name?: string; position_title: string };
type Event = {
    id: number;
    action: string;
    previous_status?: string;
    new_status?: string;
    remarks?: string;
    created_at: string;
    actor: { name: string; employee?: { department?: Dept } };
    from_department?: Dept;
    to_department?: Dept;
};
type Tx = {
    id: number;
    reference_no: string;
    title: string;
    description?: string;
    transaction_type: string;
    priority: string;
    status: string;
    created_at: string;
    received_at?: string;
    due_at?: string;
    completed_at?: string;
    origin_department: Dept;
    current_department: Dept;
    creator: { name: string };
    assigned_employee?: Employee | null;
    events: Event[];
};
type Accountability = {
    dueState: 'on_track' | 'due_soon' | 'overdue' | 'completed';
    timeInCurrentOffice: string;
    receivedAt?: string | null;
    dueAt?: string | null;
    completedAt?: string | null;
};
type Permissions = { canTransition: boolean; canMayorDecision: boolean; canAssign: boolean };
type LivePayload = {
    transaction: {
        status: string;
        current_department: Dept;
        assigned_employee?: Employee | null;
        received_at?: string | null;
        due_at?: string | null;
        completed_at?: string | null;
    };
    accountability: Accountability;
    permissions: Permissions;
    assignableEmployees: Employee[];
    events: Event[];
};
type WorkflowForm = {
    action: string;
    target_department_id: number | '';
    assigned_employee_id: number | '';
    remarks: string;
    evidence: File[];
};

export default function Show({
    transaction: initialTx,
    departments,
    assignableEmployees: initialAssignableEmployees,
    accountability: initialAccountability,
    transactionPermissions: initialPermissions,
    evidence,
    returnTo,
}: {
    transaction: Tx;
    departments: Dept[];
    assignableEmployees: Employee[];
    accountability: Accountability;
    transactionPermissions: Permissions;
    evidence: EvidencePayload;
    returnTo: string;
}) {
    const [tx, setTx] = useState(initialTx);
    const [assignableEmployees, setAssignableEmployees] = useState(initialAssignableEmployees);
    const [accountability, setAccountability] = useState(initialAccountability);
    const [permissions, setPermissions] = useState(initialPermissions);
    const [liveState, setLiveState] = useState<'checking' | 'current' | 'stale' | 'expired'>('checking');
    const latestEventId = useRef(initialTx.events.reduce((latest, event) => Math.max(latest, event.id), 0));
    const form = useForm<WorkflowForm>({
        action: 'mark_review',
        target_department_id: '',
        assigned_employee_id: initialTx.assigned_employee?.id ?? '',
        remarks: '',
        evidence: [],
    });

    useEffect(() => {
        setTx(initialTx);
        setAssignableEmployees(initialAssignableEmployees);
        setAccountability(initialAccountability);
        setPermissions(initialPermissions);
        setLiveState('checking');
        latestEventId.current = initialTx.events.reduce((latest, event) => Math.max(latest, event.id), 0);
    }, [initialTx, initialAssignableEmployees, initialAccountability, initialPermissions]);

    useVisiblePolling(
        async (signal) => {
            const response = await fetch(`/transactions/${tx.id}/live?after_event_id=${latestEventId.current}`, {
                credentials: 'same-origin',
                headers: { Accept: 'application/json' },
                signal,
            });

            if ([401, 403, 419].includes(response.status)) {
                setLiveState('expired');
                return;
            }
            if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) {
                setLiveState('stale');
                return;
            }

            let payload: LivePayload;
            try {
                payload = (await response.json()) as LivePayload;
            } catch {
                setLiveState('stale');
                return;
            }
            if (
                !Array.isArray(payload?.events)
                || !payload.transaction
                || !payload.accountability
                || !payload.permissions
                || !Array.isArray(payload.assignableEmployees)
            ) {
                setLiveState('stale');
                return;
            }
            if (payload.events.length > 0) {
                latestEventId.current = Math.max(latestEventId.current, ...payload.events.map((event) => event.id));
            }

            setTx((current) => {
                const knownEventIds = new Set(current.events.map((event) => event.id));
                const newEvents = payload.events.filter((event) => !knownEventIds.has(event.id));

                return {
                    ...current,
                    status: payload.transaction.status,
                    current_department: payload.transaction.current_department,
                    assigned_employee: payload.transaction.assigned_employee,
                    received_at: payload.transaction.received_at ?? undefined,
                    due_at: payload.transaction.due_at ?? undefined,
                    completed_at: payload.transaction.completed_at ?? undefined,
                    events: [...current.events, ...newEvents],
                };
            });
            setAssignableEmployees(payload.assignableEmployees);
            setAccountability(payload.accountability);
            setPermissions(payload.permissions);
            setLiveState('current');
        },
        4000,
        !form.processing,
        () => setLiveState('stale'),
    );

    useEffect(() => {
        form.setData('assigned_employee_id', tx.assigned_employee?.id ?? '');
    }, [tx.assigned_employee?.id]);

    const transition = (action: string) => {
        form.transform((data) => ({ ...data, action }));
        form.post(`/transactions/${tx.id}/transition`, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => form.reset('remarks', 'evidence'),
        });
    };

    const originName = tx.origin_department.short_name || tx.origin_department.name;
    const currentOfficeName = tx.current_department.short_name || tx.current_department.name;
    const liveStatusLabel = liveState === 'current'
        ? 'Updates current'
        : liveState === 'expired'
            ? 'Session expired'
            : liveState === 'stale'
                ? 'Last known state'
                : 'Checking updates…';

    return (
        <AppLayout title={tx.reference_no}>
            <div className="mx-auto max-w-[1440px] space-y-4 px-4 py-4 sm:px-6">
                {/* Compact top navigation bar */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                    <Link
                        href={returnTo}
                        className="inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-[var(--brand-ink)] hover:underline"
                    >
                        <ArrowLeft size={15} aria-hidden="true" />
                        <span>Back to Work Requests</span>
                    </Link>
                    <div
                        role="status"
                        className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${
                            liveState === 'current'
                                ? 'border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] text-[var(--status-ok-fg)]'
                                : 'border-[var(--status-warn-border)] bg-[var(--status-warn-bg)] text-[var(--status-warn-fg)]'
                        }`}
                    >
                        <Radio size={13} aria-hidden="true" />
                        <span>{liveStatusLabel}</span>
                    </div>
                </div>

                {/* Compact TCDS header card — concise summary & 1-row metadata strip */}
                <section className="tcds-card p-4 sm:p-5">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    {tx.reference_no}
                                </span>
                                <span className="text-xs text-[var(--ink-secondary)]">· {humanizeSlug(tx.transaction_type)}</span>
                            </div>
                            <h1 className="mt-1 text-xl font-extrabold leading-snug tracking-tight text-[var(--ink-primary)] sm:text-2xl">
                                {tx.title}
                            </h1>
                            {tx.description && (
                                <p className="mt-1.5 max-w-4xl text-sm leading-6 text-[var(--ink-secondary)]">
                                    {tx.description}
                                </p>
                            )}
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            <StatusBadge tone={toneForWorkState(tx.status)}>{humanizeSlug(tx.status)}</StatusBadge>
                            <StatusBadge tone={toneForWorkState(tx.priority)}>{humanizeSlug(tx.priority)}</StatusBadge>
                            <StatusBadge tone={toneForWorkState(accountability.dueState)}>{humanizeSlug(accountability.dueState)}</StatusBadge>
                        </div>
                    </div>

                    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[var(--border-default)] pt-3.5 text-sm sm:grid-cols-3 lg:grid-cols-5">
                        <div className="min-w-0">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Origin</dt>
                            <dd className="mt-0.5 truncate font-semibold text-[var(--ink-primary)]">{originName}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Current Office</dt>
                            <dd className="mt-0.5 truncate font-semibold text-[var(--brand-ink)]">{currentOfficeName}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Assignee</dt>
                            <dd className="mt-0.5 truncate font-semibold text-[var(--ink-primary)]">{tx.assigned_employee?.full_name || 'Unassigned'}</dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Target Due</dt>
                            <dd className="mt-0.5 whitespace-nowrap font-semibold text-[var(--ink-primary)]">
                                {accountability.dueAt ? formatDatePH(accountability.dueAt) : 'Not set'}
                            </dd>
                        </div>
                        <div className="min-w-0">
                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">Time in Office</dt>
                            <dd className="mt-0.5 whitespace-nowrap font-semibold text-[var(--ink-primary)]">{accountability.timeInCurrentOffice}</dd>
                        </div>
                    </dl>
                </section>

                {/* Compact 2-column operational workspace — Routing History immediately visible above the fold */}
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_290px] xl:grid-cols-[minmax(0,1.45fr)_320px] lg:items-start">
                    <div className="min-w-0 space-y-4">
                        {(permissions.canTransition || permissions.canMayorDecision) && (
                            <section className="tcds-card border-l-4 border-l-[var(--brand-primary)] p-4 sm:p-5">
                                <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-primary)]">
                                    <Send size={16} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <span>Workflow actions</span>
                                </div>
                                <textarea
                                    value={form.data.remarks}
                                    onChange={(e) => form.setData('remarks', e.target.value)}
                                    rows={2}
                                    className="tcds-input mt-3 min-h-20 resize-y"
                                    placeholder="Review note / routing remarks"
                                />
                                <div className="mt-3">
                                    <EvidenceFields
                                        files={form.data.evidence}
                                        onChange={(files) => form.setData('evidence', files)}
                                        errors={form.errors as Record<string, string | undefined>}
                                        disabled={form.processing}
                                        label="Evidence for this workflow action"
                                    />
                                </div>

                                {permissions.canAssign && (
                                    <div className="mt-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3">
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-[var(--ink-primary)]">
                                            <UserRoundCheck size={14} aria-hidden="true" />
                                            <span>Assign responsible employee</span>
                                        </div>
                                        <div className="mt-2 flex gap-2">
                                            <select
                                                value={form.data.assigned_employee_id}
                                                onChange={(e) => form.setData('assigned_employee_id', e.target.value ? Number(e.target.value) : '')}
                                                className="tcds-input min-w-0 flex-1"
                                            >
                                                <option value="">Choose employee…</option>
                                                {assignableEmployees.map((employee) => (
                                                    <option key={employee.id} value={employee.id}>
                                                        {employee.full_name || employee.employee_number} · {employee.position_title}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                disabled={!form.data.assigned_employee_id || form.processing}
                                                onClick={() => transition('assign')}
                                                className="municipal-primary-button disabled:opacity-40"
                                            >
                                                Assign
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {permissions.canTransition && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button type="button" disabled={form.processing} onClick={() => transition('mark_review')} className="municipal-secondary-button">
                                            <Clock3 size={14} aria-hidden="true" />
                                            <span>Mark for Review</span>
                                        </button>
                                        <button type="button" disabled={form.processing} onClick={() => transition('send_to_mayor')} className="municipal-primary-button">
                                            <span>Send to Mayor&apos;s Office</span>
                                        </button>
                                        <button type="button" disabled={form.processing} onClick={() => transition('return_origin')} className="municipal-secondary-button">
                                            <RotateCcw size={14} aria-hidden="true" />
                                            <span>Return to Origin</span>
                                        </button>
                                        <div className="flex min-w-0 basis-full gap-2 sm:min-w-[260px] sm:flex-1 sm:basis-auto">
                                            <select
                                                value={form.data.target_department_id}
                                                onChange={(e) => form.setData('target_department_id', e.target.value ? Number(e.target.value) : '')}
                                                className="tcds-input min-w-0 flex-1"
                                            >
                                                <option value="">Forward to department…</option>
                                                {departments
                                                    .filter((d) => d.id !== tx.current_department.id)
                                                    .map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name}</option>
                                                    ))}
                                            </select>
                                            <button
                                                type="button"
                                                disabled={!form.data.target_department_id || form.processing}
                                                onClick={() => transition('forward')}
                                                className="municipal-secondary-button disabled:opacity-40"
                                            >
                                                Forward
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {permissions.canMayorDecision && (
                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-3">
                                        <button type="button" disabled={form.processing} onClick={() => transition('approve')} className="municipal-primary-button">
                                            <CheckCircle2 size={14} aria-hidden="true" />
                                            <span>Approve</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={form.processing}
                                            onClick={() => transition('disapprove')}
                                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg bg-[var(--status-danger-bar)] px-4 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
                                        >
                                            Disapprove
                                        </button>
                                        <button type="button" disabled={form.processing} onClick={() => transition('request_information')} className="municipal-secondary-button">
                                            Request Information
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        <section className="tcds-card overflow-hidden" aria-labelledby="routing-history-heading">
                            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">
                                <div>
                                    <h2 id="routing-history-heading" className="text-sm font-bold text-[var(--ink-primary)]">
                                        Routing history
                                    </h2>
                                    <p className="text-xs text-[var(--ink-secondary)]">
                                        Append-only workflow evidence · updates automatically
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                    {tx.events.length} {tx.events.length === 1 ? 'event' : 'events'}
                                </span>
                            </div>

                            <div className="divide-y divide-[var(--border-default)]">
                                {tx.events.map((event) => (
                                    <div key={event.id} className="grid gap-2.5 px-4 py-3.5 sm:px-5 md:grid-cols-[28px_minmax(0,1fr)_auto]">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                                            <ArrowRight size={14} aria-hidden="true" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-sm font-semibold text-[var(--ink-primary)]">
                                                {humanizeSlug(event.action)}
                                            </div>
                                            <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                                {event.from_department?.short_name || event.from_department?.name || 'Origin'} →{' '}
                                                {event.to_department?.short_name || event.to_department?.name || currentOfficeName}
                                                {' · '}By {event.actor.name}
                                            </div>
                                            {event.remarks && (
                                                <div className="mt-2 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-3 py-1.5 text-xs leading-5 text-[var(--ink-secondary)]">
                                                    {event.remarks}
                                                </div>
                                            )}
                                            <EvidenceList items={evidence.events[String(event.id)] ?? []} compact />
                                        </div>
                                        <time
                                            dateTime={event.created_at}
                                            className="whitespace-nowrap text-xs font-medium text-[var(--ink-secondary)] md:text-right"
                                        >
                                            {formatDateTimePH(event.created_at)}
                                        </time>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>

                    {/* Slim right rail for filing metadata & evidence */}
                    <aside className="space-y-4">
                        <section className="tcds-card p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <CalendarClock size={14} aria-hidden="true" />
                                <span>Filing &amp; Accountability</span>
                            </div>
                            <dl className="mt-3 divide-y divide-[var(--border-default)] text-xs">
                                <div className="flex items-start justify-between gap-3 py-2 first:pt-0">
                                    <dt className="font-semibold text-[var(--ink-secondary)]">Received</dt>
                                    <dd className="text-right font-semibold text-[var(--ink-primary)]">
                                        {accountability.receivedAt ? formatDateTimePH(accountability.receivedAt) : 'Not recorded'}
                                    </dd>
                                </div>
                                <div className="flex items-start justify-between gap-3 py-2">
                                    <dt className="font-semibold text-[var(--ink-secondary)]">Created by</dt>
                                    <dd className="text-right font-semibold text-[var(--ink-primary)]">{tx.creator.name}</dd>
                                </div>
                                <div className="flex items-start justify-between gap-3 py-2">
                                    <dt className="font-semibold text-[var(--ink-secondary)]">Origin office</dt>
                                    <dd className="text-right font-semibold text-[var(--ink-primary)]">{tx.origin_department.name}</dd>
                                </div>
                                {accountability.completedAt && (
                                    <div className="flex items-start justify-between gap-3 py-2 last:pb-0">
                                        <dt className="font-semibold text-[var(--ink-secondary)]">Completed</dt>
                                        <dd className="text-right font-semibold text-[var(--status-ok-fg)]">
                                            {formatDateTimePH(accountability.completedAt)}
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </section>

                        <section className="tcds-card p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <FileText size={14} aria-hidden="true" />
                                <span>Supporting Evidence</span>
                            </div>
                            <div className="mt-3">
                                <EvidenceList items={evidence.record} emptyLabel="No supporting files attached to this request." />
                            </div>
                        </section>

                        <section className="tcds-card p-4">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                <Building2 size={14} aria-hidden="true" />
                                <span>Quick Navigation</span>
                            </div>
                            <div className="mt-2.5 flex flex-col gap-1.5 text-xs">
                                <Link
                                    href={`/records?search=${encodeURIComponent(tx.reference_no)}`}
                                    className="rounded-lg border border-[var(--border-default)] px-3 py-2 font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                                >
                                    Search {tx.reference_no} in Records →
                                </Link>
                                <Link
                                    href="/transactions?view=office_queue"
                                    className="rounded-lg border border-[var(--border-default)] px-3 py-2 font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"
                                >
                                    Open full Work Queue →
                                </Link>
                            </div>
                        </section>
                    </aside>
                </div>
            </div>
        </AppLayout>
    );
}
