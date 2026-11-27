import { usePage } from '@inertiajs/react';
import { Download, Plus, ShieldCheck, Users } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import DesignatedStaffDrawer from '../../components/maps/DesignatedStaffDrawer';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import PPADetailPanel from '../../components/ppas/PPADetailPanel';
import PPAFilters from '../../components/ppas/PPAFilters';
import PPAFormDrawer from '../../components/ppas/PPAFormDrawer';
import PPARegister from '../../components/ppas/PPARegister';
import PPASummary from '../../components/ppas/PPASummary';
import { Button, ConfirmDialog, PageHeader } from '../../components/ui';
import {
    formatPhpCompact,
    loadPlanningAttachments,
    resolvePlanningPermissions,
    savePlanningAttachments,
    type PlanningAttachment,
    type PlanningModule,
} from '../../data/municipal/planningGovernance';
import {
    loadDesignatedStaff,
    saveDesignatedStaff,
    type DesignatedPlanningStaff,
} from '../../data/municipal/planningMaps';
import { loadMunicipalPlans } from '../../data/municipal/plans';
import { exportPpasToCsv, loadPpaRecords, savePpaRecords } from '../../data/municipal/ppas';
import type { PPAFilters as FilterState, PPARecord } from '../../data/municipal/ppas.types';
import AppLayout from '../../layouts/AppLayout';
import type { SharedProps } from '../../types';

const initialFilters: FilterState = { query: '', sector: '', office: '', year: '', plan: '', fundingSource: '', status: '' };

