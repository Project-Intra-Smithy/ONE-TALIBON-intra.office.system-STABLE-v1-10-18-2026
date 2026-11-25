import { Link } from '@inertiajs/react';
import {
    Archive,
    ArrowUpRight,
    CheckCircle2,
    FolderKanban,
    Map,
    Pencil,
    Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
    formatPhpCompact,
    formatPhpCurrency,
    type PlanningAttachment,
    type PlanningSuitePermissions,
} from '../../data/municipal/planningGovernance';
import { DEFAULT_PLANNING_MAPS } from '../../data/municipal/planningMaps';
import type { MunicipalPlan } from '../../data/municipal/plans';
import type { PPARecord } from '../../data/municipal/ppas.types';
import { formatDatePH } from '../../lib/format';
import SupportingDocsPanel from '../planning/SupportingDocsPanel';
import { Button, Dialog, StatusBadge } from '../ui';

type PlanTab = 'profile' | 'ppas' | 'chapters' | 'docs';

type Props = {
    plan: MunicipalPlan | null;
    linkedPpas: PPARecord[];
    attachments: PlanningAttachment[];
    permissions: PlanningSuitePermissions;
    actorName: string;
    onClose: () => void;
    onEdit?: (plan: MunicipalPlan) => void;
    onArchive?: (plan: MunicipalPlan) => void;
    onDelete?: (plan: MunicipalPlan) => void;
    onAddAttachment: (attachment: PlanningAttachment) => void;
    onRemoveAttachment: (id: string) => void;
};

