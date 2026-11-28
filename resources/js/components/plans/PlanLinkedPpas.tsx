import { planningAmount, planningTotal } from '../../lib/planningMoney';
import { Link } from '@inertiajs/react';
import { ArrowUpRight } from 'lucide-react';

export type LinkedPpa = {id:string;title:string;office:string;budget?:number|string|null;href:string};
const currency=(amount:number)=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP',maximumFractionDigits:0}).format(amount);
export default function PlanLinkedPpas({planCode,records,registerHref}:{planCode:string;records?:LinkedPpa[];registerHref:string}) {
    const completeBudget=records?.every(record=>record.budget!==undefined&&record.budget!==null);
    return <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] px-4 py-3 text-xs">
            <span className="font-semibold text-[var(--ink-primary)]">{records ? <><strong>{records.length}</strong> PPAs aligned with <strong>{planCode}</strong></> : <>Verified PPA links for <strong>{planCode}</strong> are unavailable</>}</span>
            <span className="font-mono font-bold text-[var(--brand-ink)]">Indicative Rollup: {completeBudget&&records ? planningTotal(records.map(record=>String(record.budget))) : 'Unavailable'}</span>
        </div>
        {!records?.length ? <div className="rounded-xl border border-dashed border-[var(--border-control)] bg-[var(--surface-recessed)] p-6 text-center text-xs text-[var(--ink-secondary)]">{records ? `No PPA entries are currently linked to ${planCode}.` : 'The current record does not supply verified plan-to-PPA relationships. Search the authorized register by plan reference.'}</div> : <ul className="divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)]">{records.slice(0,12).map(record=><li key={record.id} className="flex flex-wrap items-center justify-between gap-3 p-3.5"><div className="min-w-0"><p className="font-mono text-xs font-bold text-[var(--brand-ink)]">{record.id}</p><h3 className="mt-1 break-words text-sm font-bold">{record.title}</h3><p className="mt-1 text-xs text-[var(--ink-secondary)]">{record.office}</p></div><div className="flex flex-wrap items-center gap-3"><span className="font-mono text-xs font-bold">{record.budget===undefined?'Budget unavailable':typeof record.budget==='number'?currency(record.budget):planningAmount(record.budget)}</span><Link href={record.href} className="municipal-secondary-button">View PPA<ArrowUpRight size={13} aria-hidden="true" /></Link></div></li>)}</ul>}
        <div className="flex justify-end"><Link href={registerHref} className="municipal-secondary-button">{records&&records.length>12?`View all ${records.length} PPAs in Register`:'Open PPA Register'}<ArrowUpRight size={14} aria-hidden="true" /></Link></div>
    </div>;
}
