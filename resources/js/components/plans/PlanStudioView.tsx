import { type FormEvent, useId } from 'react';
import { Button, DateInput, Dialog, FormField } from '../ui';
type PlanHorizon = string;
type PlanStatus = string;
export type PlanStudioValues = {
    code: string;
    title: string;
    horizon: string;
    coverageStart: string;
    coverageEnd: string;
    status: string;
    leadOffice: string;
    coordinatingInput: string;
    documentRef: string;
    authority: string;
    sbResolutionNo: string;
    sbAdoptedDate: string;
    mdcResolutionNo: string;
    higherReviewRef: string;
    sectionsComplete: string;
    sectionsTotal: string;
    nextMilestone: string;
    nextMilestoneDate: string;
    requiredAction: string;
    linkedMapIds: string[];
};
export default function PlanStudioView({ open, editing, onClose, values, onChange, onSubmit: handleSubmit, maps: DEFAULT_PLANNING_MAPS, horizons: HORIZONS, statuses: EDITABLE_STATUSES, unavailable = [], busy = false, error }: {
    open: boolean; editing: { code: string } | null; onClose: () => void;
    values: PlanStudioValues; onChange: (field: keyof PlanStudioValues, value: string | string[]) => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    maps: Array<{id: string; code: string}>; horizons: string[]; statuses: string[];
    unavailable?: Array<keyof PlanStudioValues>; busy?: boolean; error?: string;
}) {
    const formId = useId();
    const { code, title, horizon, coverageStart, coverageEnd, status, leadOffice, coordinatingInput, documentRef, authority, sbResolutionNo, sbAdoptedDate, mdcResolutionNo, higherReviewRef, sectionsComplete, sectionsTotal, nextMilestone, nextMilestoneDate, requiredAction, linkedMapIds } = values;
    const setCode = (value: string) => onChange('code', value);
    const setTitle = (value: string) => onChange('title', value);
    const setHorizon = (value: string) => onChange('horizon', value);
    const setCoverageStart = (value: string) => onChange('coverageStart', value);
    const setCoverageEnd = (value: string) => onChange('coverageEnd', value);
    const setStatus = (value: string) => onChange('status', value);
    const setLeadOffice = (value: string) => onChange('leadOffice', value);
    const setCoordinatingInput = (value: string) => onChange('coordinatingInput', value);
    const setDocumentRef = (value: string) => onChange('documentRef', value);
    const setAuthority = (value: string) => onChange('authority', value);
    const setSbResolutionNo = (value: string) => onChange('sbResolutionNo', value);
    const setSbAdoptedDate = (value: string) => onChange('sbAdoptedDate', value);
    const setMdcResolutionNo = (value: string) => onChange('mdcResolutionNo', value);
    const setHigherReviewRef = (value: string) => onChange('higherReviewRef', value);
    const setSectionsComplete = (value: string) => onChange('sectionsComplete', value);
    const setSectionsTotal = (value: string) => onChange('sectionsTotal', value);
    const setNextMilestone = (value: string) => onChange('nextMilestone', value);
    const setNextMilestoneDate = (value: string) => onChange('nextMilestoneDate', value);
    const setRequiredAction = (value: string) => onChange('requiredAction', value);
    const setLinkedMapIds = (value: string[]) => onChange('linkedMapIds', value);
    const toggleMapLink = (id: string) => setLinkedMapIds(linkedMapIds.includes(id) ? linkedMapIds.filter(value => value !== id) : [...linkedMapIds, id]);
    return (<Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title={editing ? `Edit ${editing.code}` : 'Add Development Plan'}
            description="Register or update a municipal plan with legal adoption records, review status, chapter progress, and linked spatial maps."
            footer={
                <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" form={formId} size="sm" disabled={busy}>
                        {editing ? 'Save plan changes' : 'Create plan'}
                    </Button>
                </div>
            }
        >
            <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                {error && <p role="alert" className="rounded-lg border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] p-3 text-sm text-[var(--status-danger-fg)]">{error}</p>}
                <div className="grid gap-3.5 sm:grid-cols-2">
                    <FormField label="Plan Code & Period" htmlFor={`${formId}-code`} required>
                        <input
                            id={`${formId}-code`}
                            required
                            disabled={unavailable.includes('code')} value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., AIP 2028 or CDP 2029–2034"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Planning Horizon" htmlFor={`${formId}-horizon`} required>
                        <select
                            id={`${formId}-horizon`}
                            disabled={unavailable.includes('horizon')} value={horizon}
                            onChange={(e) => setHorizon(e.target.value as PlanHorizon)}
                            className="tcds-input"
                        >
                            {HORIZONS.map((h) => (
                                <option key={h} value={h}>{h}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Official Plan Title" htmlFor={`${formId}-title`} required className="sm:col-span-2">
                        <input
                            id={`${formId}-title`}
                            required
                            disabled={unavailable.includes('title')} value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Local Coastal & Marine Development Plan"
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField label="Coverage Start Year" htmlFor={`${formId}-start`} required>
                        <input
                            id={`${formId}-start`}
                            type="number"
                            min="2015"
                            max="2045"
                            disabled={unavailable.includes('coverageStart')} value={coverageStart}
                            onChange={(e) => setCoverageStart(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Coverage End Year" htmlFor={`${formId}-end`} required>
                        <input
                            id={`${formId}-end`}
                            type="number"
                            min="2015"
                            max="2050"
                            disabled={unavailable.includes('coverageEnd')} value={coverageEnd}
                            onChange={(e) => setCoverageEnd(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Lifecycle Status" htmlFor={`${formId}-status`} required>
                        <select
                            id={`${formId}-status`}
                            disabled={unavailable.includes('status')} value={status}
                            onChange={(e) => setStatus(e.target.value as PlanStatus)}
                            className="tcds-input"
                        >
                            {EDITABLE_STATUSES.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField label="Document Control Ref." htmlFor={`${formId}-docref`} required>
                        <input
                            id={`${formId}-docref`}
                            required
                            disabled={unavailable.includes('documentRef')} value={documentRef}
                            onChange={(e) => setDocumentRef(e.target.value)}
                            placeholder="MPDO-PLAN-2027-01"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Lead Office" htmlFor={`${formId}-lead`} required className="sm:col-span-2">
                        <input
                            id={`${formId}-lead`}
                            required
                            disabled={unavailable.includes('leadOffice')} value={leadOffice}
                            onChange={(e) => setLeadOffice(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>

                    <FormField
                        label="Coordinating Offices"
                        htmlFor={`${formId}-coord`}
                        hint="Comma-separated"
                        className="sm:col-span-2"
                    >
                        <input
                            id={`${formId}-coord`}
                            disabled={unavailable.includes('coordinatingInput')} value={coordinatingInput}
                            onChange={(e) => setCoordinatingInput(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                </div>

                <fieldset className="space-y-3 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        Legal Adoption &amp; Higher-LGU Review
                    </legend>
                    <div className="grid gap-3 sm:grid-cols-2">
                        <FormField label="SB Adoption Resolution / Ord." htmlFor={`${formId}-sb`} optional>
                            <input
                                id={`${formId}-sb`}
                                disabled={unavailable.includes('sbResolutionNo')} value={sbResolutionNo}
                                onChange={(e) => setSbResolutionNo(e.target.value)}
                                placeholder="SB Res. No. 2026-045"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="SB Adoption Date" htmlFor={`${formId}-sbdate`} optional>
                            <DateInput id={`${formId}-sbdate`} disabled={unavailable.includes('sbAdoptedDate')} value={sbAdoptedDate} onChange={setSbAdoptedDate} />
                        </FormField>
                        <FormField label="MDC Endorsement Ref." htmlFor={`${formId}-mdc`} optional>
                            <input
                                id={`${formId}-mdc`}
                                disabled={unavailable.includes('mdcResolutionNo')} value={mdcResolutionNo}
                                onChange={(e) => setMdcResolutionNo(e.target.value)}
                                placeholder="MDC Res. No. 2026-012"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="SP / DHSUD / DILG Concurrence" htmlFor={`${formId}-higher`} optional>
                            <input
                                id={`${formId}-higher`}
                                disabled={unavailable.includes('higherReviewRef')} value={higherReviewRef}
                                onChange={(e) => setHigherReviewRef(e.target.value)}
                                placeholder="SP Bohol / DILG review status"
                                className="tcds-input"
                            />
                        </FormField>
                        <FormField label="Authority Summary" htmlFor={`${formId}-auth`} className="sm:col-span-2">
                            <input
                                id={`${formId}-auth`}
                                disabled={unavailable.includes('authority')} value={authority}
                                onChange={(e) => setAuthority(e.target.value)}
                                className="tcds-input"
                            />
                        </FormField>
                    </div>
                </fieldset>

                <div className="grid gap-3.5 sm:grid-cols-2">
                    <FormField label="Completed Chapters / Sections" htmlFor={`${formId}-sec-done`}>
                        <input
                            id={`${formId}-sec-done`}
                            type="number"
                            min="0"
                            disabled={unavailable.includes('sectionsComplete')} value={sectionsComplete}
                            onChange={(e) => setSectionsComplete(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>
                    <FormField label="Total Chapters / Sections" htmlFor={`${formId}-sec-total`}>
                        <input
                            id={`${formId}-sec-total`}
                            type="number"
                            min="1"
                            disabled={unavailable.includes('sectionsTotal')} value={sectionsTotal}
                            onChange={(e) => setSectionsTotal(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>
                    <FormField label="Next Milestone" htmlFor={`${formId}-mile`}>
                        <input
                            id={`${formId}-mile`}
                            disabled={unavailable.includes('nextMilestone')} value={nextMilestone}
                            onChange={(e) => setNextMilestone(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Milestone Target Date" htmlFor={`${formId}-mdate`}>
                        <DateInput id={`${formId}-mdate`} disabled={unavailable.includes('nextMilestoneDate')} value={nextMilestoneDate} onChange={setNextMilestoneDate} />
                    </FormField>
                    <FormField label="Required Next Action" htmlFor={`${formId}-req`} className="sm:col-span-2">
                        <textarea
                            id={`${formId}-req`}
                            rows={2}
                            disabled={unavailable.includes('requiredAction')} value={requiredAction}
                            onChange={(e) => setRequiredAction(e.target.value)}
                            className="tcds-input py-2"
                        />
                    </FormField>
                </div>

                <fieldset className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        Linked Spatial Planning Maps
                    </legend>
                    {DEFAULT_PLANNING_MAPS.length === 0 && <p className="text-xs text-[var(--ink-secondary)]">Verified map associations are unavailable in the current server contract.</p>}
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_PLANNING_MAPS.map((map) => {
                            const active = linkedMapIds.includes(map.id);
                            return (
                                <button
                                    key={map.id} disabled={unavailable.includes('linkedMapIds')}
                                    type="button"
                                    aria-pressed={active}
                                    onClick={() => toggleMapLink(map.id)}
                                    className={`inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors ${
                                        active
                                            ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                            : 'border-[var(--border-control)] bg-[var(--surface-card)] text-[var(--ink-secondary)]'
                                    }`}
                                >
                                    <span>{map.code}</span>
                                </button>
                            );
                        })}
                    </div>
                </fieldset>
            </form>
        </Dialog>);
}
