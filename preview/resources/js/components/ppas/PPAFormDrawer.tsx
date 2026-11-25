import { type FormEvent, useEffect, useId, useState } from 'react';
import { formatPhpCurrency } from '../../data/municipal/planningGovernance';
import { DEFAULT_PLANNING_MAPS } from '../../data/municipal/planningMaps';
import type { MunicipalPlan } from '../../data/municipal/plans';
import { ppaOptions } from '../../data/municipal/ppas';
import type { PPAPriority, PPARecord, PPAStatus } from '../../data/municipal/ppas.types';
import { Button, Dialog, FormField } from '../ui';

type Props = {
    open: boolean;
    editing: PPARecord | null;
    plans: MunicipalPlan[];
    actorName: string;
    officeProposalMode: boolean;
    actorOfficeName: string;
    onClose: () => void;
    onSave: (record: PPARecord) => void;
};

const FUNDING_SOURCES = [
    '20% Development Fund',
    'General Fund',
    'LDRRM Fund',
    'GAD Fund',
    'Special Education Fund (SEF)',
    'Economic Enterprise Fund',
    'National / External Grant',
];

const PRIORITIES: PPAPriority[] = ['High', 'Medium', 'Routine'];

export default function PPAFormDrawer({
    open,
    editing,
    plans,
    actorName,
    officeProposalMode,
    actorOfficeName,
    onClose,
    onSave,
}: Props) {
    const formId = useId();

    const [title, setTitle] = useState('');
    const [aipRefCode, setAipRefCode] = useState('');
    const [sector, setSector] = useState<string>('Infrastructure');
    const [responsibleOffice, setResponsibleOffice] = useState<string>('Municipal Engineering Office');
    const [year, setYear] = useState<number>(2027);
    const [linkedPlanId, setLinkedPlanId] = useState<string>('plan-aip-2027');
    const [linkedMapId, setLinkedMapId] = useState<string>('map-tal-base-2026');
    const [fundingSource, setFundingSource] = useState<string>('20% Development Fund');
    const [status, setStatus] = useState<PPAStatus>('Planned');
    const [priority, setPriority] = useState<PPAPriority>('Medium');
    const [scheduleStart, setScheduleStart] = useState('Jan 2027');
    const [scheduleEnd, setScheduleEnd] = useState('Dec 2027');
    const [barangaysInput, setBarangaysInput] = useState('All 25 Barangays');
    const [expectedOutputs, setExpectedOutputs] = useState('');
    const [implementationContext, setImplementationContext] = useState('');
    const [budgetPs, setBudgetPs] = useState('0');
    const [budgetMooe, setBudgetMooe] = useState('500000');
    const [budgetCo, setBudgetCo] = useState('1500000');
    const [ccaAmount, setCcaAmount] = useState('');
    const [gadAttributed, setGadAttributed] = useState(false);
    const [drrmTagged, setDrrmTagged] = useState(false);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            setTitle(editing.title);
            setAipRefCode(editing.aipRefCode);
            setSector(editing.sector);
            setResponsibleOffice(editing.responsibleOffice);
            setYear(editing.year);
            setLinkedPlanId(editing.linkedPlanId || plans[0]?.id || '');
            setLinkedMapId(editing.linkedMapId || '');
            setFundingSource(editing.fundingSource);
            setStatus(editing.status);
            setPriority(editing.priority);
            setScheduleStart(editing.scheduleStart);
            setScheduleEnd(editing.scheduleEnd);
            setBarangaysInput(editing.barangays.join(', '));
            setExpectedOutputs(editing.expectedOutputs);
            setImplementationContext(editing.implementationContext);
            setBudgetPs(String(editing.budgetPs));
            setBudgetMooe(String(editing.budgetMooe));
            setBudgetCo(String(editing.budgetCo));
            setCcaAmount(editing.ccaAmount ? String(editing.ccaAmount) : '');
            setGadAttributed(Boolean(editing.gadAttributed));
            setDrrmTagged(Boolean(editing.drrmTagged));
        } else {
            setTitle('');
            setAipRefCode('');
            setSector('Infrastructure');
            setResponsibleOffice(officeProposalMode ? actorOfficeName : 'Municipal Engineering Office');
            setYear(2027);
            setLinkedPlanId('plan-aip-2027');
            setLinkedMapId('map-tal-base-2026');
            setFundingSource('20% Development Fund');
            setStatus(officeProposalMode ? 'For MPDC Review' : 'Planned');
            setPriority('Medium');
            setScheduleStart('Jan 2027');
            setScheduleEnd('Dec 2027');
            setBarangaysInput('All 25 Barangays');
            setExpectedOutputs('');
            setImplementationContext('');
            setBudgetPs('0');
            setBudgetMooe('500000');
            setBudgetCo('1500000');
            setCcaAmount('');
            setGadAttributed(false);
            setDrrmTagged(false);
        }
    }, [open, editing, officeProposalMode, actorOfficeName, plans]);

    const ps = Math.max(0, Number(budgetPs) || 0);
    const mooe = Math.max(0, Number(budgetMooe) || 0);
    const co = Math.max(0, Number(budgetCo) || 0);
    const total = ps + mooe + co;

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim()) return;

        const chosenPlan = plans.find((p) => p.id === linkedPlanId);
        const barangays = barangaysInput
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean);

        const nextRecord: PPARecord = {
            id: editing?.id || `PPA-${year}-${String(Math.floor(100 + Math.random() * 899))}`,
            aipRefCode:
                aipRefCode.trim() ||
                (officeProposalMode
                    ? `PENDING-AIP-${year}`
                    : `8000-000-3-1-${String(Math.floor(10 + Math.random() * 89))}-001`),
            title: title.trim(),
            sector,
            responsibleOffice: officeProposalMode ? actorOfficeName : responsibleOffice,
            year,
            relatedDevelopmentPlan: chosenPlan?.title || editing?.relatedDevelopmentPlan || 'Annual Investment Program',
            linkedPlanId: chosenPlan?.id || linkedPlanId || undefined,
            linkedMapId: linkedMapId || undefined,
            fundingSource,
            status: officeProposalMode ? (status === 'Draft' ? 'Draft' : 'For MPDC Review') : status,
            relatedProjectCount: editing?.relatedProjectCount ?? 1,
            priority,
            implementationContext:
                implementationContext.trim() || 'Municipal planning and investment entry encoded via ONE TALIBON.',
            expectedOutputs:
                expectedOutputs.trim() || 'Targeted sectoral deliverables and municipal service milestones.',
            scheduleStart: scheduleStart.trim() || `Jan ${year}`,
            scheduleEnd: scheduleEnd.trim() || `Dec ${year}`,
            barangays: barangays.length > 0 ? barangays : ['All 25 Barangays'],
            budgetPs: ps,
            budgetMooe: mooe,
            budgetCo: co,
            budgetTotal: total,
            ccaAmount: Number(ccaAmount) > 0 ? Number(ccaAmount) : undefined,
            ccmAmount: editing?.ccmAmount,
            gadAttributed,
            drrmTagged,
            updatedAt: new Date().toISOString().slice(0, 10),
            updatedBy: actorName,
        };

        onSave(nextRecord);
        onClose();
    };

    const allowedStatuses: PPAStatus[] = officeProposalMode
        ? ['Draft', 'For MPDC Review']
        : ['Draft', 'For MPDC Review', 'Planned', 'For Procurement', 'Ongoing', 'Completed', 'On Hold', 'Archived'];

    return (
        <Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title={
                editing
                    ? `Edit ${editing.id}`
                    : officeProposalMode
                      ? 'Propose Office PPA (For MPDC Review)'
                      : 'Add PPA to Municipal Register'
            }
            description={
                officeProposalMode
                    ? `Submitted under ${actorOfficeName}. MPDC assigns the official DILG-DBM AIP Reference Code upon review.`
                    : 'Encode standardized Philippine DILG-NEDA-DBM AIP fields, indicative budget breakdown, and plan/map links.'
            }
            footer={
                <div className="flex w-full flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">
                        Total Allocation: <strong className="text-[var(--ink-primary)]">{formatPhpCurrency(total)}</strong>
                    </span>
                    <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" form={formId} size="sm">
                            {editing ? 'Save changes' : officeProposalMode ? 'Submit for MPDC review' : 'Save PPA'}
                        </Button>
                    </div>
                </div>
            }
        >
            <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                    <FormField label="Program / Project / Activity Title" htmlFor={`${formId}-title`} required className="sm:col-span-2">
                        <input
                            id={`${formId}-title`}
                            required
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Barangay San Isidro Farm-to-Market Road Concreting"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField
                        label="Official AIP Reference Code"
                        htmlFor={`${formId}-aip`}
                        hint={officeProposalMode ? 'Assigned by MPDC upon consolidation' : 'DILG-DBM format: e.g., 8000-000-3-1-01-001'}
                    >
                        <input
                            id={`${formId}-aip`}
                            disabled={officeProposalMode}
                            value={aipRefCode}
                            onChange={(e) => setAipRefCode(e.target.value)}
                            placeholder={officeProposalMode ? 'Pending MPDC coding' : '8000-000-3-1-01-001'}
                            className="tcds-input font-mono disabled:opacity-60"
                        />
                    </FormField>

                    <FormField label="Budget / Program Year" htmlFor={`${formId}-year`} required>
                        <select
                            id={`${formId}-year`}
                            value={year}
                            onChange={(e) => setYear(Number(e.target.value))}
                            className="tcds-input"
                        >
                            {[2025, 2026, 2027, 2028].map((y) => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Sector" htmlFor={`${formId}-sector`} required>
                        <select
                            id={`${formId}-sector`}
                            value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            className="tcds-input"
                        >
                            {ppaOptions.sectors.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Implementing Office" htmlFor={`${formId}-office`} required>
                        {officeProposalMode ? (
                            <input
                                id={`${formId}-office`}
                                value={actorOfficeName}
                                disabled
                                className="tcds-input opacity-75"
                            />
                        ) : (
                            <select
                                id={`${formId}-office`}
                                value={responsibleOffice}
                                onChange={(e) => setResponsibleOffice(e.target.value)}
                                className="tcds-input"
                            >
                                {ppaOptions.offices.map((item) => (
                                    <option key={item} value={item}>{item}</option>
                                ))}
                            </select>
                        )}
                    </FormField>

                    <FormField label="Parent Development Plan" htmlFor={`${formId}-plan`} required className="sm:col-span-2">
                        <select
                            id={`${formId}-plan`}
                            value={linkedPlanId}
                            onChange={(e) => setLinkedPlanId(e.target.value)}
                            className="tcds-input"
                        >
                            {plans.map((plan) => (
                                <option key={plan.id} value={plan.id}>
                                    {plan.code} — {plan.title}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Linked Spatial Planning Map" htmlFor={`${formId}-map`} optional className="sm:col-span-2">
                        <select
                            id={`${formId}-map`}
                            value={linkedMapId}
                            onChange={(e) => setLinkedMapId(e.target.value)}
                            className="tcds-input"
                        >
                            <option value="">No map pin linked</option>
                            {DEFAULT_PLANNING_MAPS.map((map) => (
                                <option key={map.id} value={map.id}>
                                    {map.code} — {map.title}
                                </option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Funding Source" htmlFor={`${formId}-funding`} required>
                        <select
                            id={`${formId}-funding`}
                            value={fundingSource}
                            onChange={(e) => setFundingSource(e.target.value)}
                            className="tcds-input"
                        >
                            {FUNDING_SOURCES.map((source) => (
                                <option key={source} value={source}>{source}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Lifecycle Status" htmlFor={`${formId}-status`} required>
                        <select
                            id={`${formId}-status`}
                            value={status}
                            onChange={(e) => setStatus(e.target.value as PPAStatus)}
                            className="tcds-input"
                        >
                            {allowedStatuses.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Priority" htmlFor={`${formId}-priority`} required>
                        <select
                            id={`${formId}-priority`}
                            value={priority}
                            onChange={(e) => setPriority(e.target.value as PPAPriority)}
                            className="tcds-input"
                        >
                            {PRIORITIES.map((p) => (
                                <option key={p} value={p}>{p}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Covered Barangays" htmlFor={`${formId}-brgy`} hint="Comma-separated">
                        <input
                            id={`${formId}-brgy`}
                            value={barangaysInput}
                            onChange={(e) => setBarangaysInput(e.target.value)}
                            placeholder="All 25 Barangays"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField label="Schedule Start" htmlFor={`${formId}-start`}>
                        <input
                            id={`${formId}-start`}
                            value={scheduleStart}
                            onChange={(e) => setScheduleStart(e.target.value)}
                            placeholder="Jan 2027"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField label="Target Completion" htmlFor={`${formId}-end`}>
                        <input
                            id={`${formId}-end`}
                            value={scheduleEnd}
                            onChange={(e) => setScheduleEnd(e.target.value)}
                            placeholder="Dec 2027"
                            className="tcds-input"
                        />
                    </FormField>
                </div>

                <fieldset className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        Indicative Budget Allocation (PHP · DILG-DBM AIP)
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-3">
                        <FormField label="PS (Personal Services)" htmlFor={`${formId}-ps`}>
                            <input
                                id={`${formId}-ps`}
                                type="number"
                                min="0"
                                step="10000"
                                value={budgetPs}
                                onChange={(e) => setBudgetPs(e.target.value)}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="MOOE" htmlFor={`${formId}-mooe`}>
                            <input
                                id={`${formId}-mooe`}
                                type="number"
                                min="0"
                                step="10000"
                                value={budgetMooe}
                                onChange={(e) => setBudgetMooe(e.target.value)}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="CO (Capital Outlay)" htmlFor={`${formId}-co`}>
                            <input
                                id={`${formId}-co`}
                                type="number"
                                min="0"
                                step="10000"
                                value={budgetCo}
                                onChange={(e) => setBudgetCo(e.target.value)}
                                className="tcds-input font-mono"
                            />
                        </FormField>
                    </div>
                    <div className="grid gap-3 pt-1 sm:grid-cols-2">
                        <FormField label="Climate Adaptation (CCA ₱)" htmlFor={`${formId}-cca`} optional>
                            <input
                                id={`${formId}-cca`}
                                type="number"
                                min="0"
                                step="10000"
                                value={ccaAmount}
                                onChange={(e) => setCcaAmount(e.target.value)}
                                placeholder="0"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <div className="flex flex-col justify-end gap-2 pb-1 text-xs font-semibold text-[var(--ink-primary)]">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={gadAttributed}
                                    onChange={(e) => setGadAttributed(e.target.checked)}
                                    className="h-4 w-4 rounded"
                                />
                                <span>GAD Attributed (5% GAD)</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={drrmTagged}
                                    onChange={(e) => setDrrmTagged(e.target.checked)}
                                    className="h-4 w-4 rounded"
                                />
                                <span>DRRM / CCA Tagged (5% LDRRMF)</span>
                            </label>
                        </div>
                    </div>
                </fieldset>

                <FormField label="Expected Outputs (Deliverables)" htmlFor={`${formId}-outputs`} required>
                    <textarea
                        id={`${formId}-outputs`}
                        required
                        rows={2}
                        value={expectedOutputs}
                        onChange={(e) => setExpectedOutputs(e.target.value)}
                        placeholder="Measurable deliverables (e.g., km of roads paved, households or beneficiaries served)…"
                        className="tcds-input py-2"
                    />
                </FormField>

                <FormField label="Implementation Context / Remarks" htmlFor={`${formId}-ctx`}>
                    <textarea
                        id={`${formId}-ctx`}
                        rows={2}
                        value={implementationContext}
                        onChange={(e) => setImplementationContext(e.target.value)}
                        placeholder="Operational notes, coordination requirements, or site readiness context…"
                        className="tcds-input py-2"
                    />
                </FormField>
            </form>
        </Dialog>
    );
}
