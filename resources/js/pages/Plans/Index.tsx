import { Link, router } from '@inertiajs/react';
import { ClipboardList, Map, Plus, ShieldCheck } from 'lucide-react';
import { type FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import DesignatedStaffModal, {
    type DesignatedStaffMember,
    type MpdoStaffCandidate,
} from '../../components/planning/DesignatedStaffModal';
import SupportingDocsPanel, {
    type ServerPlanningAttachment,
} from '../../components/planning/SupportingDocsPanel';
import PlanCard from '../../components/plans/PlanCard';
import PlanCoverageSummary from '../../components/plans/PlanCoverageSummary';
import PlanFilterBar, { type PlanFilters } from '../../components/plans/PlanFilterBar';
import PlanMetricGrid from '../../components/plans/PlanMetricGrid';
import PlanMilestoneQueue from '../../components/plans/PlanMilestoneQueue';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import {
    getPlanMetrics,
    type MunicipalPlan,
} from '../../data/municipal/plans';
import AppLayout from '../../layouts/AppLayout';

export type ServerPlanRecord = MunicipalPlan & {
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
    const [dossierSection, setDossierSection] = useState<'profile' | 'relationships' | 'documents'>('profile');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showStaffModal, setShowStaffModal] = useState(false);
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

    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

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

    const handleCreatePlan = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!createCode.trim() || !createTitle.trim() || busy) return;
        setBusy(true);
        router.post(
            '/development-plans',
            {
                code: createCode.trim(),
                title: createTitle.trim(),
                horizon: createHorizon,
                lead_office: createLeadOffice.trim(),
                coverage_start: Number(createStart),
                coverage_end: Number(createEnd),
                status: createStatus,
                authority: createAuthority.trim() || undefined,
                required_action: createRequiredAction.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCreateCode('');
                    setCreateTitle('');
                    setCreateAuthority('');
                    setCreateRequiredAction('');
                    setShowCreateModal(false);
                },
                onFinish: () => setBusy(false),
            },
        );
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

    useEffect(() => {
        if (!selectedPlanId || typeof document === 'undefined') return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        closeButtonRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                const planId = selectedPlanId;
                setSelectedPlanId(null);
                window.requestAnimationFrame(() => document.getElementById(`plan-trigger-${planId}`)?.focus());
                return;
            }
            if (event.key !== 'Tab' || !dialogRef.current) return;
            const focusable = Array.from(
                dialogRef.current.querySelectorAll<HTMLElement>(
                    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
                ),
            );
            if (focusable.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [selectedPlanId]);

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
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    New Plan Record
                                </Button>
                            )}
                        </div>
                    }
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
                            selected={selectedPlanId === plan.id}
                            onSelect={() => {
                                setDossierSection('profile');
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
                        <span className="text-xs text-[var(--municipal-brand)] group-open:hidden">Show</span>
                        <span className="hidden text-xs text-[var(--municipal-brand)] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-3 border-t border-[var(--municipal-border)] p-3">
                        <PlanMetricGrid metrics={metrics} />
                        <PlanCoverageSummary plans={filteredPlans} />
                        <PlanMilestoneQueue plans={filteredPlans} />
                    </div>
                </details>
            </PageFrame>

            {selectedPlan && (
                <div
                    className="r8-plans-dialog-backdrop fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/45 p-3 sm:p-5"
                    onMouseDown={(event) => {
                        if (event.currentTarget === event.target) closePlanDetails();
                    }}
                >
                    <div
                        id="selected-plan-details"
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="selected-plan-title"
                        aria-describedby="selected-plan-description"
                        tabIndex={-1}
                        className="municipal-panel ot-r6-plan-dialog r8-plans-dialog max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl overflow-y-auto rounded-[var(--municipal-radius-overlay)] border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] shadow-2xl sm:max-h-[calc(100vh-2.5rem)]"
                    >
                        <header className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 py-2.5 sm:px-4">
                            <div className="min-w-0">
                                <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--municipal-brand)]">
                                    {selectedPlan.code}
                                </p>
                                <h2
                                    id="selected-plan-title"
                                    className="mt-0.5 break-words text-base font-bold leading-6 text-[var(--municipal-text)]"
                                >
                                    {selectedPlan.title}
                                </h2>
                                <p
                                    id="selected-plan-description"
                                    className="mt-0.5 text-[11px] text-[var(--municipal-muted)]"
                                >
                                    Reference data only · Not a validated live municipal approval or certified document.
                                </p>
                            </div>
                            <button
                                ref={closeButtonRef}
                                type="button"
                                onClick={closePlanDetails}
                                className="min-h-11 shrink-0 rounded-md px-3 text-xs font-semibold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                                aria-label={`Close details for ${selectedPlan.code}`}
                            >
                                Close
                            </button>
                        </header>

                        <div className="p-3 sm:p-4">
                            <div role="group" aria-label="Dossier sections" className="mb-4 flex flex-wrap gap-2">
                                {([['profile', 'Plan profile'], ['relationships', 'Linked planning work'], ['documents', 'Supporting documents']] as const).map(([section, label]) => (
                                    <Button key={section} variant={dossierSection === section ? 'primary' : 'secondary'} aria-pressed={dossierSection === section} onClick={() => setDossierSection(section)}>
                                        {label}
                                    </Button>
                                ))}
                            </div>
                            {dossierSection === 'profile' && (
                                <dl className="grid gap-x-5 gap-y-2.5 text-[13px] leading-5 sm:grid-cols-2">
                                    {[
                                        ['Planning horizon', selectedPlan.horizon],
                                        ['Lead office', selectedPlan.leadOffice],
                                        [
                                            'Coverage',
                                            selectedPlan.coverageStart === selectedPlan.coverageEnd
                                                ? String(selectedPlan.coverageStart)
                                                : `${selectedPlan.coverageStart} - ${selectedPlan.coverageEnd}`,
                                        ],
                                        ['Recorded status', selectedPlan.status],
                                        ['Document reference', selectedPlan.documentRef],
                                        ['Authority / adoption', selectedPlan.authority],
                                        [
                                            'Next milestone',
                                            `${selectedPlan.nextMilestone} / ${selectedPlan.nextMilestoneDate}`,
                                        ],
                                        ['Required action', selectedPlan.requiredAction],
                                        ['Coordinating offices', selectedPlan.coordinatingOffices.join('; ')],
                                        ['Last action', `${selectedPlan.lastAction} / ${selectedPlan.lastActionDate}`],
                                        [
                                            'Record completion',
                                            `${selectedPlan.sectionsComplete} of ${selectedPlan.sectionsTotal} sections`,
                                        ],
                                    ].map(([label, value]) => (
                                        <div key={label} className="min-w-0">
                                            <dt className="text-[11px] font-semibold text-[var(--municipal-text)]">
                                                {label}
                                            </dt>
                                            <dd className="break-words text-[var(--municipal-muted)]">{value}</dd>
                                        </div>
                                    ))}
                                </dl>
                            )}

                            {dossierSection === 'relationships' && (
                                <nav aria-label="Related planning workspaces" className="my-4 flex flex-wrap gap-2">
                                    <Link className="municipal-secondary-button" href={`/ppas?search=${encodeURIComponent(selectedPlan.code)}`}>Related PPAs</Link>
                                    <Link className="municipal-secondary-button" href={`/planning-maps?search=${encodeURIComponent(selectedPlan.code)}`}>Related map plates</Link>
                                </nav>
                            )}

                            {dossierSection === 'documents' && (
                                <SupportingDocsPanel
                                    parentType="plan"
                                    parentCode={selectedPlan.code}
                                    attachments={attachments}
                                    canUpload={Boolean(planningPermissions?.canManagePlans)}
                                    canManageExecutive={Boolean(
                                        planningPermissions?.canViewExecutiveAttachments,
                                    )}
                                    canDelete={Boolean(planningPermissions?.isMpdcHead)}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            <Dialog
                variant="drawer-right"
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title="Register Development Plan Record"
                description="Create a provisional development plan entry in the MPDC library."
                size="lg"
            >
                <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Plan Code
                            <input
                                type="text"
                                required
                                maxLength={100}
                                value={createCode}
                                onChange={(e) => setCreateCode(e.target.value)}
                                placeholder="e.g., FLUP 2026–2035"
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Horizon
                            <select
                                value={createHorizon}
                                onChange={(e) => setCreateHorizon(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                {['Annual', 'Three-year', 'Six-year', 'Long-term', 'Sectoral'].map(
                                    (h) => (
                                        <option key={h} value={h}>
                                            {h}
                                        </option>
                                    ),
                                )}
                            </select>
                        </label>
                    </div>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Full Plan Title
                        <input
                            type="text"
                            required
                            maxLength={255}
                            value={createTitle}
                            onChange={(e) => setCreateTitle(e.target.value)}
                            placeholder="e.g., Forest Land Use Plan"
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Coverage Start
                            <input
                                type="number"
                                min={2000}
                                max={2100}
                                required
                                value={createStart}
                                onChange={(e) => setCreateStart(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Coverage End
                            <input
                                type="number"
                                min={2000}
                                max={2100}
                                required
                                value={createEnd}
                                onChange={(e) => setCreateEnd(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Initial Status
                            <select
                                value={createStatus}
                                onChange={(e) => setCreateStatus(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                <option value="For review">For review</option>
                                <option value="Updating">Updating</option>
                                <option value="Due this year">Due this year</option>
                                {planningPermissions?.canPublishOrArchive && (
                                    <>
                                        <option value="In force">In force</option>
                                        <option value="Adopted">Adopted</option>
                                    </>
                                )}
                            </select>
                        </label>
                    </div>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Lead Office
                        <input
                            type="text"
                            required
                            maxLength={255}
                            value={createLeadOffice}
                            onChange={(e) => setCreateLeadOffice(e.target.value)}
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Authority / Adoption Reference
                        <input
                            type="text"
                            maxLength={255}
                            value={createAuthority}
                            onChange={(e) => setCreateAuthority(e.target.value)}
                            placeholder="e.g., Provisional working draft / SB Resolution reference"
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Required Action / Review Note
                        <textarea
                            rows={2}
                            maxLength={2000}
                            value={createRequiredAction}
                            onChange={(e) => setCreateRequiredAction(e.target.value)}
                            className="mt-1 block w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] p-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" size="sm" loading={busy}>
                            Save Development Plan
                        </Button>
                    </div>
                </form>
            </Dialog>

            <DesignatedStaffModal
                open={showStaffModal}
                onClose={() => setShowStaffModal(false)}
                designatedStaff={designatedStaff}
                mpdoStaffPool={mpdoStaffPool}
            />
        </AppLayout>
    );
}
