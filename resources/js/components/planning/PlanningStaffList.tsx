import { UserCheck, UserMinus } from 'lucide-react';
import { StatusBadge } from '../ui';

export type PlanningStaffView = { id: string | number; name: string; detail: string; active: boolean; plans: boolean; ppas: boolean; maps: boolean };
export default function PlanningStaffList({ staff, busy = false, onToggle, onScope }: {
    staff: PlanningStaffView[]; busy?: boolean;
    onToggle: (id: string | number) => void;
    onScope?: (id: string | number, module: 'plans' | 'ppas' | 'maps') => void;
}) {
    return <ul className="divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
        {staff.map(member => <li key={member.id} className="space-y-3 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="break-words text-sm font-bold text-[var(--ink-primary)]">{member.name}</span><StatusBadge tone={member.active ? 'ok' : 'neutral'}>{member.active ? 'Editor Access' : 'View Only'}</StatusBadge></div><p className="mt-0.5 break-words text-xs text-[var(--ink-secondary)]">{member.detail}</p></div>
                <button type="button" disabled={busy} onClick={() => onToggle(member.id)} className={member.active ? 'municipal-secondary-button' : 'municipal-primary-button'}>{member.active ? <UserMinus size={15} aria-hidden="true" /> : <UserCheck size={15} aria-hidden="true" />}{member.active ? 'Revoke All' : 'Designate'}</button>
            </div>
            {onScope && <div role="group" aria-label={`Authorized sections for ${member.name}`} className="flex flex-wrap items-center gap-2 border-t border-[var(--border-default)] pt-2.5"><span className="text-xs font-semibold text-[var(--ink-secondary)]">Authorized sections:</span>{(['plans', 'ppas', 'maps'] as const).map(module => <button key={module} type="button" disabled={busy} aria-pressed={member.active && member[module]} onClick={() => onScope(member.id, module)} className={`min-h-11 rounded-full border px-3 text-xs font-semibold ${member.active && member[module] ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]' : 'border-[var(--border-control)] text-[var(--ink-secondary)]'}`}>{module === 'ppas' ? 'PPAs' : module === 'plans' ? 'Plans' : 'Maps'}</button>)}</div>}
        </li>)}
    </ul>;
}
