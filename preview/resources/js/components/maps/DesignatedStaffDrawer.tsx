import { ShieldCheck, UserCheck, UserMinus } from 'lucide-react';
import type { PlanningModule } from '../../data/municipal/planningGovernance';
import type { DesignatedPlanningStaff } from '../../data/municipal/planningMaps';
import { Button, Dialog, StatusBadge } from '../ui';

type Props = {
    open: boolean;
    staff: DesignatedPlanningStaff[];
    headName: string;
    contextModule?: PlanningModule;
    onClose: () => void;
    onToggleStaff: (id: string) => void;
    onToggleModuleScope?: (id: string, module: PlanningModule) => void;
};

const MODULE_LABELS: Array<{ key: PlanningModule; field: 'canManagePlans' | 'canManagePpas' | 'canManageMaps'; label: string }> = [
    { key: 'plans', field: 'canManagePlans', label: 'Plans' },
    { key: 'ppas', field: 'canManagePpas', label: 'PPAs' },
    { key: 'maps', field: 'canManageMaps', label: 'Maps' },
];

export default function DesignatedStaffDrawer({
    open,
    staff,
    headName,
    contextModule = 'maps',
    onClose,
    onToggleStaff,
    onToggleModuleScope,
}: Props) {
    const activeCount = staff.filter((member) => member.active).length;
    const scopedCount = staff.filter((member) => {
        if (!member.active) return false;
        if (contextModule === 'plans') return member.canManagePlans ?? true;
        if (contextModule === 'ppas') return member.canManagePpas ?? true;
        return member.canManageMaps ?? true;
    }).length;

    const moduleTitle =
        contextModule === 'plans'
            ? 'Development Plans'
            : contextModule === 'ppas'
              ? 'PPAs'
              : 'Planning Maps';

    return (
        <Dialog
            open={open}
            onClose={onClose}
            variant="drawer-right"
            title="MPDC Designated Planning Personnel"
            description="Authorize MPDC staff by planning section (Development Plans, PPAs, and Planning Maps) to add, edit, attach documents, publish, and archive records. Permanent deletion and staff authorization remain with the MPDC Head."
            footer={<Button onClick={onClose}>Done</Button>}
        >
            <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-xl border border-[var(--brand-soft-border)] bg-[var(--brand-soft)] p-3.5">
                    <ShieldCheck size={18} aria-hidden="true" className="mt-0.5 shrink-0 text-[var(--brand-ink)]" />
                    <div className="text-xs leading-5 text-[var(--ink-primary)]">
                        <strong>{activeCount}</strong> of <strong>{staff.length}</strong> MPDC staff hold active planning editor permissions (
                        <strong>{scopedCount}</strong> authorized for <strong>{moduleTitle}</strong>). Managed by {headName}.
                    </div>
                </div>

                <ul className="divide-y divide-[var(--border-default)] rounded-xl border border-[var(--border-default)] bg-[var(--surface-card)]">
                    {staff.map((member) => (
                        <li key={member.id} className="space-y-3 p-3.5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="text-sm font-bold text-[var(--ink-primary)]">{member.name}</span>
                                        <StatusBadge tone={member.active ? 'ok' : 'neutral'}>
                                            {member.active ? 'Editor Access' : 'View Only'}
                                        </StatusBadge>
                                    </div>
                                    <div className="mt-0.5 text-xs text-[var(--ink-secondary)]">
                                        {member.position} · {member.office} · <span className="font-mono">{member.employeeNumber}</span>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => onToggleStaff(member.id)}
                                    className={member.active ? 'municipal-secondary-button' : 'municipal-primary-button'}
                                >
                                    {member.active ? (
                                        <>
                                            <UserMinus size={15} aria-hidden="true" />
                                            <span>Revoke All</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserCheck size={15} aria-hidden="true" />
                                            <span>Designate</span>
                                        </>
                                    )}
                                </button>
                            </div>

                            {onToggleModuleScope && (
                                <div className="flex flex-wrap items-center gap-2 border-t border-[var(--border-default)] pt-2.5">
                                    <span className="text-xs font-semibold text-[var(--ink-secondary)]">Authorized sections:</span>
                                    {MODULE_LABELS.map(({ key, field, label }) => {
                                        const enabled = member.active && (member[field] ?? true);
                                        return (
                                            <button
                                                key={key}
                                                type="button"
                                                aria-pressed={enabled}
                                                onClick={() => onToggleModuleScope(member.id, key)}
                                                className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors ${
                                                    enabled
                                                        ? 'border-[var(--brand-soft-border)] bg-[var(--brand-soft)] text-[var(--brand-ink)]'
                                                        : 'border-[var(--border-control)] bg-[var(--surface-recessed)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                                                }`}
                                            >
                                                <span
                                                    aria-hidden="true"
                                                    className={`h-1.5 w-1.5 rounded-full ${
                                                        enabled ? 'bg-[var(--brand-ink)]' : 'bg-[var(--ink-tertiary)]'
                                                    }`}
                                                />
                                                <span>{label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>
        </Dialog>
    );
}
