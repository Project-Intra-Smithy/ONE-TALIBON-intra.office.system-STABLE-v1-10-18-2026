import PlanStudioView from '../../../../../resources/js/components/plans/PlanStudioView';
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

    return <PlanStudioView open={open} editing={editing} onClose={onClose} values={{code, title, horizon, coverageStart, coverageEnd, status, leadOffice, coordinatingInput, documentRef, authority, sbResolutionNo, sbAdoptedDate, mdcResolutionNo, higherReviewRef, sectionsComplete, sectionsTotal, nextMilestone, nextMilestoneDate, requiredAction, linkedMapIds}} onChange={(field, value) => { switch(field) { case 'code': setCode(value as string); break; case 'title': setTitle(value as string); break; case 'horizon': setHorizon(value as PlanHorizon); break; case 'coverageStart': setCoverageStart(value as string); break; case 'coverageEnd': setCoverageEnd(value as string); break; case 'status': setStatus(value as PlanStatus); break; case 'leadOffice': setLeadOffice(value as string); break; case 'coordinatingInput': setCoordinatingInput(value as string); break; case 'documentRef': setDocumentRef(value as string); break; case 'authority': setAuthority(value as string); break; case 'sbResolutionNo': setSbResolutionNo(value as string); break; case 'sbAdoptedDate': setSbAdoptedDate(value as string); break; case 'mdcResolutionNo': setMdcResolutionNo(value as string); break; case 'higherReviewRef': setHigherReviewRef(value as string); break; case 'sectionsComplete': setSectionsComplete(value as string); break; case 'sectionsTotal': setSectionsTotal(value as string); break; case 'nextMilestone': setNextMilestone(value as string); break; case 'nextMilestoneDate': setNextMilestoneDate(value as string); break; case 'requiredAction': setRequiredAction(value as string); break; case 'linkedMapIds': setLinkedMapIds(value as string[]); break; } }} onSubmit={handleSubmit} maps={DEFAULT_PLANNING_MAPS} horizons={HORIZONS} statuses={EDITABLE_STATUSES} />;
}
