import { Link } from '@inertiajs/react';
import {
    Archive,
    ArrowUpRight,
    BookOpen,
    Building2,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    Landmark,
    MapPin,
    Paperclip,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    formatPhpCurrency,
    type PlanningAttachment,
    type PlanningSuitePermissions,
} from '../../data/municipal/planningGovernance';
import { DEFAULT_PLANNING_MAPS } from '../../data/municipal/planningMaps';
import type { MunicipalPlan } from '../../data/municipal/plans';
import type { PPARecord } from '../../data/municipal/ppas.types';
import SupportingDocsPanel from '../planning/SupportingDocsPanel';
import { Button, Dialog, StatusBadge } from '../ui';

const statusTone: Record<PPARecord['status'], 'neutral' | 'warn' | 'info' | 'ok' | 'danger'> = {
    Draft: 'neutral',
    'For MPDC Review': 'warn',
    Planned: 'neutral',
    'For Procurement': 'warn',
    Ongoing: 'info',
    Completed: 'ok',
    'On Hold': 'danger',
    Archived: 'neutral',
};

type DossierTab = 'overview' | 'links' | 'docs';

type Props = {
    record: PPARecord | null;
    plans: MunicipalPlan[];
    attachments: PlanningAttachment[];
    permissions: PlanningSuitePermissions;
    actorName: string;
    onClose: () => void;
    currentIndex?: number;
    totalCount?: number;
    onPrev?: () => void;
    onNext?: () => void;
    onEdit?: (record: PPARecord) => void;
    onArchive?: (record: PPARecord) => void;
    onDelete?: (record: PPARecord) => void;
    onAddAttachment: (attachment: PlanningAttachment) => void;
    onRemoveAttachment: (id: string) => void;
};

