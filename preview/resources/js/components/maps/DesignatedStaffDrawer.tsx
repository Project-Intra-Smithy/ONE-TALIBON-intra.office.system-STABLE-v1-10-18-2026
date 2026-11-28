import PlanningStaffList from '../../../../../resources/js/components/planning/PlanningStaffList';
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

                <PlanningStaffList staff={staff.map(member => ({ id: member.id, name: member.name, detail: [member.position, member.office, member.employeeNumber].filter(Boolean).join(' · '), active: member.active, plans: member.canManagePlans ?? true, ppas: member.canManagePpas ?? true, maps: member.canManageMaps ?? true }))} onToggle={id => onToggleStaff(String(id))} onScope={onToggleModuleScope ? (id, module) => onToggleModuleScope(String(id), module) : undefined} />
            </div>
        </Dialog>
    );
}
