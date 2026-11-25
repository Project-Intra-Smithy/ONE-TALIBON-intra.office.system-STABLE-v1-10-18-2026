import { type FormEvent, useEffect, useId, useState } from 'react';
import { DEFAULT_PLANNING_MAPS } from '../../data/municipal/planningMaps';
import {
    planHorizons,
    type MunicipalPlan,
    type PlanHorizon,
    type PlanStatus,
} from '../../data/municipal/plans';
import { Button, DateInput, Dialog, FormField } from '../ui';

type Props = {
    open: boolean;
    editing: MunicipalPlan | null;
    actorName: string;
    onClose: () => void;
    onSave: (plan: MunicipalPlan) => void;
};

const EDITABLE_STATUSES: PlanStatus[] = [
    'Draft',
    'Updating',
    'For review',
    'Adopted',
    'In force',
    'Due this year',
    'Archived',
];

const HORIZONS = planHorizons.filter((h): h is PlanHorizon => h !== 'All');

export default function PlanFormDrawer({ open, editing, actorName, onClose, onSave }: Props) {
    const formId = useId();

    const [code, setCode] = useState('');
    const [title, setTitle] = useState('');
    const [horizon, setHorizon] = useState<PlanHorizon>('Three-year');
    const [coverageStart, setCoverageStart] = useState('2026');
    const [coverageEnd, setCoverageEnd] = useState('2028');
    const [status, setStatus] = useState<PlanStatus>('Draft');
    const [leadOffice, setLeadOffice] = useState('Municipal Planning and Development Office');
    const [coordinatingInput, setCoordinatingInput] = useState('Office of the Municipal Mayor, Municipal Budget Office');
    const [documentRef, setDocumentRef] = useState('');
    const [authority, setAuthority] = useState('Sangguniang Bayan adoption record on file');
    const [sbResolutionNo, setSbResolutionNo] = useState('');
    const [sbAdoptedDate, setSbAdoptedDate] = useState('');
    const [mdcResolutionNo, setMdcResolutionNo] = useState('');
    const [higherReviewRef, setHigherReviewRef] = useState('');
    const [sectionsComplete, setSectionsComplete] = useState('0');
    const [sectionsTotal, setSectionsTotal] = useState('12');
    const [nextMilestone, setNextMilestone] = useState('');
    const [nextMilestoneDate, setNextMilestoneDate] = useState('2026-12-01');
    const [requiredAction, setRequiredAction] = useState('');
    const [linkedMapIds, setLinkedMapIds] = useState<string[]>(['map-tal-base-2026']);

    useEffect(() => {
        if (!open) return;
        if (editing) {
            setCode(editing.code);
            setTitle(editing.title);
            setHorizon(editing.horizon);
            setCoverageStart(String(editing.coverageStart));
            setCoverageEnd(String(editing.coverageEnd));
            setStatus(editing.status);
            setLeadOffice(editing.leadOffice);
            setCoordinatingInput(editing.coordinatingOffices.join(', '));
            setDocumentRef(editing.documentRef);
            setAuthority(editing.authority);
            setSbResolutionNo(editing.sbResolutionNo || '');
            setSbAdoptedDate(editing.sbAdoptedDate || '');
            setMdcResolutionNo(editing.mdcResolutionNo || '');
            setHigherReviewRef(editing.higherReviewRef || '');
            setSectionsComplete(String(editing.sectionsComplete));
            setSectionsTotal(String(editing.sectionsTotal));
            setNextMilestone(editing.nextMilestone);
            setNextMilestoneDate(editing.nextMilestoneDate);
            setRequiredAction(editing.requiredAction);
            setLinkedMapIds(editing.linkedMapIds || []);
        } else {
            setCode('');
            setTitle('');
            setHorizon('Three-year');
            setCoverageStart('2027');
            setCoverageEnd('2029');
            setStatus('Draft');
            setLeadOffice('Municipal Planning and Development Office');
            setCoordinatingInput('Office of the Municipal Mayor, Municipal Budget Office');
            setDocumentRef('');
            setAuthority('Preparation cycle under the local planning calendar');
            setSbResolutionNo('');
            setSbAdoptedDate('');
            setMdcResolutionNo('');
            setHigherReviewRef('');
            setSectionsComplete('1');
            setSectionsTotal('10');
            setNextMilestone('Technical drafting & sectoral consultation');
            setNextMilestoneDate('2026-12-15');
            setRequiredAction('Coordinate sectoral focal offices for baseline validation.');
            setLinkedMapIds(['map-tal-base-2026']);
        }
    }, [open, editing]);

    const toggleMapLink = (mapId: string) => {
        setLinkedMapIds((prev) =>
            prev.includes(mapId) ? prev.filter((id) => id !== mapId) : [...prev, mapId],
        );
    };

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        if (!code.trim() || !title.trim()) return;

        const start = Number(coverageStart) || 2027;
        const end = Math.max(start, Number(coverageEnd) || start);
        const totalSec = Math.max(1, Number(sectionsTotal) || 10);
        const compSec = Math.min(totalSec, Math.max(0, Number(sectionsComplete) || 0));
        const today = new Date().toISOString().slice(0, 10);

        const nextPlan: MunicipalPlan = {
            id:
                editing?.id ||
                `plan-${code.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36).slice(-4)}`,
            code: code.trim(),
            title: title.trim(),
            horizon,
            leadOffice: leadOffice.trim() || 'Municipal Planning and Development Office',
            coordinatingOffices: coordinatingInput
                .split(',')
                .map((s) => s.trim())
                .filter(Boolean),
            coverageStart: start,
            coverageEnd: end,
            status,
            sectionsComplete: compSec,
            sectionsTotal: totalSec,
            lastAction: editing ? 'Plan details updated via MPDO registry' : 'Plan entry registered in LGU Plans Library',
            lastActionDate: today,
            nextMilestone: nextMilestone.trim() || 'Scheduled technical review',
            nextMilestoneDate: nextMilestoneDate || today,
            requiredAction: requiredAction.trim() || 'Lead office to complete sectoral inputs and supporting documents.',
            authority: authority.trim() || 'Municipal planning record',
            documentRef: documentRef.trim() || `MPDO-PLAN-${start}`,
            sbResolutionNo: sbResolutionNo.trim() || undefined,
            sbAdoptedDate: sbAdoptedDate || undefined,
            mdcResolutionNo: mdcResolutionNo.trim() || undefined,
            higherReviewRef: higherReviewRef.trim() || undefined,
            linkedMapIds,
            chapterNotes: editing?.chapterNotes,
            updatedAt: today,
            updatedBy: actorName,
        };

        onSave(nextPlan);
        onClose();
    };

    return (
        <Dialog
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
                    <Button type="submit" form={formId} size="sm">
                        {editing ? 'Save plan changes' : 'Create plan'}
                    </Button>
                </div>
            }
        >
            <form id={formId} onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3.5 sm:grid-cols-2">
                    <FormField label="Plan Code & Period" htmlFor={`${formId}-code`} required>
                        <input
                            id={`${formId}-code`}
                            required
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            placeholder="e.g., AIP 2028 or CDP 2029–2034"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Planning Horizon" htmlFor={`${formId}-horizon`} required>
                        <select
                            id={`${formId}-horizon`}
                            value={horizon}
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
                            value={title}
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
                            value={coverageStart}
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
                            value={coverageEnd}
                            onChange={(e) => setCoverageEnd(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Lifecycle Status" htmlFor={`${formId}-status`} required>
                        <select
                            id={`${formId}-status`}
                            value={status}
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
                            value={documentRef}
                            onChange={(e) => setDocumentRef(e.target.value)}
                            placeholder="MPDO-PLAN-2027-01"
                            className="tcds-input font-mono"
                        />
                    </FormField>

                    <FormField label="Lead Office" htmlFor={`${formId}-lead`} required className="sm:col-span-2">
                        <input
                            id={`${formId}-lead`}
                            required
                            value={leadOffice}
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
                            value={coordinatingInput}
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
                                value={sbResolutionNo}
                                onChange={(e) => setSbResolutionNo(e.target.value)}
                                placeholder="SB Res. No. 2026-045"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="SB Adoption Date" htmlFor={`${formId}-sbdate`} optional>
                            <DateInput id={`${formId}-sbdate`} value={sbAdoptedDate} onChange={setSbAdoptedDate} />
                        </FormField>
                        <FormField label="MDC Endorsement Ref." htmlFor={`${formId}-mdc`} optional>
                            <input
                                id={`${formId}-mdc`}
                                value={mdcResolutionNo}
                                onChange={(e) => setMdcResolutionNo(e.target.value)}
                                placeholder="MDC Res. No. 2026-012"
                                className="tcds-input font-mono"
                            />
                        </FormField>
                        <FormField label="SP / DHSUD / DILG Concurrence" htmlFor={`${formId}-higher`} optional>
                            <input
                                id={`${formId}-higher`}
                                value={higherReviewRef}
                                onChange={(e) => setHigherReviewRef(e.target.value)}
                                placeholder="SP Bohol / DILG review status"
                                className="tcds-input"
                            />
                        </FormField>
                        <FormField label="Authority Summary" htmlFor={`${formId}-auth`} className="sm:col-span-2">
                            <input
                                id={`${formId}-auth`}
                                value={authority}
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
                            value={sectionsComplete}
                            onChange={(e) => setSectionsComplete(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>
                    <FormField label="Total Chapters / Sections" htmlFor={`${formId}-sec-total`}>
                        <input
                            id={`${formId}-sec-total`}
                            type="number"
                            min="1"
                            value={sectionsTotal}
                            onChange={(e) => setSectionsTotal(e.target.value)}
                            className="tcds-input font-mono"
                        />
                    </FormField>
                    <FormField label="Next Milestone" htmlFor={`${formId}-mile`}>
                        <input
                            id={`${formId}-mile`}
                            value={nextMilestone}
                            onChange={(e) => setNextMilestone(e.target.value)}
                            className="tcds-input"
                        />
                    </FormField>
                    <FormField label="Milestone Target Date" htmlFor={`${formId}-mdate`}>
                        <DateInput id={`${formId}-mdate`} value={nextMilestoneDate} onChange={setNextMilestoneDate} />
                    </FormField>
                    <FormField label="Required Next Action" htmlFor={`${formId}-req`} className="sm:col-span-2">
                        <textarea
                            id={`${formId}-req`}
                            rows={2}
                            value={requiredAction}
                            onChange={(e) => setRequiredAction(e.target.value)}
                            className="tcds-input py-2"
                        />
                    </FormField>
                </div>

                <fieldset className="space-y-2 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
                    <legend className="px-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        Linked Spatial Planning Maps
                    </legend>
                    <div className="flex flex-wrap gap-2">
                        {DEFAULT_PLANNING_MAPS.map((map) => {
                            const active = linkedMapIds.includes(map.id);
                            return (
                                <button
                                    key={map.id}
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
        </Dialog>
    );
}
