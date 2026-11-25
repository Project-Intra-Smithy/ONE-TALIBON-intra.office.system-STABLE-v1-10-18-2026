import PpaPlanMapLinks from '../../../../../resources/js/components/ppas/PpaPlanMapLinks';
import PlanDossierPresentation from '../../../../../resources/js/components/plans/PlanDossierPresentation';
import PpaOverview from '../../../../../resources/js/components/ppas/PpaOverview';
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
    const [tab,setTab]=useState<DossierTab>('overview');
    useEffect(()=>setTab('overview'),[record?.id]);
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

    return <PlanDossierPresentation id="selected-ppa-detail" activeSection={tab} onSectionChange={section=>setTab(section as DossierTab)} key={record?.id ?? 'closed'} open={Boolean(record)} onClose={onClose} title={record?.title ?? 'PPA details'} description={record ? `${record.id} · ${record.year} · ${record.status}` : undefined} sectionLabel="PPA dossier sections" footer={<div className="flex w-full flex-wrap items-center justify-between gap-2">
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
                </div>} sections={record ? [
        {key:'overview',label:'Overview & Budget',content:<PpaOverview record={record} />},
        {key:'links',label:'Plan, Map & Location',content:<PpaPlanMapLinks plan={{title:linkedPlan ? `${linkedPlan.code} — ${linkedPlan.title}` : record.relatedDevelopmentPlan,href:linkedPlan ? `/development-plans?open=${encodeURIComponent(linkedPlan.id)}` : '/development-plans',description:linkedPlan ? `${linkedPlan.sbResolutionNo || linkedPlan.authority} · Lead: ${linkedPlan.leadOffice}` : undefined,verified:Boolean(linkedPlan)}}
            map={{title:linkedMap?.title ?? 'No spatial map linked',href:linkedMap ? `/planning-maps?pin=${encodeURIComponent(linkedMap.id)}` : '/planning-maps',verified:Boolean(linkedMap)}} barangays={record.barangays} documentCount={visibleDocCount} onDocuments={()=>setTab('docs')} />},
        {key:'docs',label:'Supporting Docs',content:(
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
                    )},
    ] : []} />;
}