export default function PPADetailPanel({
    record,
    plans,
    attachments,
    permissions,
    actorName,
    onClose,
    currentIndex,
    totalCount,
    onPrev,
    onNext,
    onEdit,
    onArchive,
    onDelete,
    onAddAttachment,
    onRemoveAttachment,
}: Props) {
    const [tab, setTab] = useState<DossierTab>('overview');

    useEffect(() => {
        setTab('overview');
    }, [record?.id]);

    const recordDocs = record
        ? attachments.filter((doc) => doc.parentType === 'ppa' && doc.parentId === record.id)
        : [];
    const visibleDocCount = record
        ? recordDocs.filter((doc) => permissions.canViewAttachment(doc.visibility, record.responsibleOffice)).length
        : 0;

    const linkedPlan = record
        ? plans.find(
              (p) =>
                  p.id === record.linkedPlanId ||
                  p.title.toLowerCase() === record.relatedDevelopmentPlan.toLowerCase(),
          )
        : undefined;

    const linkedMap = record?.linkedMapId
        ? DEFAULT_PLANNING_MAPS.find((m) => m.id === record.linkedMapId)
        : undefined;

    const hasStepping = typeof currentIndex === 'number' && typeof totalCount === 'number' && totalCount > 1;
    const canEditThis = record ? permissions.canEditRecord(record.responsibleOffice, record.status) : false;

    return (
        <Dialog
            open={Boolean(record)}
            onClose={onClose}
            variant="drawer-right"
            title={record?.title ?? 'PPA details'}
            description={record ? `${record.id} · AIP ${record.aipRefCode} · FY ${record.year}` : undefined}
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    {hasStepping ? (
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onPrev}
                                disabled={currentIndex <= 0}
                                aria-label="Previous PPA record"
                            >
                                <ChevronLeft size={14} aria-hidden="true" />
                                <span>Prev</span>
                            </Button>
                            <span className="px-1.5 text-xs font-semibold tabular-nums text-[var(--ink-secondary)]">
                                {currentIndex + 1} / {totalCount}
                            </span>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={onNext}
                                disabled={currentIndex >= totalCount - 1}
                                aria-label="Next PPA record"
                            >
                                <span>Next</span>
                                <ChevronRight size={14} aria-hidden="true" />
                            </Button>
                        </div>
                    ) : (
                        <span className="text-xs text-[var(--ink-secondary)]">AIP reference record</span>
                    )}

                    <div className="flex flex-wrap items-center gap-1.5">
                        {record && canEditThis && onEdit && (
                            <Button variant="secondary" size="sm" onClick={() => onEdit(record)}>
                                <Pencil size={13} aria-hidden="true" />
                                <span>Edit</span>
                            </Button>
                        )}
                        {record && permissions.canArchive && onArchive && record.status !== 'Archived' && (
                            <Button variant="secondary" size="sm" onClick={() => onArchive(record)}>
                                <Archive size={13} aria-hidden="true" />
                                <span>Archive</span>
                            </Button>
                        )}
                        {record && permissions.canDelete && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(record)}
                                aria-label={`Delete ${record.id}`}
                                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 text-xs font-semibold text-[var(--status-danger-fg)] transition-colors hover:bg-[var(--status-danger-bg)]"
                            >
                                <Trash2 size={14} aria-hidden="true" />
                            </button>
                        )}
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Close
                        </Button>
                    </div>
                </div>
            }
        >
            {record && (
                <div id="selected-ppa-detail" className="space-y-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge tone={statusTone[record.status]}>{record.status}</StatusBadge>
                        <StatusBadge tone="neutral">{record.sector}</StatusBadge>
                        <StatusBadge tone={record.priority === 'High' ? 'warn' : 'neutral'}>
                            {record.priority} priority
                        </StatusBadge>
                        {record.gadAttributed && <StatusBadge tone="info">GAD</StatusBadge>}
                        {record.drrmTagged && <StatusBadge tone="warn">DRRM</StatusBadge>}
                    </div>

                    <div
                        role="tablist"
                        aria-label="PPA dossier sections"
                        className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--surface-recessed)] p-1"
                    >
                        {([
                            ['overview', 'Overview & Budget'],
                            ['links', 'Plan & Location'],
                            ['docs', `Docs (${visibleDocCount})`],
                        ] as const).map(([key, label]) => (
                            <button
                                key={key}
                                type="button"
                                role="tab"
                                aria-selected={tab === key}
                                onClick={() => setTab(key)}
                                className={`min-h-9 rounded-lg border px-2 text-xs font-bold transition-colors ${
                                    tab === key
                                        ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                        : 'border-transparent text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>

                    {tab === 'overview' && (
                        <div className="space-y-4">
                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    Expected outputs (Deliverables)
                                </p>
                                <p className="mt-1.5 text-sm font-medium leading-6 text-[var(--ink-primary)]">
                                    {record.expectedOutputs}
                                </p>
                                <p className="mt-2 border-t border-[var(--border-default)] pt-2 text-xs leading-5 text-[var(--ink-secondary)]">
                                    {record.implementationContext}
                                </p>
                            </section>

                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                    <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        <Landmark size={13} aria-hidden="true" />
                                        <span>Indicative AIP Budget Breakdown</span>
                                    </p>
                                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                                        {record.fundingSource}
                                    </span>
                                </div>

                                <dl className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                                    {[
                                        ['PS', formatPhpCurrency(record.budgetPs)],
                                        ['MOOE', formatPhpCurrency(record.budgetMooe)],
                                        ['CO', formatPhpCurrency(record.budgetCo)],
                                        ['Total', formatPhpCurrency(record.budgetTotal)],
                                    ].map(([label, amount]) => (
                                        <div
                                            key={label}
                                            className={`rounded-lg border p-2.5 ${
                                                label === 'Total'
                                                    ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)]'
                                                    : 'border-[var(--border-default)] bg-[var(--surface-card)]'
                                            }`}
                                        >
                                            <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                                {label}
                                            </dt>
                                            <dd
                                                className={`mt-1 font-mono text-xs font-extrabold tabular-nums ${
                                                    label === 'Total' ? 'text-[var(--brand-ink)]' : 'text-[var(--ink-primary)]'
                                                }`}
                                            >
                                                {amount}
                                            </dd>
                                        </div>
                                    ))}
                                </dl>

                                {(record.ccaAmount || record.ccmAmount) && (
                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-[var(--border-default)] pt-2.5 text-xs text-[var(--ink-secondary)]">
                                        {record.ccaAmount ? (
                                            <span>
                                                Climate Adaptation (CCA): <strong className="font-mono text-[var(--ink-primary)]">{formatPhpCurrency(record.ccaAmount)}</strong>
                                            </span>
                                        ) : null}
                                        {record.ccmAmount ? (
                                            <span>
                                                Climate Mitigation (CCM): <strong className="font-mono text-[var(--ink-primary)]">{formatPhpCurrency(record.ccmAmount)}</strong>
                                            </span>
                                        ) : null}
                                    </div>
                                )}
                            </section>

                            <dl className="grid gap-3 sm:grid-cols-2">
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        <Building2 size={13} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <span>Implementing Office</span>
                                    </dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {record.responsibleOffice}
                                    </dd>
                                </div>
                                <div className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                                    <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        <CalendarRange size={13} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                        <span>Implementation Schedule</span>
                                    </dt>
                                    <dd className="mt-1.5 text-sm font-semibold text-[var(--ink-primary)]">
                                        {record.scheduleStart} – {record.scheduleEnd}
                                    </dd>
                                </div>
                            </dl>

                            <p className="rounded-lg border border-dashed border-[var(--border-default)] px-3.5 py-2.5 text-xs leading-5 text-[var(--ink-secondary)]">
                                Indicative AIP planning allocation — not a live accounting obligation or disbursement record. No completion percentage is recorded for PPAs; reference records do not represent verified live project progress.
                            </p>
                        </div>
                    )}

                    {tab === 'links' && (
                        <div className="space-y-4">
                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                            <BookOpen size={13} aria-hidden="true" />
                                            <span>Parent Development Plan</span>
                                        </p>
                                        <h3 className="mt-1.5 text-sm font-bold text-[var(--ink-primary)]">
                                            {linkedPlan ? `${linkedPlan.code} — ${linkedPlan.title}` : record.relatedDevelopmentPlan}
                                        </h3>
                                        {linkedPlan && (
                                            <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                                                {linkedPlan.sbResolutionNo || linkedPlan.authority} · Lead: {linkedPlan.leadOffice}
                                            </p>
                                        )}
                                    </div>
                                    <Link
                                        href={linkedPlan ? `/development-plans?open=${encodeURIComponent(linkedPlan.id)}` : '/development-plans'}
                                        className="municipal-secondary-button shrink-0"
                                    >
                                        <span>Open Plan</span>
                                        <ArrowUpRight size={14} aria-hidden="true" />
                                    </Link>
                                </div>
                            </section>

                            <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    <MapPin size={13} aria-hidden="true" />
                                    <span>Covered Talibon Barangays ({record.barangays.length})</span>
                                </p>
                                <div className="mt-2.5 flex flex-wrap gap-1.5">
                                    {record.barangays.map((brgy) => (
                                        <span
                                            key={brgy}
                                            className="rounded-full border border-[var(--border-default)] bg-[var(--surface-card)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-primary)]"
                                        >
                                            {brgy}
                                        </span>
                                    ))}
                                </div>
                            </section>

                            {linkedMap && (
                                <section className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                                Linked Spatial Reference Map
                                            </p>
                                            <h3 className="mt-1 text-sm font-bold text-[var(--ink-primary)]">
                                                {linkedMap.title}
                                            </h3>
                                            <p className="mt-0.5 font-mono text-xs text-[var(--ink-secondary)]">
                                                {linkedMap.code} · {linkedMap.scale}
                                            </p>
                                        </div>
                                        <Link
                                            href={`/planning-maps?pin=${encodeURIComponent(linkedMap.id)}`}
                                            className="municipal-secondary-button shrink-0"
                                        >
                                            <span>Locate on Map</span>
                                            <ArrowUpRight size={14} aria-hidden="true" />
                                        </Link>
                                    </div>
                                </section>
                            )}

                            <button
                                type="button"
                                onClick={() => setTab('docs')}
                                className="flex w-full items-center justify-between rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-left text-xs font-bold text-[var(--ink-primary)] transition-colors hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                            >
                                <span className="flex items-center gap-2">
                                    <Paperclip size={14} aria-hidden="true" className="text-[var(--brand-ink)]" />
                                    <span>View attached supporting documents ({visibleDocCount})</span>
                                </span>
                                <ChevronRight size={14} aria-hidden="true" />
                            </button>
                        </div>
                    )}

                    {tab === 'docs' && (
                        <SupportingDocsPanel
                            parentType="ppa"
                            parentId={record.id}
                            recordOffice={record.responsibleOffice}
                            actorName={actorName}
                            attachments={recordDocs}
                            permissions={permissions}
                            onAddAttachment={onAddAttachment}
                            onRemoveAttachment={onRemoveAttachment}
                        />
                    )}
                </div>
            )}
        </Dialog>
    );
}
