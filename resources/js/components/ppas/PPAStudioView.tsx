import { type FormEvent, type ReactNode, useId } from 'react';
import { Button, Dialog, FormField } from '../ui';
type PPAStatus = string;
type PPAPriority = string;
export type PPAStudioValues = {
    title: string;
    aipRefCode: string;
    sector: string;
    responsibleOffice: string;
    year: number;
    linkedPlanId: string;
    linkedMapId: string;
    fundingSource: string;
    status: string;
    priority: string;
    scheduleStart: string;
    scheduleEnd: string;
    barangaysInput: string;
    expectedOutputs: string;
    implementationContext: string;
    budgetPs: string;
    budgetMooe: string;
    budgetCo: string;
    ccaAmount: string;
    gadAttributed: boolean;
    drrmTagged: boolean;
};
const FUNDING_SOURCES = ['20% Development Fund', 'General Fund', 'LDRRM Fund', 'GAD Fund', 'Special Education Fund (SEF)', 'Economic Enterprise Fund', 'National / External Grant'];
const PRIORITIES = ['High', 'Medium', 'Routine'];
const formatPhpCurrency = (value: number) => new Intl.NumberFormat('en-PH', {style:'currency', currency:'PHP', maximumFractionDigits:0}).format(value);
export default function PPAStudioView({ open, editing, officeProposalMode, actorOfficeName, onClose, values, onChange, onSubmit: handleSubmit, plans, maps: DEFAULT_PLANNING_MAPS, sectors, offices, statuses: allowedStatuses, unavailable = [], busy = false, error, referenceFields, officeInputMode = false, lockAipCode = officeProposalMode }: {
    open: boolean; editing: {id:string} | null; officeProposalMode: boolean; actorOfficeName: string; onClose: () => void;
    values: PPAStudioValues; onChange: (field: keyof PPAStudioValues, value: string | number | boolean) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    plans: Array<{id:string;code:string;title:string}>; maps: Array<{id:string;code:string;title:string}>;
    sectors: string[]; offices: string[]; statuses: string[]; unavailable?: Array<keyof PPAStudioValues>; busy?: boolean; error?: string; referenceFields?: ReactNode; officeInputMode?: boolean; lockAipCode?: boolean;
}) {
    const formId = useId();
    const { title, aipRefCode, sector, responsibleOffice, year, linkedPlanId, linkedMapId, fundingSource, status, priority, scheduleStart, scheduleEnd, barangaysInput, expectedOutputs, implementationContext, budgetPs, budgetMooe, budgetCo, ccaAmount, gadAttributed, drrmTagged } = values;
    const ppaOptions = {sectors,offices};
    const total = [budgetPs,budgetMooe,budgetCo].reduce((sum,value)=>sum+(Number(value)||0),0);
    const setTitle = (value: string) => onChange('title',value);
    const setAipRefCode = (value: string) => onChange('aipRefCode',value);
    const setSector = (value: string) => onChange('sector',value);
    const setResponsibleOffice = (value: string) => onChange('responsibleOffice',value);
    const setYear = (value: number) => onChange('year',value);
    const setLinkedPlanId = (value: string) => onChange('linkedPlanId',value);
    const setLinkedMapId = (value: string) => onChange('linkedMapId',value);
    const setFundingSource = (value: string) => onChange('fundingSource',value);
    const setStatus = (value: string) => onChange('status',value);
    const setPriority = (value: string) => onChange('priority',value);
    const setScheduleStart = (value: string) => onChange('scheduleStart',value);
    const setScheduleEnd = (value: string) => onChange('scheduleEnd',value);
    const setBarangaysInput = (value: string) => onChange('barangaysInput',value);
    const setExpectedOutputs = (value: string) => onChange('expectedOutputs',value);
    const setImplementationContext = (value: string) => onChange('implementationContext',value);
    const setBudgetPs = (value: string) => onChange('budgetPs',value);
    const setBudgetMooe = (value: string) => onChange('budgetMooe',value);
    const setBudgetCo = (value: string) => onChange('budgetCo',value);
    const setCcaAmount = (value: string) => onChange('ccaAmount',value);
    const setGadAttributed = (value: boolean) => onChange('gadAttributed',value);
    const setDrrmTagged = (value: boolean) => onChange('drrmTagged',value);
    return (<Dialog
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
                        <Button type="submit" form={formId} size="sm" disabled={busy}>
                            {editing ? 'Save changes' : officeProposalMode ? 'Submit for MPDC review' : 'Save PPA'}
                        </Button>
                    </div>
                </div>
            }
        >
            <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                {error && <p role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--status-danger-fg)]">{error}</p>}
                {unavailable.length > 0 && <p role="note" className="text-xs text-[var(--ink-secondary)]">Disabled fields are unavailable in the current server contract.</p>}
                {referenceFields}
                <div className="grid gap-3.5 sm:grid-cols-2">
                    <FormField label="Program / Project / Activity Title" htmlFor={`${formId}-title`} required className="sm:col-span-2">
                        <input
                            id={`${formId}-title`}
                            required
                            disabled={unavailable.includes('title')} value={title}
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
                            disabled={lockAipCode || unavailable.includes('aipRefCode')} value={aipRefCode}
                            onChange={(e) => setAipRefCode(e.target.value)}
                            placeholder={officeProposalMode ? 'Pending MPDC coding' : '8000-000-3-1-01-001'}
                            className="tcds-input font-mono disabled:opacity-60"
                        />
                    </FormField>

                    <FormField label="Budget / Program Year" htmlFor={`${formId}-year`} required>
                        <select
                            id={`${formId}-year`}
                            disabled={unavailable.includes('year')} value={year}
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
                            disabled={unavailable.includes('sector')} value={sector}
                            onChange={(e) => setSector(e.target.value)}
                            className="tcds-input"
                        >
                            {ppaOptions.sectors.map((item) => (
                                <option key={item} value={item}>{item}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Implementing Office" htmlFor={`${formId}-office`} required>
                        {officeInputMode || officeProposalMode ? (
                            <input
                                id={`${formId}-office`}
                                value={officeProposalMode ? actorOfficeName : responsibleOffice}
                                onChange={event => setResponsibleOffice(event.target.value)}
                                disabled={officeProposalMode}
                                className="tcds-input opacity-75"
                            />
                        ) : (
                            <select
                                id={`${formId}-office`}
                                disabled={unavailable.includes('responsibleOffice')} value={responsibleOffice}
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
                            disabled={unavailable.includes('linkedPlanId')} value={linkedPlanId}
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
                            disabled={unavailable.includes('linkedMapId')} value={linkedMapId}
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
                            disabled={unavailable.includes('fundingSource')} value={fundingSource}
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
                            disabled={unavailable.includes('status')} value={status}
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
                            disabled={unavailable.includes('priority')} value={priority}
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
                            disabled={unavailable.includes('barangaysInput')} value={barangaysInput}
                            onChange={(e) => setBarangaysInput(e.target.value)}
                            placeholder="All 25 Barangays"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField label="Schedule Start" htmlFor={`${formId}-start`}>
                        <input
                            id={`${formId}-start`}
                            disabled={unavailable.includes('scheduleStart')} value={scheduleStart}
                            onChange={(e) => setScheduleStart(e.target.value)}
                            placeholder="Jan 2027"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField label="Target Completion" htmlFor={`${formId}-end`}>
                        <input
                            id={`${formId}-end`}
                            disabled={unavailable.includes('scheduleEnd')} value={scheduleEnd}
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
                                disabled={unavailable.includes('budgetPs')} value={budgetPs}
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
                                disabled={unavailable.includes('budgetMooe')} value={budgetMooe}
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
                                disabled={unavailable.includes('budgetCo')} value={budgetCo}
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
                                disabled={unavailable.includes('ccaAmount')} value={ccaAmount}
                                onChange={(e) => setCcaAmount(e.target.value)}
                                placeholder="0"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <div className="flex flex-col justify-end gap-2 pb-1 text-xs font-semibold text-[var(--ink-primary)]">
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={unavailable.includes('gadAttributed')} checked={gadAttributed}
                                    onChange={(e) => setGadAttributed(e.target.checked)}
                                    className="h-4 w-4 rounded"
                                />
                                <span>GAD Attributed (5% GAD)</span>
                            </label>
                            <label className="inline-flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    disabled={unavailable.includes('drrmTagged')} checked={drrmTagged}
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
                        disabled={unavailable.includes('expectedOutputs')} value={expectedOutputs}
                        onChange={(e) => setExpectedOutputs(e.target.value)}
                        placeholder="Measurable deliverables (e.g., km of roads paved, households or beneficiaries served)…"
                        className="tcds-input py-2"
                    />
                </FormField>

                <FormField label="Implementation Context / Remarks" htmlFor={`${formId}-ctx`}>
                    <textarea
                        id={`${formId}-ctx`}
                        rows={2}
                        disabled={unavailable.includes('implementationContext')} value={implementationContext}
                        onChange={(e) => setImplementationContext(e.target.value)}
                        placeholder="Operational notes, coordination requirements, or site readiness context…"
                        className="tcds-input py-2"
                    />
                </FormField>
            </form>
        </Dialog>);
}