export default function PlanDossierModal({
    plan,
    linkedPpas,
    attachments,
    permissions,
    actorName,
    onClose,
    onEdit,
    onArchive,
    onDelete,
    onAddAttachment,
    onRemoveAttachment,
}: Props) {
    const [tab, setTab] = useState<PlanTab>('profile');

    useEffect(() => {
        setTab('profile');
    }, [plan?.id]);

    const planDocs = plan
        ? attachments.filter((doc) => doc.parentType === 'plan' && doc.parentId === plan.id)
        : [];
    const visibleDocCount = plan
        ? planDocs.filter((doc) => permissions.canViewAttachment(doc.visibility, plan.leadOffice)).length
        : 0;

    const totalLinkedBudget = linkedPpas.reduce((sum, item) => sum + item.budgetTotal, 0);
    const linkedMaps = plan?.linkedMapIds
        ? DEFAULT_PLANNING_MAPS.filter((m) => plan.linkedMapIds?.includes(m.id))
        : [];

    const pct = plan ? Math.round((plan.sectionsComplete / Math.max(1, plan.sectionsTotal)) * 100) : 0;

    return (
        <Dialog
            open={Boolean(plan)}
            onClose={onClose}
            size="xl"
            title={plan ? `${plan.code} — ${plan.title}` : 'Plan details'}
            description={
                plan
                    ? `${plan.horizon} · ${plan.coverageStart === plan.coverageEnd ? plan.coverageStart : `${plan.coverageStart}–${plan.coverageEnd}`} · Lead: ${plan.leadOffice}`
                    : undefined
            }
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                        {plan && (
                            <Link
                                href={`/ppas?plan=${encodeURIComponent(plan.id)}`}
                                className="municipal-secondary-button"
                            >
                                <FolderKanban size={14} aria-hidden="true" />
                                <span>Open Linked PPAs ({linkedPpas.length})</span>
                                <ArrowUpRight size={14} aria-hidden="true" />
                            </Link>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                        {plan && permissions.canEditRecord(plan.leadOffice, plan.status) && onEdit && (
                            <Button variant="secondary" size="sm" onClick={() => onEdit(plan)}>
                                <Pencil size={13} aria-hidden="true" />
                                <span>Edit Plan</span>
                            </Button>
                        )}
                        {plan && permissions.canArchive && onArchive && plan.status !== 'Archived' && (
                            <Button variant="secondary" size="sm" onClick={() => onArchive(plan)}>
                                <Archive size={13} aria-hidden="true" />
                                <span>Archive</span>
                            </Button>
                        )}
                        {plan && permissions.canDelete && onDelete && (
                            <button
                                type="button"
                                onClick={() => onDelete(plan)}
                                aria-label={`Delete ${plan.code}`}
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
            {plan && (
                <div id="selected-plan-details" className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge
                            tone={
                                plan.status === 'In force' || plan.status === 'Adopted'
                                    ? 'ok'
                                    : plan.status === 'For review' || plan.status === 'Updating' || plan.status === 'Due this year'
                                      ? 'warn'
                                      : 'neutral'
                            }
                        >
                            {plan.status}
                        </StatusBadge>
                        {plan.sbResolutionNo && (
                            <StatusBadge tone="info">{plan.sbResolutionNo}</StatusBadge>
                        )}
                        <StatusBadge tone="neutral">
                            {plan.sectionsComplete}/{plan.sectionsTotal} chapters ({pct}%)
                        </StatusBadge>
                        <StatusBadge tone="neutral">
                            {linkedPpas.length} linked PPAs · {formatPhpCompact(totalLinkedBudget)}
                        </StatusBadge>
                    </div>

                    <div
                        role="tablist"
                        aria-label="Development plan dossier sections"
                        className="grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-recessed)] p-1 sm:grid-cols-4"
                    >
                        {([
                            ['profile', 'Profile & Adoption'],
                            ['ppas', `Linked PPAs (${linkedPpas.length})`],
                            ['chapters', `Chapters & Maps (${linkedMaps.length})`],
                            ['docs', `Supporting Docs (${visibleDocCount})`],
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

                    {tab === 'profile' && (
                        <dl className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                            {[
                                ['Document Control Ref.', plan.documentRef],
                                ['SB Adoption Resolution', plan.sbResolutionNo ? `${plan.sbResolutionNo}${plan.sbAdoptedDate ? ` (${formatDatePH(plan.sbAdoptedDate)})` : ''}` : 'Not yet adopted / pending'],
                                ['MDC Endorsement', plan.mdcResolutionNo || 'Recorded in planning docket'],
                                ['Higher-LGU Concurrence', plan.higherReviewRef || plan.authority],
                                ['Lead Office', plan.leadOffice],
                                ['Coordinating Offices', plan.coordinatingOffices.join('; ') || '—'],
                                ['Last Action', `${plan.lastAction} (${formatDatePH(plan.lastActionDate)})`],
                                ['Next Milestone', `${plan.nextMilestone} (${formatDatePH(plan.nextMilestoneDate)})`],
                                ['Required Next Action', plan.requiredAction],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5"
                                >
                                    <dt className="text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                        {label}
                                    </dt>
                                    <dd className="mt-1.5 text-xs font-semibold leading-5 text-[var(--ink-primary)]">
                                        {value}
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    {tab === 'ppas' && (
                        <div className="space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-3 text-xs">
                                <span className="font-semibold text-[var(--ink-primary)]">
                                    <strong>{linkedPpas.length}</strong> PPAs aligned with <strong>{plan.code}</strong>
                                </span>
                                <span className="font-mono font-bold text-[var(--brand-ink)]">
                                    Indicative Rollup: {formatPhpCurrency(totalLinkedBudget)}
                                </span>
                            </div>

                            {linkedPpas.length === 0 ? (
                                <div className="rounded-xl border border-dashed border-[var(--border-control)] bg-[var(--surface-recessed)] p-6 text-center text-xs text-[var(--ink-secondary)]">
                                    No PPA entries are currently linked to {plan.code}. Add or link PPAs from the PPA Register.
                                </div>
                            ) : (
                                <ul className="divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)]">
                                    {linkedPpas.slice(0, 12).map((ppa) => (
                                        <li
                                            key={ppa.id}
                                            className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-[var(--brand-ink)]">
                                                    <span className="font-bold">{ppa.id}</span>
                                                    <span className="text-[var(--ink-secondary)]">· {ppa.aipRefCode}</span>
                                                </div>
                                                <p className="mt-0.5 text-sm font-bold text-[var(--ink-primary)]">
                                                    {ppa.title}
                                                </p>
                                                <p className="text-xs text-[var(--ink-secondary)]">
                                                    {ppa.responsibleOffice} · {ppa.fundingSource} · FY {ppa.year}
                                                </p>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2.5">
                                                <span className="font-mono text-xs font-bold tabular-nums text-[var(--ink-primary)]">
                                                    {formatPhpCompact(ppa.budgetTotal)}
                                                </span>
                                                <Link
                                                    href={`/ppas?open=${encodeURIComponent(ppa.id)}`}
                                                    className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-[var(--border-control)] bg-[var(--surface-card)] px-2.5 text-xs font-semibold text-[var(--ink-primary)] hover:border-[var(--brand-primary)] hover:bg-[var(--brand-soft)]"
                                                >
                                                    <span>View PPA</span>
                                                    <ArrowUpRight size={13} aria-hidden="true" />
                                                </Link>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}

                            {linkedPpas.length > 12 && (
                                <div className="flex justify-end">
                                    <Link
                                        href={`/ppas?plan=${encodeURIComponent(plan.id)}`}
                                        className="municipal-primary-button"
                                    >
                                        <span>View all {linkedPpas.length} PPAs in Register</span>
                                        <ArrowUpRight size={14} aria-hidden="true" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {tab === 'chapters' && (
                        <div className="grid gap-4 lg:grid-cols-2">
                            <section className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <div className="flex items-center justify-between gap-2">
                                    <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                        Chapter &amp; Section Completion
                                    </h3>
                                    <span className="font-mono text-xs font-bold text-[var(--ink-primary)]">
                                        {plan.sectionsComplete} / {plan.sectionsTotal} ({pct}%)
                                    </span>
                                </div>
                                <div className="h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-card)]">
                                    <div
                                        className="h-full rounded-full bg-[var(--brand-primary)] transition-[width]"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                {plan.chapterNotes && plan.chapterNotes.length > 0 ? (
                                    <ul className="space-y-2 pt-1">
                                        {plan.chapterNotes.map((note) => (
                                            <li key={note} className="flex items-start gap-2 text-xs leading-5 text-[var(--ink-primary)]">
                                                <CheckCircle2 size={14} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand-ink)]" />
                                                <span>{note}</span>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-xs leading-5 text-[var(--ink-secondary)]">
                                        Sectoral chapters tracked under document reference <span className="font-mono">{plan.documentRef}</span>.
                                    </p>
                                )}
                            </section>

                            <section className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4">
                                <h3 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                                    <Map size={14} aria-hidden="true" />
                                    <span>Linked Spatial Planning Maps ({linkedMaps.length})</span>
                                </h3>
                                {linkedMaps.length === 0 ? (
                                    <p className="text-xs text-[var(--ink-secondary)]">
                                        No spatial map plates are linked yet. Edit this plan to associate Talibon GIS plates.
                                    </p>
                                ) : (
                                    <ul className="space-y-2">
                                        {linkedMaps.map((map) => (
                                            <li
                                                key={map.id}
                                                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] p-3"
                                            >
                                                <div className="min-w-0">
                                                    <p className="font-mono text-xs font-bold text-[var(--brand-ink)]">{map.code}</p>
                                                    <p className="truncate text-xs font-bold text-[var(--ink-primary)]">{map.title}</p>
                                                    <p className="text-xs text-[var(--ink-secondary)]">{map.scale} · {map.effectivePeriod}</p>
                                                </div>
                                                <Link
                                                    href={`/planning-maps?pin=${encodeURIComponent(map.id)}`}
                                                    className="municipal-secondary-button shrink-0"
                                                >
                                                    <span>Open Map</span>
                                                    <ArrowUpRight size={14} aria-hidden="true" />
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </section>
                        </div>
                    )}

                    {tab === 'docs' && (
                        <SupportingDocsPanel
                            parentType="plan"
                            parentId={plan.id}
                            recordOffice={plan.leadOffice}
                            actorName={actorName}
                            attachments={planDocs}
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
