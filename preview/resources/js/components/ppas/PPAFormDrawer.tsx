import PPAStudioView from '../../../../../resources/js/components/ppas/PPAStudioView';
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

    return <PPAStudioView open={open} editing={editing} officeProposalMode={officeProposalMode} actorOfficeName={actorOfficeName} onClose={onClose} values={{title, aipRefCode, sector, responsibleOffice, year, linkedPlanId, linkedMapId, fundingSource, status, priority, scheduleStart, scheduleEnd, barangaysInput, expectedOutputs, implementationContext, budgetPs, budgetMooe, budgetCo, ccaAmount, gadAttributed, drrmTagged}} onChange={(field,value)=>{switch(field){case 'title': setTitle(value as string); break; case 'aipRefCode': setAipRefCode(value as string); break; case 'sector': setSector(value as string); break; case 'responsibleOffice': setResponsibleOffice(value as string); break; case 'year': setYear(value as number); break; case 'linkedPlanId': setLinkedPlanId(value as string); break; case 'linkedMapId': setLinkedMapId(value as string); break; case 'fundingSource': setFundingSource(value as string); break; case 'status': setStatus(value as PPAStatus); break; case 'priority': setPriority(value as PPAPriority); break; case 'scheduleStart': setScheduleStart(value as string); break; case 'scheduleEnd': setScheduleEnd(value as string); break; case 'barangaysInput': setBarangaysInput(value as string); break; case 'expectedOutputs': setExpectedOutputs(value as string); break; case 'implementationContext': setImplementationContext(value as string); break; case 'budgetPs': setBudgetPs(value as string); break; case 'budgetMooe': setBudgetMooe(value as string); break; case 'budgetCo': setBudgetCo(value as string); break; case 'ccaAmount': setCcaAmount(value as string); break; case 'gadAttributed': setGadAttributed(value as boolean); break; case 'drrmTagged': setDrrmTagged(value as boolean); break;}}} onSubmit={handleSubmit} plans={plans} maps={DEFAULT_PLANNING_MAPS} sectors={ppaOptions.sectors} offices={ppaOptions.offices} statuses={allowedStatuses} />;
}
