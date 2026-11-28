import { Link, usePage } from '@inertiajs/react';
import { ArrowRight, Map, Plus, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DesignatedStaffDrawer from '../../components/maps/DesignatedStaffDrawer';
import PlanCard from '../../components/plans/PlanCard';
import PlanCoverageSummary from '../../components/plans/PlanCoverageSummary';
import PlanDossierModal from '../../components/plans/PlanDossierModal';
import PlanFilterBar, { type PlanFilters } from '../../components/plans/PlanFilterBar';
import PlanFormDrawer from '../../components/plans/PlanFormDrawer';
import PlanMetricGrid from '../../components/plans/PlanMetricGrid';
import PlanMilestoneQueue from '../../components/plans/PlanMilestoneQueue';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import { Button, ConfirmDialog, EmptyState, PageHeader, StatusBadge } from '../../components/ui';
import {
    loadPlanningAttachments,
    resolvePlanningPermissions,
    savePlanningAttachments,
    type PlanningAttachment,
    type PlanningModule,
} from '../../data/municipal/planningGovernance';
import {
    loadDesignatedStaff,
    loadPlanningMaps,
    saveDesignatedStaff,
    type DesignatedPlanningStaff,
} from '../../data/municipal/planningMaps';
import {
    getPlanMetrics,
    loadMunicipalPlans,
    saveMunicipalPlans,
    type MunicipalPlan,
} from '../../data/municipal/plans';
import { loadPpaRecords } from '../../data/municipal/ppas';
import AppLayout from '../../layouts/AppLayout';
import type { SharedProps } from '../../types';

const initialFilters: PlanFilters = {
    query: '',
    status: 'All',
    horizon: 'All',
    leadOffice: 'All',
};

export default function PlansIndex() {
    const { auth, workspaceExperience } = usePage<SharedProps>().props;

    const [plans, setPlans] = useState<MunicipalPlan[]>(() => loadMunicipalPlans());
    const [staff, setStaff] = useState<DesignatedPlanningStaff[]>(() => loadDesignatedStaff());
    const [attachments, setAttachments] = useState<PlanningAttachment[]>(() => loadPlanningAttachments());
    const allPpas = useMemo(() => loadPpaRecords(), []);
    const publishedMaps = useMemo(
        () => loadPlanningMaps().filter((item) => item.status === 'published'),
        [],
    );

    const [filters, setFilters] = useState<PlanFilters>(() => ({
        ...initialFilters,
        query: typeof window === 'undefined' ? '' : new URLSearchParams(window.location.search).get('search') ?? '',
    }));
    const [selectedPlanId, setSelectedPlanId] = useState<string | null>(() =>
        typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('open'),
    );
    const [formOpen, setFormOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<MunicipalPlan | null>(null);
    const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
    const [deletingPlan, setDeletingPlan] = useState<MunicipalPlan | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const permissions = useMemo(
        () => resolvePlanningPermissions('plans', auth.user, workspaceExperience, staff),
        [auth.user, workspaceExperience, staff],
    );

    useEffect(() => {
        setStatusMessage(null);
    }, [auth.user?.id, workspaceExperience]);

    const visiblePool = useMemo(() => {
        return plans.filter((plan) => {
            if (plan.status === 'Draft' || plan.status === 'Archived') {
                return permissions.canPublish || permissions.isExecutive;
            }
            return true;
        });
    }, [plans, permissions]);

    const leadOffices = useMemo(
        () => [...new Set(visiblePool.map((plan) => plan.leadOffice))].sort((a, b) => a.localeCompare(b)),
        [visiblePool],
    );

    const filteredPlans = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return visiblePool.filter((plan) => {
            const searchText = [
                plan.code,
                plan.title,
                plan.leadOffice,
                plan.documentRef,
                plan.sbResolutionNo || '',
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
    }, [visiblePool, filters]);

    const selectedPlan = visiblePool.find((plan) => plan.id === selectedPlanId) ?? null;
    const metrics = useMemo(() => getPlanMetrics(filteredPlans), [filteredPlans]);

    const ppasByPlan = useMemo(() => {
        const map: Record<string, typeof allPpas> = {};
        for (const plan of visiblePool) {
            map[plan.id] = allPpas.filter(
                (ppa) =>
                    ppa.status !== 'Archived' &&
                    (ppa.linkedPlanId === plan.id ||
                        ppa.relatedDevelopmentPlan.toLowerCase() === plan.title.toLowerCase()),
            );
        }
        return map;
    }, [visiblePool, allPpas]);

    const docCountsByPlan = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const doc of attachments) {
            if (doc.parentType !== 'plan') continue;
            const owner = visiblePool.find((p) => p.id === doc.parentId)?.leadOffice;
            if (!permissions.canViewAttachment(doc.visibility, owner)) continue;
            counts[doc.parentId] = (counts[doc.parentId] ?? 0) + 1;
        }
        return counts;
    }, [attachments, visiblePool, permissions]);

    const activePlanStaffCount = staff.filter((m) => m.active && (m.canManagePlans ?? true)).length;

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

    const persistPlans = (next: MunicipalPlan[], feedback: string) => {
        setPlans(next);
        saveMunicipalPlans(next);
        setStatusMessage(feedback);
    };

    const handleSavePlan = (record: MunicipalPlan) => {
        const exists = plans.some((item) => item.id === record.id);
        const next = exists
            ? plans.map((item) => (item.id === record.id ? record : item))
            : [record, ...plans];
        persistPlans(next, exists ? `Updated ${record.code}.` : `Added ${record.code} to the LGU Plans Library.`);
        setSelectedPlanId(record.id);
    };

    const handleArchivePlan = (plan: MunicipalPlan) => {
        const next = plans.map((item) =>
            item.id === plan.id
                ? { ...item, status: 'Archived' as const, updatedAt: new Date().toISOString().slice(0, 10) }
                : item,
        );
        persistPlans(next, `Archived ${plan.code}.`);
    };

    const handleConfirmDelete = () => {
        if (!deletingPlan) return;
        const next = plans.filter((item) => item.id !== deletingPlan.id);
        persistPlans(next, `Removed ${deletingPlan.code} from the LGU Plans Library.`);
        if (selectedPlanId === deletingPlan.id) setSelectedPlanId(null);
        setDeletingPlan(null);
    };

    const handleAddAttachment = (attachment: PlanningAttachment) => {
        const next = [attachment, ...attachments];
        setAttachments(next);
        savePlanningAttachments(next);
        setStatusMessage(`Attached “${attachment.title}” to ${attachment.parentId}.`);
    };

    const handleRemoveAttachment = (id: string) => {
        const next = attachments.filter((item) => item.id !== id);
        setAttachments(next);
        savePlanningAttachments(next);
        setStatusMessage('Removed supporting document.');
    };

    const handleToggleStaff = (id: string) => {
        const next = staff.map((member) => {
            if (member.id !== id) return member;
            const nextActive = !member.active;
            return {
                ...member,
                active: nextActive,
                canManagePlans: nextActive ? (member.canManagePlans ?? true) : false,
                canManagePpas: nextActive ? (member.canManagePpas ?? true) : false,
                canManageMaps: nextActive ? (member.canManageMaps ?? true) : false,
            };
        });
        setStaff(next);
        saveDesignatedStaff(next);
    };

    const handleToggleModuleScope = (id: string, mod: PlanningModule) => {
        const next = staff.map((member) => {
            if (member.id !== id) return member;
            const field = mod === 'plans' ? 'canManagePlans' : mod === 'ppas' ? 'canManagePpas' : 'canManageMaps';
            const nextVal = !(member.active && (member[field] ?? true));
            const updated = {
                ...member,
                canManagePlans: member.active ? (member.canManagePlans ?? true) : false,
                canManagePpas: member.active ? (member.canManagePpas ?? true) : false,
                canManageMaps: member.active ? (member.canManageMaps ?? true) : false,
                [field]: nextVal,
            };
            updated.active = Boolean(updated.canManagePlans || updated.canManagePpas || updated.canManageMaps);
            return updated;
        });
        setStaff(next);
        saveDesignatedStaff(next);
    };

    return (
        <AppLayout title="LGU Plans Library">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Municipality of Talibon · Local Development Planning Suite"
                    title="LGU Plans Library"
                    subtitle="Browse municipal development plans with SB adoption records, live linked PPAs, spatial planning maps, and official supporting documents."
                    actions={
                        <>
                            {permissions.canCreate && (
                                <Button
                                    onClick={() => {
                                        setEditingPlan(null);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    <span>Add Plan</span>
                                </Button>
                            )}
                            {permissions.canManageStaff && (
                                <Button variant="secondary" onClick={() => setStaffDrawerOpen(true)}>
                                    <Users size={16} aria-hidden="true" />
                                    <span>Designated Staff ({activePlanStaffCount})</span>
                                </Button>
                            )}
                        </>
                    }
                />

                <PortalWorkspaceNav current="developmentPlans" destinations={['developmentPlans', 'availablePlanningMaps', 'ppas']} />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <ShieldCheck size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                        <span className="font-semibold text-[var(--ink-primary)]">{permissions.accessLabel}</span>
                        <span className="hidden text-[var(--ink-secondary)] lg:inline">— {permissions.accessHint}</span>
                    </div>
                    <span className="font-mono text-xs text-[var(--ink-secondary)]">
                        <strong className="text-[var(--ink-primary)]">{filteredPlans.length}</strong> of {visiblePool.length} plans
                    </span>
                </div>

                {statusMessage && (
                    <div
                        role="status"
                        className="rounded-xl border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--status-ok-fg)]"
                    >
                        {statusMessage}
                    </div>
                )}

                {/* Compact single-row Planning Maps bridge — keeps LGU plan cards immediately visible above the fold */}
                <section
                    id="available-planning-maps"
                    tabIndex={-1}
                    aria-labelledby="available-planning-maps-title"
                    className="tcds-card flex scroll-mt-28 flex-col gap-3 border-l-4 border-l-[var(--brand-primary)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                            <Map size={19} aria-hidden="true" />
                        </div>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 id="available-planning-maps-title" className="text-sm font-bold text-[var(--ink-primary)]">
                                    Municipal Planning Maps
                                </h2>
                                <StatusBadge tone="ok">{publishedMaps.length} published plates</StatusBadge>
                            </div>
                            <p className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                Open Planning Maps for Talibon GIS layers, CLUP zoning, and DRRM cartographic plates.
                            </p>
                        </div>
                    </div>
                    <Link href="/planning-maps" className="municipal-primary-button shrink-0">
                        <span>Open Planning Maps</span>
                        <ArrowRight size={15} aria-hidden="true" />
                    </Link>
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

                {filteredPlans.length === 0 ? (
                    <EmptyState
                        icon={<Map size={24} aria-hidden="true" />}
                        title="No matching plans"
                        description="Adjust the search or clear filters to browse all municipal planning references."
                        action={
                            <Button variant="secondary" onClick={() => setFilters(initialFilters)}>
                                Clear filters
                            </Button>
                        }
                    />
                ) : (
                    <section aria-label="Plans library" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {filteredPlans.map((plan) => {
                            const linked = ppasByPlan[plan.id] ?? [];
                            const totalBudget = linked.reduce((sum, item) => sum + item.budgetTotal, 0);
                            return (
                                <PlanCard
                                    key={plan.id}
                                    plan={plan}
                                    selected={selectedPlanId === plan.id}
                                    linkedPpaCount={linked.length}
                                    linkedPpaBudget={totalBudget}
                                    docCount={docCountsByPlan[plan.id] ?? 0}
                                    onSelect={() => setSelectedPlanId(plan.id)}
                                />
                            );
                        })}
                    </section>
                )}

                <details className="group tcds-card">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold text-[var(--ink-primary)] marker:hidden">
                        <span>Planning context · filtered reference records</span>
                        <span className="text-xs font-semibold text-[var(--brand-ink)] group-open:hidden">Show</span>
                        <span className="hidden text-xs font-semibold text-[var(--brand-ink)] group-open:inline">Hide</span>
                    </summary>
                    <div className="space-y-4 border-t border-[var(--border-default)] p-4">
                        <PlanMetricGrid metrics={metrics} />
                        <PlanCoverageSummary plans={filteredPlans} />
                        <PlanMilestoneQueue plans={filteredPlans} />
                    </div>
                </details>
            </div>

            <PlanDossierModal
                plan={selectedPlan}
                linkedPpas={selectedPlan ? ppasByPlan[selectedPlan.id] ?? [] : []}
                attachments={attachments}
                permissions={permissions}
                actorName={auth.user?.name || 'MPDC Staff'}
                onClose={() => setSelectedPlanId(null)}
                onEdit={(plan) => {
                    setEditingPlan(plan);
                    setFormOpen(true);
                }}
                onArchive={handleArchivePlan}
                onDelete={(plan) => setDeletingPlan(plan)}
                onAddAttachment={handleAddAttachment}
                onRemoveAttachment={handleRemoveAttachment}
            />

            <PlanFormDrawer
                open={formOpen}
                editing={editingPlan}
                actorName={auth.user?.name || 'MPDC Staff'}
                onClose={() => {
                    setFormOpen(false);
                    setEditingPlan(null);
                }}
                onSave={handleSavePlan}
            />

            <DesignatedStaffDrawer
                open={staffDrawerOpen}
                staff={staff}
                headName={auth.user?.name || 'MPDC Department Head'}
                contextModule="plans"
                onClose={() => setStaffDrawerOpen(false)}
                onToggleStaff={handleToggleStaff}
                onToggleModuleScope={handleToggleModuleScope}
            />

            <ConfirmDialog
                open={Boolean(deletingPlan)}
                title={deletingPlan ? `Delete ${deletingPlan.code}?` : 'Delete plan?'}
                message={
                    deletingPlan
                        ? `This permanently removes “${deletingPlan.title}” from the LGU Plans Library. Consider archiving instead to preserve municipal planning history.`
                        : ''
                }
                confirmLabel="Delete plan"
                destructive
                onCancel={() => setDeletingPlan(null)}
                onConfirm={handleConfirmDelete}
            />
        </AppLayout>
    );
}
