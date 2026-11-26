import type {ReactNode} from 'react';
import PpaPlanMapLinks from './PpaPlanMapLinks';
import { useState } from 'react';
import { Link } from '@inertiajs/react';
import type { PPARecord } from '../../data/municipal/ppas.types';
import type { PlanningPermissions } from '../../pages/Plans/Index';
import PlanDossierPresentation from '../plans/PlanDossierPresentation';
import PpaOverview from './PpaOverview';
import SupportingDocsPanel, { type ServerPlanningAttachment } from '../planning/SupportingDocsPanel';
import { Button, StatusBadge, toneForWorkState } from '../ui';

type Props={managementActions?:ReactNode;onEdit?:(record:PPARecord)=>void;record:PPARecord|null;onClose:()=>void;attachments?:ServerPlanningAttachment[];planningPermissions?:PlanningPermissions;currentIndex?:number;totalCount?:number;onPrev?:()=>void;onNext?:()=>void};
export default function PPADetailPanel({managementActions,onEdit,record,onClose,attachments=[],planningPermissions,currentIndex,totalCount,onPrev,onNext}:Props){
    const [activeSection,setActiveSection]=useState('overview');
    if(!record)return null;
    const canUploadToPpa=Boolean(planningPermissions?.canManagePpas || (planningPermissions?.canProposeOfficePpa && (record.implementingDepartmentId===planningPermissions.actorDepartmentId || record.responsibleOffice.toLowerCase()===(planningPermissions.actorDepartmentName??'').toLowerCase())));
    const canEdit=Boolean(record.dbId&&(planningPermissions?.canManagePpas||(planningPermissions?.canProposeOfficePpa&&['Draft','Planned'].includes(record.rawStatus??record.status)&&(record.implementingDepartmentId===planningPermissions.actorDepartmentId||record.responsibleOffice.toLowerCase()===(planningPermissions.actorDepartmentName??'').toLowerCase()))));
    return <PlanDossierPresentation activeSection={activeSection} onSectionChange={setActiveSection} id="selected-ppa-detail" key={record.id} open onClose={onClose} title={record.title} description={`${record.id} / ${record.year}${record.aipReferenceCode ? ' · AIP '+record.aipReferenceCode : ''}`} sectionLabel="PPA dossier sections"
        footer={<div className="flex w-full flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Button variant="secondary" disabled={!onPrev} onClick={onPrev}>Previous PPA</Button><span className="text-xs">{currentIndex!==undefined&&totalCount ? `${currentIndex+1} of ${totalCount}` : 'Selected record'}</span><Button variant="secondary" disabled={!onNext} onClick={onNext}>Next PPA</Button></div><div className="flex flex-wrap gap-2">{managementActions}{canEdit&&onEdit&&<Button variant="secondary" onClick={()=>onEdit(record)}>Edit PPA</Button>}<Button variant="secondary" onClick={onClose}>Close details</Button></div></div>}
        sections={[
            {key:'overview',label:'Overview & Budget',content:<section aria-label="Selected PPA details" className="space-y-4">
                <p role="note" className="text-xs text-[var(--ink-secondary)]">Reference record · Not verified live implementation progress</p>
                <div className="flex flex-wrap gap-2"><StatusBadge tone={toneForWorkState(record.status)}>{record.status}</StatusBadge><StatusBadge tone="neutral">{record.sector}</StatusBadge><StatusBadge tone="neutral">{record.priority} priority</StatusBadge>{record.gadAttributed&&<StatusBadge tone="info">GAD</StatusBadge>}{record.drrmTagged&&<StatusBadge tone="warn">DRRM</StatusBadge>}</div>
                <PpaOverview record={{implementationContext:record.implementationContext,fundingSource:record.fundingSource,budgetPs:record.psAmount,budgetMooe:record.mooeAmount,budgetCo:record.coAmount,budgetTotal:record.appropriationAmount,ccaAmount:record.climateAdaptationAmount,ccmAmount:record.climateMitigationAmount,responsibleOffice:record.responsibleOffice}} />
                <dl className="grid gap-3 sm:grid-cols-2">{[['Related projects',record.relatedProjectCount],['Target quarter',record.targetQuarter??'Not supplied'],['Barangay',record.barangay??'Not supplied'],['Location',record.location??'Not supplied']].map(([label,value])=><div key={String(label)} className="rounded-xl border border-[var(--border-default)] p-3"><dt className="text-xs font-bold text-[var(--ink-secondary)]">{label}</dt><dd className="mt-1 text-sm">{value}</dd></div>)}</dl>
            </section>},
            {key:'links',label:'Plan, Map & Location',content:<PpaPlanMapLinks plan={{title:record.relatedDevelopmentPlan,href:`/development-plans?search=${encodeURIComponent(record.relatedDevelopmentPlan)}`}} map={{title:record.mapCode??'Spatial-map reference not supplied',href:`/planning-maps?search=${encodeURIComponent(record.mapCode??record.relatedDevelopmentPlan)}`}} barangays={record.barangay?[record.barangay]:undefined} documentCount={attachments.filter(item=>item.parentType==='ppa'&&item.parentCode===record.id).length} onDocuments={()=>setActiveSection('docs')} />},
            {key:'docs',label:'Supporting Docs',content:<SupportingDocsPanel parentType="ppa" parentCode={record.id} attachments={attachments} canUpload={canUploadToPpa} canManageExecutive={Boolean(planningPermissions?.canViewExecutiveAttachments)} canDelete={Boolean(planningPermissions?.isMpdcHead)} />},
        ]}
    />;
}
