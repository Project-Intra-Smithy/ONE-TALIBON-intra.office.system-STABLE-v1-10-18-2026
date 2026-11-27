import PlanningStaffList from './PlanningStaffList';
import { router } from '@inertiajs/react';
import { ShieldCheck, Trash2, UserPlus } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import Button from '../ui/Button';
import Dialog from '../ui/Dialog';

export type DesignatedStaffMember = {
    id: number;
    userId: number;
    employeeId: number;
    fullName: string;
    positionTitle: string;
    canManagePlans: boolean;
    canManagePpas: boolean;
    canManageMaps: boolean;
};

export type MpdoStaffCandidate = {
    userId: number;
    employeeId: number;
    fullName: string;
    positionTitle: string;
    email: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    designatedStaff: DesignatedStaffMember[];
    mpdoStaffPool: MpdoStaffCandidate[];
    allowedModules?: ('plans' | 'ppas' | 'maps')[];
};

export default function DesignatedStaffModal({
    open,
    onClose,
    designatedStaff,
    mpdoStaffPool,
    allowedModules = ['plans', 'ppas', 'maps'],
}: Props) {
    const [employeeId, setEmployeeId] = useState<string>('');
    const [canPlans, setCanPlans] = useState(false);
    const [canPpas, setCanPpas] = useState(false);
    const [canMaps, setCanMaps] = useState(false);
    const [busy, setBusy] = useState(false);
    const [submissionError, setSubmissionError] = useState('');

    const handleDesignate = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!employeeId || busy) return;

        setBusy(true);
        router.post(
            '/planning/designated-staff',
            {
                employee_id: Number(employeeId),
                can_manage_plans: canPlans,
                can_manage_ppas: canPpas,
                can_manage_maps: canMaps,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setEmployeeId('');
                    setCanPlans(false);
                    setCanPpas(false);
                    setCanMaps(false);
                },
                onError: errors => setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
            },
        );
    };

    const handleToggleScope = (
        member: DesignatedStaffMember,
        field: 'canManagePlans' | 'canManagePpas' | 'canManageMaps',
    ) => {
        if (busy) return;
        setBusy(true);
        const next = {
            can_manage_plans: field === 'canManagePlans' ? !member.canManagePlans : member.canManagePlans,
            can_manage_ppas: field === 'canManagePpas' ? !member.canManagePpas : member.canManagePpas,
            can_manage_maps: field === 'canManageMaps' ? !member.canManageMaps : member.canManageMaps,
        };

        router.put(`/planning/designated-staff/${member.id}`, next, {
            preserveScroll: true,
            onError: errors => setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
        });
    };

    const handleRevoke = (id: number) => {
        if (busy) return;
        setBusy(true);
        router.delete(`/planning/designated-staff/${id}`, {
            preserveScroll: true,
            onError: errors => setSubmissionError(Object.values(errors).join(' ')),
                onFinish: () => setBusy(false),
        });
    };

    return (
        <Dialog
            variant="drawer-right"
            open={open}
            onClose={onClose}
            title="Office Planning Staff & Module Scopes"
            description="Assign granular planning module scopes to active staff in your office. All boolean module scopes default to off unless explicitly granted."
            size="lg"
        >
            <div className="space-y-4 text-xs">
                {submissionError && <p role="alert">{submissionError}</p>}
                <form
                    onSubmit={handleDesignate}
                    className="space-y-3 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-muted)] p-3.5"
                >
                    <h4 className="flex items-center gap-1.5 font-bold text-[var(--municipal-text)]">
                        <UserPlus className="h-4 w-4 text-[var(--brand-ink)]" />
                        Designate Office Staff Member
                    </h4>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Active Office Employee
                        <select
                            required
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        >
                            <option value="">Select active staff in your office member…</option>
                            {mpdoStaffPool.map((emp) => (
                                <option key={emp.employeeId} value={emp.employeeId}>
                                    {emp.fullName} — {emp.positionTitle}
                                </option>
                            ))}
                        </select>
                    </label>
                    <fieldset className="space-y-1.5">
                        <legend className="font-semibold text-[var(--municipal-text)]">
                            Authorized Module Scopes (Default: Off)
                        </legend>
                        <div className="flex flex-wrap gap-4 pt-1">
                            <label className="inline-flex items-center gap-1.5 text-[var(--municipal-text)]">
                                <input
                                    type="checkbox"
                                    disabled={!allowedModules.includes('plans')} checked={canPlans}
                                    onChange={(e) => setCanPlans(e.target.checked)}
                                />
                                Development Plans (Draft / Review)
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-[var(--municipal-text)]">
                                <input
                                    type="checkbox"
                                    disabled={!allowedModules.includes('ppas')} checked={canPpas}
                                    onChange={(e) => setCanPpas(e.target.checked)}
                                />
                                PPA Register (Draft / Review)
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-[var(--municipal-text)]">
                                <input
                                    type="checkbox"
                                    disabled={!allowedModules.includes('maps')} checked={canMaps}
                                    onChange={(e) => setCanMaps(e.target.checked)}
                                />
                                Planning Maps (Draft / Review)
                            </label>
                        </div>
                    </fieldset>
                    <div className="flex justify-end">
                        <Button type="submit" variant="primary" size="sm" loading={busy}>
                            Save Staff Designation
                        </Button>
                    </div>
                </form>

                <div className="space-y-2">
                    <h4 className="flex items-center gap-1.5 font-bold text-[var(--municipal-text)]">
                        <ShieldCheck className="h-4 w-4 text-[var(--brand-ink)]" />
                        Active Designated Planning Staff ({designatedStaff.length})
                    </h4>
                    {designatedStaff.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--municipal-border)] p-4 text-center text-[var(--municipal-muted)]">
                            No office planning designations are currently active.
                        </p>
                    ) : (
                        <PlanningStaffList allowedModules={allowedModules} busy={busy} staff={designatedStaff.map(member => ({ id: member.id, name: member.fullName, detail: member.positionTitle, active: true, plans: member.canManagePlans, ppas: member.canManagePpas, maps: member.canManageMaps }))} onToggle={id => handleRevoke(Number(id))} onScope={(id, module) => { const member = designatedStaff.find(item => item.id === id); if (member) handleToggleScope(member, module === 'plans' ? 'canManagePlans' : module === 'ppas' ? 'canManagePpas' : 'canManageMaps'); }} />
                    )}
                </div>
            </div>
        </Dialog>
    );
}
