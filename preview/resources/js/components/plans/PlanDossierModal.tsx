import PlanLinkedPpas from '../../../../../resources/js/components/plans/PlanLinkedPpas';
import PlanProfile from '../../../../../resources/js/components/plans/PlanProfile';
import PlanChaptersMaps from '../../../../../resources/js/components/plans/PlanChaptersMaps';
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
import PlanDossierPresentation from '../../../../../resources/js/components/plans/PlanDossierPresentation';
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

    return <PlanDossierPresentation id="selected-plan-details" key={plan?.id ?? 'closed'} open={Boolean(plan)} onClose={onClose} title={plan ? `${plan.code} — ${plan.title}` : 'Plan details'} description={plan ? `${plan.horizon} · Lead: ${plan.leadOffice}` : undefined} footer={<div className="flex w-full flex-wrap items-center justify-between gap-2">
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
                </div>} sections={plan ? [
        {key:'profile', label:'Profile & Adoption', content:<PlanProfile plan={plan} /> },
        {key:'ppas', label:'Linked PPAs', content:<PlanLinkedPpas planCode={plan.code} records={linkedPpas.map(ppa=>({id:ppa.id,title:ppa.title,office:ppa.responsibleOffice,budget:ppa.budgetTotal,href:`/ppas?ppa=${encodeURIComponent(ppa.id)}`}))} registerHref={`/ppas?plan=${encodeURIComponent(plan.id)}`} /> },
        {key:'chapters', label:'Chapters & Maps', content:<PlanChaptersMaps plan={plan} linkedMaps={linkedMaps.map(map=>({...map,href:`/planning-maps?pin=${encodeURIComponent(map.id)}`}))} /> },
        {key:'docs', label:'Supporting Docs', content:(
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
                    ) }
    ] : []} />;
}
