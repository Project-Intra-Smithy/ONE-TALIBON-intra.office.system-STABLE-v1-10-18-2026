import PlanningDeleteAction from '../../components/planning/PlanningDeleteAction';
import { Link, router } from '@inertiajs/react';
import { ClipboardList, Download, Plus } from 'lucide-react';
import { type FormEvent, useMemo, useState } from 'react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import type { ServerPlanningAttachment } from '../../components/planning/SupportingDocsPanel';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import PPAStudioView from '../../components/ppas/PPAStudioView';
import PPADetailPanel from '../../components/ppas/PPADetailPanel';
import PPAFilters from '../../components/ppas/PPAFilters';
import PPARegister from '../../components/ppas/PPARegister';
import PPASummary from '../../components/ppas/PPASummary';
import Button from '../../components/ui/Button';
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
    const [editingPpa,setEditingPpa]=useState<PPARecord|null>(null);
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
    const [submissionError,setSubmissionError]=useState('');
    const [recordFields, setRecordFields] = useState<Record<string, string>>({});

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

    const openPpaStudio = (record:PPARecord|null) => {
        setEditingPpa(record);setSubmissionError('');setSelected(null);
        setTitle(record?.title??'');setSector(record?.sector??'Infrastructure');
        setResponsibleOffice(record?.responsibleOffice??planningPermissions?.actorDepartmentName??'');
        setYear(String(record?.year??2027));setRelatedPlan(record?.relatedDevelopmentPlan??'');
        setFundingSource(record?.fundingSource??'20% Development Fund');setStatus(record?.rawStatus??record?.status??'Planned');
        setMooeAmount(String(record?.mooeAmount??0));setCoAmount(String(record?.coAmount??0));setBarangay(record?.barangay??'');
        setAipCode(record?.aipReferenceCode??'');setGadAttributed(record?.gadAttributed??false);setDrrmTagged(record?.drrmTagged??false);setContext(record?.implementationContext??'');
        setRecordFields(record?{ps_amount:String(record.psAmount??0),climate_adaptation_amount:String(record.climateAdaptationAmount??0),climate_mitigation_amount:String(record.climateMitigationAmount??0),priority:record.priority,map_code:record.mapCode??'',target_quarter:record.targetQuarter??''}:{});
        setShowCreateModal(true);
    };

    const handleSubmitPpa = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!title.trim() || busy) return;
        setSubmissionError('');
        setBusy(true);
        const data = {
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
                ps_amount: recordFields.ps_amount ? Number(recordFields.ps_amount) : undefined,
                climate_adaptation_amount: recordFields.climate_adaptation_amount ? Number(recordFields.climate_adaptation_amount) : undefined,
                climate_mitigation_amount: recordFields.climate_mitigation_amount ? Number(recordFields.climate_mitigation_amount) : undefined,
                map_code: recordFields.map_code || undefined,
                target_quarter: recordFields.target_quarter || undefined,
                priority: recordFields.priority || undefined,
            };
        const options = {
                preserveScroll: true,
                onSuccess: () => {
                    setTitle('');
                    setContext('');
                    setAipCode('');
                    setShowCreateModal(false);
                },
                onError: (errors:Record<string,string>)=>setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
            };
        if(editingPpa?.dbId) router.put(`/ppas/${editingPpa.dbId}`,data,options);
        else router.post('/ppas',data,options);
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
                            {planningPermissions?.canDesignateStaff&&<Link href="/development-plans?staff=1" className="municipal-secondary-button">Staff Scopes</Link>}
                            {canSubmitPpa && (
                                <Button
                                    type="button"
                                    variant="primary"
                                    size="sm"
                                    icon={<Plus className="h-3.5 w-3.5" />}
                                    onClick={() => openPpaStudio(null)}
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
                    options={{offices:[...new Set(ppaRecords.map(record=>record.responsibleOffice))].sort(),years:[...new Set(ppaRecords.map(record=>record.year))].sort(),statuses:[...new Set(ppaRecords.map(record=>record.status))].sort(),sectors:[...new Set(ppaRecords.map(record=>record.sector))].sort(),fundingSources:[...new Set(ppaRecords.map(record=>record.fundingSource))].sort()}}
                    planOptions={[...new Set(ppaRecords.map(record=>record.relatedDevelopmentPlan))].sort().map(reference=>({value:reference,label:reference}))}
                    onChange={(next) => {
                        setFilters(next);
                        setSelected(null);
                    }}
                />
                <div
                    className="ot-r6-ppa-layout"
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
                            docCountsByPpa={Object.fromEntries(records.map(record=>[record.id,attachments.filter(attachment=>attachment.parentType==='ppa'&&attachment.parentCode===record.id).length]))}
                            selectedId={selected?.id}
                            onSelect={setSelected}
                        />
                    </section>
                    {selected ? (
                        <PPADetailPanel managementActions={selected&&planningPermissions?.canDelete&&selected.dbId?<><PlanningDeleteAction title={selected.id} busy={busy} disabledReason={selected.provenanceStatus==='reference_sample'||!['Draft','Planned'].includes(selected.rawStatus??selected.status)?'Only non-reference draft or planned proposals can be deleted.':undefined} onDelete={()=>{setBusy(true);setSubmissionError('');router.delete(`/ppas/${selected.dbId}`,{preserveScroll:true,onSuccess:()=>setSelected(null),onError:errors=>setSubmissionError(Object.values(errors).join(' ')),onFinish:()=>setBusy(false)});}} />{submissionError&&<p role="alert" className="text-xs text-[var(--status-danger-fg)]">{submissionError}</p>}</>:undefined} onEdit={record=>openPpaStudio(record)}
                            record={selected}
                            currentIndex={records.findIndex(record=>record.id===selected.id)}
                            totalCount={records.length}
                            onPrev={records.findIndex(record=>record.id===selected.id)>0 ? ()=>setSelected(records[records.findIndex(record=>record.id===selected.id)-1]) : undefined}
                            onNext={records.findIndex(record=>record.id===selected.id)<records.length-1 ? ()=>setSelected(records[records.findIndex(record=>record.id===selected.id)+1]) : undefined}
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

            <PPAStudioView error={submissionError} open={showCreateModal} editing={editingPpa} officeProposalMode={!planningPermissions?.canManagePpas} actorOfficeName={planningPermissions?.actorDepartmentName ?? ''} officeInputMode lockAipCode={false} onClose={() => setShowCreateModal(false)} busy={busy}
                values={{title, aipRefCode:aipCode, sector, responsibleOffice, year:Number(year), linkedPlanId:'', linkedMapId:'', fundingSource, status, priority:recordFields.priority ?? 'Medium', scheduleStart:'', scheduleEnd:'', barangaysInput:barangay, expectedOutputs:'', implementationContext:context, budgetPs:recordFields.ps_amount ?? '0', budgetMooe:mooeAmount, budgetCo:coAmount, ccaAmount:recordFields.climate_adaptation_amount ?? '', gadAttributed, drrmTagged}}
                onChange={(field,value)=>{
                    const text = String(value);
                    const setters: Record<string,(value:string)=>void> = {title:setTitle,aipRefCode:setAipCode,sector:setSector,responsibleOffice:setResponsibleOffice,year:setYear,fundingSource:setFundingSource,status:setStatus,barangaysInput:setBarangay,implementationContext:setContext,budgetMooe:setMooeAmount,budgetCo:setCoAmount};
                    if(setters[field]) {setters[field](text);return;}
                    if(field==='gadAttributed') {setGadAttributed(Boolean(value));return;}
                    if(field==='drrmTagged') {setDrrmTagged(Boolean(value));return;}
                    const keys:Record<string,string> = {priority:'priority',budgetPs:'ps_amount',ccaAmount:'climate_adaptation_amount'};
                    if(keys[field]) setRecordFields(fields=>({...fields,[keys[field]]:text}));
                }}
                onSubmit={handleSubmitPpa} plans={[]} maps={[]} sectors={['Infrastructure','Agriculture','Fisheries','Environment','Economic','Health','Social Protection','Disaster Risk Reduction','Youth','Tourism','Employment','Governance']} offices={[]}
                statuses={planningPermissions?.canManagePpas ? ['Draft','Planned','For Procurement','Ongoing',...(planningPermissions?.canPublishOrArchive ? ['Completed','On Hold'] : [])] : ['Draft','Planned']}
                unavailable={['linkedPlanId','linkedMapId','scheduleStart','scheduleEnd','expectedOutputs']}
                referenceFields={<div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-xs font-semibold">Related Development Plan Reference<input required value={relatedPlan} onChange={event=>setRelatedPlan(event.target.value)} className="tcds-input mt-1" /></label>
                    {([['map_code','Map Reference Code'],['target_quarter','Target Quarter'],['climate_mitigation_amount','Climate Mitigation Amount']] as const).map(([name,label])=><label key={name} className="text-xs font-semibold">{label}<input type={name==='climate_mitigation_amount'?'number':'text'} min={0} step={name==='climate_mitigation_amount'?'0.01':undefined} value={recordFields[name]??''} onChange={event=>setRecordFields(fields=>({...fields,[name]:event.target.value}))} className="tcds-input mt-1" /></label>)}
                </div>}
            />
        </AppLayout>
    );
}
