import { router } from '@inertiajs/react';
import { ClipboardList, Download, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import type { ServerPlanningAttachment } from '../../components/planning/SupportingDocsPanel';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import PPADetailPanel from '../../components/ppas/PPADetailPanel';
import PPAFilters from '../../components/ppas/PPAFilters';
import PPARegister from '../../components/ppas/PPARegister';
import PPASummary from '../../components/ppas/PPASummary';
import Button from '../../components/ui/Button';
import Dialog from '../../components/ui/Dialog';
import type { PPAFilters as FilterState, PPARecord } from '../../data/municipal/ppas.types';
import AppLayout from '../../layouts/AppLayout';
import type { PlanningPermissions } from '../Plans/Index';

type Props = {
    ppaRecords?: PPARecord[];
    attachments?: ServerPlanningAttachment[];
    planningPermissions?: PlanningPermissions;
};

const initialFilters: FilterState = {
    query: '',
    sector: '',
    office: '',
    year: '',
    plan: '',
    fundingSource: '',
    status: '',
};

export default function Index({
    ppaRecords: serverPpaRecords,
    attachments = [],
    planningPermissions,
}: Props) {
    const ppaRecords =
        serverPpaRecords ?? [];

    const [filters, setFilters] = useState(() => ({
        ...initialFilters,
        query:
            typeof window === 'undefined'
                ? ''
                : new URLSearchParams(window.location.search).get('search') ?? '',
    }));
    const [selected, setSelected] = useState<PPARecord | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [title, setTitle] = useState('');
    const [sector, setSector] = useState('Infrastructure');
    const [responsibleOffice, setResponsibleOffice] = useState(
        planningPermissions?.actorDepartmentName ?? 'Municipal Engineering Office',
    );
    const [year, setYear] = useState('2027');
    const [relatedPlan, setRelatedPlan] = useState('Local Development Investment Program');
    const [fundingSource, setFundingSource] = useState('20% Development Fund');
    const [status, setStatus] = useState('Planned');
    const [mooeAmount, setMooeAmount] = useState('0');
    const [coAmount, setCoAmount] = useState('1500000');
    const [barangay, setBarangay] = useState('Poblacion');
    const [aipCode, setAipCode] = useState('');
    const [gadAttributed, setGadAttributed] = useState(false);
    const [drrmTagged, setDrrmTagged] = useState(false);
    const [context, setContext] = useState('');
    const [busy, setBusy] = useState(false);

    const records = useMemo(() => {
        const query = filters.query.trim().toLowerCase();
        return ppaRecords.filter((record) => {
            const searchable = [
                record.title,
                record.sector,
                record.responsibleOffice,
                record.relatedDevelopmentPlan,
                record.fundingSource,
                record.id,
            ]
                .join(' ')
                .toLowerCase();
            return (
                (!query || searchable.includes(query)) &&
                (!filters.sector || record.sector === filters.sector) &&
                (!filters.office || record.responsibleOffice === filters.office) &&
                (!filters.year || String(record.year) === filters.year) &&
                (!filters.plan || record.relatedDevelopmentPlan === filters.plan) &&
                (!filters.fundingSource || record.fundingSource === filters.fundingSource) &&
                (!filters.status || record.status === filters.status)
            );
        });
    }, [ppaRecords, filters]);

    const exportCsvHref = useMemo(() => {
        const params = new URLSearchParams();
        if (filters.sector) params.set('sector', filters.sector);
        if (filters.office) params.set('office', filters.office);
        if (filters.year) params.set('year', filters.year);
        if (filters.status) params.set('status', filters.status);
        const qs = params.toString();
        return qs ? `/ppas/export/csv?${qs}` : '/ppas/export/csv';
    }, [filters]);

    const canSubmitPpa = Boolean(
        planningPermissions?.canManagePpas || planningPermissions?.canProposeOfficePpa,
    );

    const handleSubmitPpa = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || busy) return;
        setBusy(true);
        router.post(
            '/ppas',
            {
                title: title.trim(),
                sector,
                responsible_office: responsibleOffice.trim(),
                year: Number(year),
                related_development_plan: relatedPlan.trim(),
                funding_source: fundingSource.trim(),
                status,
                mooe_amount: Number(mooeAmount) || 0,
                co_amount: Number(coAmount) || 0,
                barangay: barangay.trim() || 'Poblacion',
                aip_reference_code: aipCode.trim() || undefined,
                gad_attributed: gadAttributed,
                drrm_tagged: drrmTagged,
                implementation_context: context.trim() || undefined,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setTitle('');
                    setContext('');
                    setAipCode('');
                    setShowCreateModal(false);
                },
                onFinish: () => setBusy(false),
            },
        );
    };

    return (
        <AppLayout title="Programs, Projects and Activities">
            <PageFrame
                className="civic-page ot-r6-modules ot-r6-ppas r8-ppas max-w-[1480px]"
                density="compact"
            >
                <PageHeader
                    eyebrow="Planning and implementation register"
                    title="Programs, Projects and Activities"
                    description="Municipal PPA reference register. Status and related-project counts are reference data; no completion percentage is recorded for PPAs."
                    icon={ClipboardList}
                    aside={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="mr-2 text-right text-xs text-[var(--municipal-muted)]">
                                <strong className="text-[var(--municipal-text)]">
                                    {records.length}
                                </strong>{' '}
                                of {ppaRecords.length} records
                            </div>
                            <a
                                href={exportCsvHref}
                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-3 text-xs font-semibold text-[var(--municipal-text)] hover:bg-[var(--municipal-hover)]"
                            >
                                <Download size={14} aria-hidden="true" /> Export AIP CSV
                            </a>
                            {canSubmitPpa && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => setShowCreateModal(true)}
                                >
                                    {planningPermissions?.canManagePpas
                                        ? 'Register PPA Entry'
                                        : 'Submit Office Proposal'}
                                </Button>
                            )}
                        </div>
                    }
                />
                <PortalWorkspaceNav
                    current="ppas"
                    destinations={['ppas', 'projectMonitoring', 'developmentPlans']}
                />
                <p role="note" className="text-xs leading-5 text-[var(--municipal-muted)]">
                    Reference register · Statuses and counts do not represent verified live project progress.
                </p>
                <PPAFilters
                    filters={filters}
                    onChange={(next) => {
                        setFilters(next);
                        setSelected(null);
                    }}
                />
                <div
                    className={`ot-r6-ppa-layout ${selected ? 'ot-r6-ppa-layout--selected' : ''}`}
                >
                    <section
                        aria-label="PPA register results"
                        className="ot-r6-ppa-register min-w-0 space-y-2"
                    >
                        <div className="r8-ppas-register-heading flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--municipal-muted)]">
                            <h2 className="font-semibold text-[var(--municipal-text)]">
                                PPA register
                            </h2>
                            <span role="status" aria-live="polite">
                                {records.length} matching reference{' '}
                                {records.length === 1 ? 'record' : 'records'}
                            </span>
                        </div>
                        <PPARegister
                            records={records}
                            selectedId={selected?.id}
                            onSelect={setSelected}
                        />
                    </section>
                    {selected ? (
                        <PPADetailPanel
                            record={selected}
                            attachments={attachments}
                            planningPermissions={planningPermissions}
                            onClose={() => {
                                const id = selected.id;
                                setSelected(null);
                                window.requestAnimationFrame(() => {
                                    const trigger = Array.from(
                                        document.querySelectorAll<HTMLElement>(
                                            '[data-ppa-trigger]',
                                        ),
                                    ).find(
                                        (element) =>
                                            element.dataset.ppaTrigger === id &&
                                            element.getClientRects().length > 0,
                                    );
                                    trigger?.focus();
                                });
                            }}
                        />
                    ) : null}
                </div>
                <details className="group municipal-panel">
                    <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-3 py-2 text-xs font-semibold marker:hidden">
                        <span>PPA summary</span>
                        <span className="text-[var(--municipal-brand)] group-open:hidden">
                            Show
                        </span>
                        <span className="hidden text-[var(--municipal-brand)] group-open:inline">
                            Hide
                        </span>
                    </summary>
                    <div className="border-t border-[var(--municipal-border)] p-3">
                        <PPASummary records={records} />
                    </div>
                </details>
            </PageFrame>

            <Dialog
                variant="drawer-right"
                open={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={
                    planningPermissions?.canManagePpas
                        ? 'Register Program / Project / Activity'
                        : 'Submit Implementing Office PPA Proposal'
                }
                description="Record an AIP investment entry with PS/MOOE/CO appropriation breakdown and GAD/CCET/DRRM attribution."
                size="lg"
            >
                <form onSubmit={handleSubmitPpa} className="space-y-3 text-xs">
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Program / Project / Activity Title
                        <input
                            type="text"
                            required
                            maxLength={255}
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Municipal Drainage Line Rehabilitation"
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        />
                    </label>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Sector
                            <select
                                value={sector}
                                onChange={(e) => setSector(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                {[
                                    'Infrastructure',
                                    'Agriculture',
                                    'Fisheries',
                                    'Environment',
                                    'Economic',
                                    'Health',
                                    'Social Protection',
                                    'Disaster Risk Reduction',
                                    'Youth',
                                    'Tourism',
                                    'Employment',
                                    'Governance',
                                ].map((s) => (
                                    <option key={s} value={s}>
                                        {s}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Fiscal Year
                            <input
                                type="number"
                                min={2024}
                                max={2035}
                                required
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Status
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                disabled={!planningPermissions?.canManagePpas}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            >
                                <option value="Planned">Planned</option>
                                {planningPermissions?.canManagePpas && (
                                    <>
                                        <option value="For Procurement">For Procurement</option>
                                        <option value="Ongoing">Ongoing</option>
                                    </>
                                )}
                                {planningPermissions?.canPublishOrArchive && (
                                    <>
                                        <option value="Completed">Completed</option>
                                        <option value="On Hold">On Hold</option>
                                    </>
                                )}
                            </select>
                        </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Implementing Office
                            <input
                                type="text"
                                required
                                disabled={!planningPermissions?.canManagePpas}
                                value={responsibleOffice}
                                onChange={(e) => setResponsibleOffice(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Source Development Plan
                            <input
                                type="text"
                                required
                                value={relatedPlan}
                                onChange={(e) => setRelatedPlan(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Funding Source
                            <input
                                type="text"
                                required
                                value={fundingSource}
                                onChange={(e) => setFundingSource(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            MOOE Amount (PHP)
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={mooeAmount}
                                onChange={(e) => setMooeAmount(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Capital Outlay (PHP)
                            <input
                                type="number"
                                min={0}
                                step="0.01"
                                value={coAmount}
                                onChange={(e) => setCoAmount(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            Target Barangay
                            <input
                                type="text"
                                value={barangay}
                                onChange={(e) => setBarangay(e.target.value)}
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                        <label className="block font-semibold text-[var(--municipal-text)]">
                            AIP Reference Code
                            <input
                                type="text"
                                value={aipCode}
                                onChange={(e) => setAipCode(e.target.value)}
                                placeholder="e.g., 8000-2027-015"
                                className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                            />
                        </label>
                    </div>
                    <div className="flex flex-wrap gap-4 pt-1">
                        <label className="inline-flex items-center gap-1.5 font-semibold text-[var(--municipal-text)]">
                            <input
                                type="checkbox"
                                checked={gadAttributed}
                                onChange={(e) => setGadAttributed(e.target.checked)}
                            />
                            GAD Attributed
                        </label>
                        <label className="inline-flex items-center gap-1.5 font-semibold text-[var(--municipal-text)]">
                            <input
                                type="checkbox"
                                checked={drrmTagged}
                                onChange={(e) => setDrrmTagged(e.target.checked)}
                            />
                            DRRM / Resilience Tagged
                        </label>
                    </div>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Implementation Context / Expected Output
                        <textarea
                            rows={2}
                            maxLength={2000}
                            value={context}
                            onChange={(e) => setContext(e.target.value)}
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
                            Save PPA Record
                        </Button>
                    </div>
                </form>
            </Dialog>
        </AppLayout>
    );
}
