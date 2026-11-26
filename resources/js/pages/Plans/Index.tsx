import PlanningDeleteAction from '../../components/planning/PlanningDeleteAction';
import PlanLinkedPpas from '../../components/plans/PlanLinkedPpas';
import PlanProfile from '../../components/plans/PlanProfile';
import PlanChaptersMaps from '../../components/plans/PlanChaptersMaps';
import { Link, router } from '@inertiajs/react';
import { ClipboardList, Map, Plus, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import DesignatedStaffModal, {
    type DesignatedStaffMember,
    type MpdoStaffCandidate,
} from '../../components/planning/DesignatedStaffModal';
import SupportingDocsPanel, {
    type ServerPlanningAttachment,
} from '../../components/planning/SupportingDocsPanel';
import PlanDossierPresentation from '../../components/plans/PlanDossierPresentation';
import PlanCard from '../../components/plans/PlanCard';
import PlanCoverageSummary from '../../components/plans/PlanCoverageSummary';
import PlanFilterBar, { type PlanFilters } from '../../components/plans/PlanFilterBar';
import PlanMetricGrid from '../../components/plans/PlanMetricGrid';
import PlanMilestoneQueue from '../../components/plans/PlanMilestoneQueue';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import PlanStudioView from '../../components/plans/PlanStudioView';
import Button from '../../components/ui/Button';
import {
    getPlanMetrics,
    type MunicipalPlan,
} from '../../data/municipal/plans';
import AppLayout from '../../layouts/AppLayout';

export type ServerPlanRecord = Omit<MunicipalPlan,'status'> & {
    status: string;
    dbId?: number;
    provenanceStatus?: string;
};

export type PlanningPermissions = {
    isMpdcHead: boolean;
    isDesignatedStaff: boolean;
    isImplementingOfficeHead: boolean;
    canManagePlans: boolean;
    canManagePpas: boolean;
    canManageMaps: boolean;
    canProposeOfficePpa: boolean;
    canPublishOrArchive: boolean;
    canDelete: boolean;
    canDesignateStaff: boolean;
    canUploadAttachments: boolean;
    canViewExecutiveAttachments: boolean;
    actorDepartmentId: number | null;
    actorDepartmentCode: string | null;
    actorDepartmentName: string | null;
};

type Props = {
    plans?: ServerPlanRecord[];
    attachments?: ServerPlanningAttachment[];
    planningPermissions?: PlanningPermissions;
    designatedStaff?: DesignatedStaffMember[];
    mpdoStaffPool?: MpdoStaffCandidate[];
};

const initialFilters: PlanFilters = {
    query: '',
    status: 'All',
    horizon: 'All',
    leadOffice: 'All',
};

export default function PlansIndex({
    plans: serverPlans,
    attachments = [],
    planningPermissions,
    designatedStaff = [],
    mpdoStaffPool = [],
}: Props) {
    const municipalPlans: ServerPlanRecord[] =
        serverPlans ?? [];
    const [filters, setFilters] = useState<PlanFilters>(() => ({
        ...initialFilters,
        query:
            typeof window === 'undefined'
                ? ''
                : new URLSearchParams(window.location.search).get('search') ?? '',
    }));
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingPlan,setEditingPlan]=useState<ServerPlanRecord|null>(null);
    const [showStaffModal, setShowStaffModal] = useState(() => Boolean(planningPermissions?.canDesignateStaff && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('staff') === '1'));
    const [createCode, setCreateCode] = useState('');
    const [createTitle, setCreateTitle] = useState('');
    const [createHorizon, setCreateHorizon] = useState('Six-year');
    const [createLeadOffice, setCreateLeadOffice] = useState(
        planningPermissions?.actorDepartmentName ?? 'Municipal Planning and Development Office',
    );
    const [createStart, setCreateStart] = useState('2026');
    const [createEnd, setCreateEnd] = useState('2031');
    const [createStatus, setCreateStatus] = useState('For review');
    const [createAuthority, setCreateAuthority] = useState('');
    const [createRequiredAction, setCreateRequiredAction] = useState('');
    const [busy, setBusy] = useState(false);
    const [submissionError,setSubmissionError]=useState('');
    const [recordFields, setRecordFields] = useState<Record<string, string>>({});


    const leadOffices = useMemo(
        () =>
            [...new Set(municipalPlans.map((plan) => plan.leadOffice))].sort((a, b) =>
                a.localeCompare(b),
            ),
        [municipalPlans],
    );

    const filteredPlans = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return municipalPlans.filter((plan) => {
            const searchText = [
                plan.code,
                plan.title,
                plan.leadOffice,
                plan.documentRef,
                ...plan.coordinatingOffices,
            ]
                .join(' ')
                .toLowerCase();
            return (
                (!query || searchText.includes(query)) &&
                (filters.status === 'All' || plan.status === filters.status) &&
                (filters.horizon === 'All' || plan.horizon === filters.horizon) &&
                (filters.leadOffice === 'All' || plan.leadOffice === filters.leadOffice)
            );
        });
    }, [municipalPlans, filters]);

    const selectedPlan = filteredPlans.find((plan) => plan.id === selectedPlanId);
    const metrics = useMemo(() => getPlanMetrics(filteredPlans), [filteredPlans]);

    const closePlanDetails = () => {
        const planId = selectedPlanId;
        setSelectedPlanId(null);
        if (planId && typeof window !== 'undefined') {
            window.requestAnimationFrame(() => document.getElementById(`plan-trigger-${planId}`)?.focus());
        }
    };

    const openPlanStudio = (plan: ServerPlanRecord | null) => {
        setEditingPlan(plan); setSubmissionError('');
        setCreateCode(plan?.code ?? ''); setCreateTitle(plan?.title ?? '');
        setCreateHorizon(plan?.horizon ?? 'Six-year'); setCreateLeadOffice(plan?.leadOffice ?? planningPermissions?.actorDepartmentName ?? '');
        setCreateStart(String(plan?.coverageStart ?? 2026)); setCreateEnd(String(plan?.coverageEnd ?? 2031));
        setCreateStatus(plan?.status ?? 'For review'); setCreateAuthority(plan?.authority ?? ''); setCreateRequiredAction(plan?.requiredAction ?? '');
        setRecordFields(plan ? {coordinating_offices:plan.coordinatingOffices.join(', '),document_ref:plan.documentRef,sections_complete:String(plan.sectionsComplete),sections_total:String(plan.sectionsTotal),next_milestone:plan.nextMilestone,next_milestone_date:plan.nextMilestoneDate} : {});
        setSelectedPlanId(null); setShowCreateModal(true);
    };

    const handleCreatePlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!createCode.trim() || !createTitle.trim() || busy) return;
        setSubmissionError('');
        setBusy(true);
        const data = {
                code: createCode.trim(),
                title: createTitle.trim(),
                horizon: createHorizon,
                lead_office: createLeadOffice.trim(),
                coverage_start: Number(createStart),
                coverage_end: Number(createEnd),
                status: createStatus,
                authority: createAuthority.trim() || undefined,
                required_action: createRequiredAction.trim() || undefined,
                document_ref: recordFields.document_ref || undefined,
                coordinating_offices: recordFields.coordinating_offices?.split(',').map(value => value.trim()).filter(Boolean),
                sections_complete: recordFields.sections_complete ? Number(recordFields.sections_complete) : undefined,
                sections_total: recordFields.sections_total ? Number(recordFields.sections_total) : undefined,
                next_milestone: recordFields.next_milestone || undefined,
                next_milestone_date: recordFields.next_milestone_date || undefined,
            };
        const options = {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateCode('');
                    setCreateTitle('');
                    setCreateAuthority('');
                    setCreateRequiredAction('');
                    setShowCreateModal(false);
                },
                onError: (errors:Record<string,string>)=>setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
            };
        if(editingPlan?.dbId) router.put(`/development-plans/${editingPlan.dbId}`,data,options);
        else router.post('/development-plans',data,options);
    };

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const focusPlanningMaps = () => {
            if (window.location.hash !== '#available-planning-maps') return;
            window.requestAnimationFrame(() => {
                const section = document.getElementById('available-planning-maps');
                section?.focus({ preventScroll: true });
                section?.scrollIntoView({ block: 'start' });
            });
        };

        focusPlanningMaps();
        window.addEventListener('hashchange', focusPlanningMaps);
        return () => window.removeEventListener('hashchange', focusPlanningMaps);
    }, []);


    return (
        <AppLayout title="LGU Plans Library">
            <PageFrame width="wide" density="compact" className="civic-page ot-r6-modules ot-r6-plans r8-plans">
                <PageHeader
                    eyebrow="Municipality of Talibon · Planning references"
                    title="LGU Plans Library"
                    description="Browse planning references by code, coverage, status, and lead office."
                    icon={ClipboardList}
                    aside={
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href="/planning-maps"
                                className="municipal-action inline-flex min-h-9 items-center gap-1.5 px-3 text-xs font-semibold"
                            >
                                <Map size={14} aria-hidden="true" /> Planning Maps Atlas
                            </Link>
                            {planningPermissions?.canDesignateStaff && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    icon={<ShieldCheck className="h-3.5 w-3.5" />}
                                    onClick={() => setShowStaffModal(true)}
                                >
                                    Staff Scopes ({designatedStaff.length})
                                </Button>
                            )}
                            {planningPermissions?.canManagePlans && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => openPlanStudio(null)}
                                >
                                    New Plan Record
                                </Button>
                            )}
                        </div>
                    }
                />
                <PortalWorkspaceNav
                    current="developmentPlans"
                    destinations={['developmentPlans', 'availablePlanningMaps', 'ppas']}
                />
                <div className="r8-plans-notice rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-2.5 text-xs text-[var(--ink-secondary)]" role="note">
                    <strong className="text-[var(--ink-primary)]">Reference library only.</strong> Records shown here are not validated live municipal approvals. Covers are illustrative graphics, not scanned or certified documents.
                </div>
                <section
                    id="available-planning-maps"
                    tabIndex={-1}
                    className="r8-planning-maps municipal-panel tcds-card flex items-start gap-3.5 p-4"
                    aria-labelledby="available-planning-maps-title"
                >
                    <div className="r8-planning-maps-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]" aria-hidden="true">
                        <Map size={20} />
                    </div>
                    <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
                        <div className="min-w-0 space-y-1">
                            <h2 id="available-planning-maps-title" className="text-sm font-bold text-[var(--ink-primary)]">Available Planning Maps</h2>
                            <p role="status" className="text-xs font-medium text-[var(--ink-primary)]">No municipality-approved planning maps have been supplied.</p>
                            <p className="text-xs text-[var(--ink-secondary)]">
                                Illustrative plan-card artwork is not an official map. Approved map previews and access links will appear here only after the municipality provides and authorizes them.
                            </p>
                        </div>
                        <Link
                            href="/planning-maps"
                            className="municipal-secondary-button shrink-0 text-xs"
                        >
                            Open Spatial Reference Atlas
                        </Link>
                    </div>
                </section>
                <PlanFilterBar
                    statuses={['All','Draft','For review','Updating','In force','Adopted','Due this year','Archived']}
                    filters={filters}
                    leadOffices={leadOffices}
                    resultCount={filteredPlans.length}
                    onChange={(nextFilters) => {
                        setFilters(nextFilters);
                        setSelectedPlanId(null);
                    }}
                />
                <section
                    aria-label="Plans library"
                    className="ot-r6-plan-grid r8-plans-grid grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3"
                >
                    {filteredPlans.map((plan) => (
                        <PlanCard
                            key={plan.id}
                            plan={plan}
                            docCount={attachments.filter(attachment=>attachment.parentType==='plan'&&attachment.parentCode===plan.code).length}
                            selected={selectedPlanId === plan.id}
                            onSelect={() => {
                                setSelectedPlanId(plan.id);
                            }}
                        />
                    ))}
                    {filteredPlans.length === 0 && (
                        <div
                            role="status"
                            className="municipal-panel border-dashed p-8 text-center text-sm text-[var(--municipal-muted)] sm:col-span-2 xl:col-span-3"
                        >
                            <strong className="block text-[var(--municipal-text)]">No matching plans</strong>
                            <span className="mt-1 block">
                                Change the search or clear the filters to see the reference library.
                            </span>
                        </div>
                    )}
                </section>
                <details className="group municipal-panel min-w-0 rounded-lg text-[var(--municipal-muted)]">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-[13px] font-semibold marker:hidden">
                        <span>Planning context · filtered reference records</span>
                        <span className="text-xs text-[var(--brand-ink)] group-open:hidden">Show</span>
                        <span className="hidden text-xs text-[var(--brand-ink)] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-3 border-t border-[var(--municipal-border)] p-3">
                        <PlanMetricGrid metrics={metrics} />
                        <PlanCoverageSummary plans={filteredPlans} />
                        <PlanMilestoneQueue plans={filteredPlans} />
                    </div>
                </details>
            </PageFrame>

            {selectedPlan && (
                <PlanDossierPresentation
                    id="selected-plan-details"
                    key={selectedPlan.id}
                    open
                    title={`${selectedPlan.code} — ${selectedPlan.title}`}
                    description="Reference data only · Not a validated live municipal approval or certified document."
                    onClose={closePlanDetails}
                    sections={[
                        { key: 'profile', label: 'Profile & Adoption', content: <PlanProfile plan={selectedPlan} /> },
                        { key: 'ppas', label: 'Linked PPAs', content: <PlanLinkedPpas planCode={selectedPlan.code} registerHref={`/ppas?search=${encodeURIComponent(selectedPlan.code)}`} /> },
                        { key: 'chapters', label: 'Chapters & Maps', content: <PlanChaptersMaps plan={selectedPlan} linkedMaps={[]} linksUnavailable /> },
                        { key: 'documents', label: 'Supporting Docs', content: <SupportingDocsPanel parentType="plan" parentCode={selectedPlan.code} attachments={attachments} canUpload={Boolean(planningPermissions?.canManagePlans)} canManageExecutive={Boolean(planningPermissions?.canViewExecutiveAttachments)} canDelete={Boolean(planningPermissions?.isMpdcHead)} /> },
                    ]}
                    footer={<div className="flex flex-wrap gap-2">{planningPermissions?.canManagePlans&&selectedPlan.dbId&&<Button variant="secondary" onClick={()=>openPlanStudio(selectedPlan)}>Edit Plan</Button>}{planningPermissions?.canDelete&&selectedPlan.dbId&&<PlanningDeleteAction title={selectedPlan.code} busy={busy} disabledReason={selectedPlan.provenanceStatus==='reference_sample'||['In force','Adopted'].includes(selectedPlan.status)?'Official and reference plans cannot be deleted.':undefined} onDelete={()=>{setBusy(true);setSubmissionError('');router.delete(`/development-plans/${selectedPlan.dbId}`,{preserveScroll:true,onSuccess:closePlanDetails,onError:errors=>setSubmissionError(Object.values(errors).join(' ')),onFinish:()=>setBusy(false)});}} />}{submissionError&&<p role="alert" className="text-xs text-[var(--status-danger-fg)]">{submissionError}</p>}<Button variant="secondary" onClick={closePlanDetails}>Close</Button></div>}
                />
            )}

            <PlanStudioView error={submissionError} open={showCreateModal} editing={editingPlan} onClose={() => setShowCreateModal(false)} busy={busy}
                values={{ code: createCode, title: createTitle, horizon: createHorizon, coverageStart: createStart, coverageEnd: createEnd, status: createStatus, leadOffice: createLeadOffice, coordinatingInput: recordFields.coordinating_offices ?? '', documentRef: recordFields.document_ref ?? '', authority: createAuthority, sbResolutionNo: '', sbAdoptedDate: '', mdcResolutionNo: '', higherReviewRef: '', sectionsComplete: recordFields.sections_complete ?? '', sectionsTotal: recordFields.sections_total ?? '', nextMilestone: recordFields.next_milestone ?? '', nextMilestoneDate: recordFields.next_milestone_date ?? '', requiredAction: createRequiredAction, linkedMapIds: [] }}
                onChange={(field, value) => {
                    if (typeof value !== 'string') return;
                    const setters: Record<string, (value: string) => void> = { code: setCreateCode, title: setCreateTitle, horizon: setCreateHorizon, coverageStart: setCreateStart, coverageEnd: setCreateEnd, status: setCreateStatus, leadOffice: setCreateLeadOffice, authority: setCreateAuthority, requiredAction: setCreateRequiredAction };
                    if (setters[field]) { setters[field](value); return; }
                    const keys: Record<string, string> = { coordinatingInput: 'coordinating_offices', documentRef: 'document_ref', sectionsComplete: 'sections_complete', sectionsTotal: 'sections_total', nextMilestone: 'next_milestone', nextMilestoneDate: 'next_milestone_date' };
                    if (keys[field]) setRecordFields(fields => ({ ...fields, [keys[field]]: value }));
                }}
                onSubmit={handleCreatePlan} maps={[]} horizons={['Annual', 'Three-year', 'Six-year', 'Long-term', 'Sectoral']}
                statuses={['Draft','For review', 'Updating', 'Due this year', ...(planningPermissions?.canPublishOrArchive ? ['Archived',...(editingPlan?.provenanceStatus==='reference_sample'?[]:['In force', 'Adopted'])] : [])]}
                unavailable={[...(editingPlan?['code' as const]:[]),...(editingPlan?.provenanceStatus==='reference_sample'?['authority' as const]:[]),'sbResolutionNo', 'sbAdoptedDate', 'mdcResolutionNo', 'higherReviewRef', 'linkedMapIds']}
            />

            <DesignatedStaffModal
                open={showStaffModal}
                onClose={() => setShowStaffModal(false)}
                designatedStaff={designatedStaff}
                mpdoStaffPool={mpdoStaffPool}
            />
        </AppLayout>
    );
}