export default function Index() {
    const { auth, workspaceExperience } = usePage<SharedProps>().props;
    const plans = useMemo(() => loadMunicipalPlans(), []);

    const [allRecords, setAllRecords] = useState<PPARecord[]>(() => loadPpaRecords());
    const [staff, setStaff] = useState<DesignatedPlanningStaff[]>(() => loadDesignatedStaff());
    const [attachments, setAttachments] = useState<PlanningAttachment[]>(() => loadPlanningAttachments());
    const [filters, setFilters] = useState<FilterState>(() => {
        if (typeof window === 'undefined') return initialFilters;
        const params = new URLSearchParams(window.location.search);
        return {
            ...initialFilters,
            query: params.get('search') ?? '',
            plan: params.get('plan') ?? '',
            office: params.get('office') ?? '',
        };
    });
    const [selectedId, setSelectedId] = useState<string | null>(() =>
        typeof window === 'undefined' ? null : new URLSearchParams(window.location.search).get('open'),
    );
    const [formOpen, setFormOpen] = useState(false);
    const [editingRecord, setEditingRecord] = useState<PPARecord | null>(null);
    const [staffDrawerOpen, setStaffDrawerOpen] = useState(false);
    const [deletingRecord, setDeletingRecord] = useState<PPARecord | null>(null);
    const [statusMessage, setStatusMessage] = useState<string | null>(null);

    const permissions = useMemo(
        () => resolvePlanningPermissions('ppas', auth.user, workspaceExperience, staff),
        [auth.user, workspaceExperience, staff],
    );

    useEffect(() => {
        setStatusMessage(null);
    }, [auth.user?.id, workspaceExperience]);

    const visiblePool = useMemo(() => {
        return allRecords.filter((record) => {
            if (record.status === 'Draft' || record.status === 'For MPDC Review' || record.status === 'Archived') {
                if (permissions.canPublish || permissions.isExecutive) return true;
                if (
                    permissions.canProposeOfficeDraft &&
                    record.responsibleOffice.toLowerCase() === permissions.actorOfficeName.toLowerCase()
                ) {
                    return true;
                }
                return false;
            }
            return true;
        });
    }, [allRecords, permissions]);

    const records = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return visiblePool.filter((record) => {
            const searchable = [
                record.title,
                record.aipRefCode,
                record.sector,
                record.responsibleOffice,
                record.relatedDevelopmentPlan,
                record.fundingSource,
                record.expectedOutputs,
                record.id,
            ]
                .join(' ')
                .toLowerCase();
            return (
                (!query || searchable.includes(query)) &&
                (!filters.sector || record.sector === filters.sector) &&
                (!filters.office || record.responsibleOffice === filters.office) &&
                (!filters.year || String(record.year) === filters.year) &&
                (!filters.plan ||
                    record.relatedDevelopmentPlan === filters.plan ||
                    record.linkedPlanId === filters.plan) &&
                (!filters.fundingSource || record.fundingSource === filters.fundingSource) &&
                (!filters.status || record.status === filters.status)
            );
        });
    }, [visiblePool, filters]);

    const selected = useMemo(
        () => visiblePool.find((item) => item.id === selectedId) ?? null,
        [visiblePool, selectedId],
    );

    const docCountsByPpa = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const doc of attachments) {
            if (doc.parentType !== 'ppa') continue;
            const owner = allRecords.find((r) => r.id === doc.parentId)?.responsibleOffice;
            if (!permissions.canViewAttachment(doc.visibility, owner)) continue;
            counts[doc.parentId] = (counts[doc.parentId] ?? 0) + 1;
        }
        return counts;
    }, [attachments, allRecords, permissions]);

    const totalFilteredBudget = useMemo(
        () => records.reduce((sum, item) => sum + item.budgetTotal, 0),
        [records],
    );

    const activePpaStaffCount = staff.filter((m) => m.active && (m.canManagePpas ?? true)).length;

    const persistRecords = (next: PPARecord[], feedback: string) => {
        setAllRecords(next);
        savePpaRecords(next);
        setStatusMessage(feedback);
    };

    const handleSavePpa = (record: PPARecord) => {
        const exists = allRecords.some((item) => item.id === record.id);
        const next = exists
            ? allRecords.map((item) => (item.id === record.id ? record : item))
            : [record, ...allRecords];
        persistRecords(next, exists ? `Updated ${record.id} (${record.title}).` : `Added ${record.id} to the PPA register.`);
        setSelectedId(record.id);
    };

    const handleArchivePpa = (record: PPARecord) => {
        const next = allRecords.map((item) =>
            item.id === record.id
                ? { ...item, status: 'Archived' as const, updatedAt: new Date().toISOString().slice(0, 10), updatedBy: auth.user?.name || 'MPDC Editor' }
                : item,
        );
        persistRecords(next, `Archived ${record.id}.`);
    };

    const handleConfirmDelete = () => {
        if (!deletingRecord) return;
        const next = allRecords.filter((item) => item.id !== deletingRecord.id);
        persistRecords(next, `Removed ${deletingRecord.id} from the PPA register.`);
        if (selectedId === deletingRecord.id) setSelectedId(null);
        setDeletingRecord(null);
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

    const handleExportCsv = () => {
        if (typeof window === 'undefined') return;
        const csv = exportPpasToCsv(records);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Talibon_AIP_PPAs_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        setStatusMessage(`Exported ${records.length} PPA records in DILG-DBM AIP CSV format.`);
    };

    return (
        <AppLayout title="Programs, Projects and Activities">
            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6">
                <PageHeader
                    eyebrow="Planning and implementation register · DILG-NEDA-DBM AIP Format"
                    title="Programs, Projects and Activities"
                    subtitle="Municipal PPA reference register across sectors, offices, indicative budgets, parent development plans, and supporting documents."
                    actions={
                        <>
                            {(permissions.canCreate || permissions.canProposeOfficeDraft) && (
                                <Button
                                    onClick={() => {
                                        setEditingRecord(null);
                                        setFormOpen(true);
                                    }}
                                >
                                    <Plus size={16} aria-hidden="true" />
                                    <span>{permissions.canCreate ? 'Add PPA' : 'Propose Office PPA'}</span>
                                </Button>
                            )}
                            {permissions.canManageStaff && (
                                <Button variant="secondary" onClick={() => setStaffDrawerOpen(true)}>
                                    <Users size={16} aria-hidden="true" />
                                    <span>Designated Staff ({activePpaStaffCount})</span>
                                </Button>
                            )}
                            <Button variant="secondary" onClick={handleExportCsv}>
                                <Download size={15} aria-hidden="true" />
                                <span>Export AIP CSV</span>
                            </Button>
                        </>
                    }
                />

                <PortalWorkspaceNav current="ppas" destinations={['ppas', 'developmentPlans', 'availablePlanningMaps']} />

                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)] px-4 py-3 text-xs">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <ShieldCheck size={16} aria-hidden="true" className="shrink-0 text-[var(--brand-ink)]" />
                        <span className="font-semibold text-[var(--ink-primary)]">{permissions.accessLabel}</span>
                        <span className="hidden text-[var(--ink-secondary)] lg:inline">— {permissions.accessHint}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 font-mono text-xs text-[var(--ink-secondary)]">
                        <span>
                            <strong className="text-[var(--ink-primary)]">{records.length}</strong> of {visiblePool.length} PPAs
                        </span>
                        <span>
                            Indicative total: <strong className="text-[var(--brand-ink)]">{formatPhpCompact(totalFilteredBudget)}</strong>
                        </span>
                    </div>
                </div>

                {statusMessage && (
                    <div
                        role="status"
                        className="rounded-xl border border-[var(--status-ok-border)] bg-[var(--status-ok-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--status-ok-fg)]"
                    >
                        {statusMessage}
                    </div>
                )}

                <PPAFilters
                    filters={filters}
                    onChange={(next) => {
                        setFilters(next);
                        setSelectedId(null);
                    }}
                />

                <div className="space-y-4">
                    <section aria-label="PPA register results" className="min-w-0 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--ink-secondary)]">
                            <h2 className="text-sm font-bold text-[var(--ink-primary)]">PPA register</h2>
                            <span role="status" aria-live="polite">
                                {records.length} matching {records.length === 1 ? 'record' : 'records'}
                            </span>
                        </div>
                        <PPARegister
                            records={records}
                            selectedId={selected?.id}
                            docCountsByPpa={docCountsByPpa}
                            onSelect={(item) => setSelectedId(item?.id ?? null)}
                        />
                    </section>
                </div>

                <PPADetailPanel
                    record={selected}
                    plans={plans}
                    attachments={attachments}
                    permissions={permissions}
                    actorName={auth.user?.name || 'MPDC Staff'}
                    currentIndex={selected ? records.findIndex((item) => item.id === selected.id) : undefined}
                    totalCount={records.length}
                    onPrev={() => {
                        if (!selected) return;
                        const idx = records.findIndex((item) => item.id === selected.id);
                        if (idx > 0) setSelectedId(records[idx - 1].id);
                    }}
                    onNext={() => {
                        if (!selected) return;
                        const idx = records.findIndex((item) => item.id === selected.id);
                        if (idx >= 0 && idx < records.length - 1) setSelectedId(records[idx + 1].id);
                    }}
                    onEdit={(item) => {
                        setEditingRecord(item);
                        setFormOpen(true);
                    }}
                    onArchive={handleArchivePpa}
                    onDelete={(item) => setDeletingRecord(item)}
                    onAddAttachment={handleAddAttachment}
                    onRemoveAttachment={handleRemoveAttachment}
                    onClose={() => {
                        const id = selected?.id;
                        setSelectedId(null);
                        if (id) {
                            window.requestAnimationFrame(() => {
                                document.getElementById(`ppa-select-${id}`)?.focus();
                            });
                        }
                    }}
                />

                <PPAFormDrawer
                    open={formOpen}
                    editing={editingRecord}
                    plans={plans}
                    actorName={auth.user?.name || 'MPDC Staff'}
                    officeProposalMode={!permissions.canCreate && permissions.canProposeOfficeDraft}
                    actorOfficeName={permissions.actorOfficeName}
                    onClose={() => {
                        setFormOpen(false);
                        setEditingRecord(null);
                    }}
                    onSave={handleSavePpa}
                />

                <DesignatedStaffDrawer
                    open={staffDrawerOpen}
                    staff={staff}
                    headName={auth.user?.name || 'MPDC Department Head'}
                    contextModule="ppas"
                    onClose={() => setStaffDrawerOpen(false)}
                    onToggleStaff={handleToggleStaff}
                    onToggleModuleScope={handleToggleModuleScope}
                />

                <ConfirmDialog
                    open={Boolean(deletingRecord)}
                    title={deletingRecord ? `Delete ${deletingRecord.id}?` : 'Delete PPA?'}
                    message={
                        deletingRecord
                            ? `This permanently removes “${deletingRecord.title}” from the Municipal PPA register. Consider archiving instead if historical traceability is needed.`
                            : ''
                    }
                    confirmLabel="Delete PPA"
                    destructive
                    onCancel={() => setDeletingRecord(null)}
                    onConfirm={handleConfirmDelete}
                />

                <details className="group tcds-card">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-2.5 text-sm font-bold text-[var(--ink-primary)] marker:hidden">
                        <span>PPA summary breakdown</span>
                        <span className="text-xs font-semibold text-[var(--brand-ink)] group-open:hidden">Show</span>
                        <span className="hidden text-xs font-semibold text-[var(--brand-ink)] group-open:inline">Hide</span>
                    </summary>
                    <div className="border-t border-[var(--border-default)] p-4">
                        <PPASummary records={records} />
                    </div>
                </details>
            </div>
        </AppLayout>
    );
}
