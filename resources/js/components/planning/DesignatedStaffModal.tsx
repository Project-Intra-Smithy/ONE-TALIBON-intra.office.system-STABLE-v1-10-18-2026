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
};

export default function DesignatedStaffModal({
    open,
    onClose,
    designatedStaff,
    mpdoStaffPool,
}: Props) {
    const [employeeId, setEmployeeId] = useState<string>('');
    const [canPlans, setCanPlans] = useState(false);
    const [canPpas, setCanPpas] = useState(false);
    const [canMaps, setCanMaps] = useState(false);
    const [busy, setBusy] = useState(false);

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
            onFinish: () => setBusy(false),
        });
    };

    const handleRevoke = (id: number) => {
        if (busy) return;
        setBusy(true);
        router.delete(`/planning/designated-staff/${id}`, {
            preserveScroll: true,
            onFinish: () => setBusy(false),
        });
    };

    return (
        <Dialog
            variant="drawer-right"
            open={open}
            onClose={onClose}
            title="MPDC Staff Delegation & Module Scopes"
            description="Assign granular planning module scopes to active MPDC staff. All boolean module scopes default to off unless explicitly granted."
            size="lg"
        >
            <div className="space-y-4 text-xs">
                <form
                    onSubmit={handleDesignate}
                    className="space-y-3 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-muted)] p-3.5"
                >
                    <h4 className="flex items-center gap-1.5 font-bold text-[var(--municipal-text)]">
                        <UserPlus className="h-4 w-4 text-[var(--municipal-brand)]" />
                        Designate MPDC Staff Member
                    </h4>
                    <label className="block font-semibold text-[var(--municipal-text)]">
                        Active MPDC Employee
                        <select
                            required
                            value={employeeId}
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="mt-1 block min-h-9 w-full rounded border border-[var(--municipal-border-strong)] bg-[var(--municipal-surface)] px-2.5 text-xs text-[var(--municipal-text)]"
                        >
                            <option value="">Select active MPDC staff member…</option>
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
                                    checked={canPlans}
                                    onChange={(e) => setCanPlans(e.target.checked)}
                                />
                                Development Plans (Draft / Review)
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-[var(--municipal-text)]">
                                <input
                                    type="checkbox"
                                    checked={canPpas}
                                    onChange={(e) => setCanPpas(e.target.checked)}
                                />
                                PPA Register (Draft / Review)
                            </label>
                            <label className="inline-flex items-center gap-1.5 text-[var(--municipal-text)]">
                                <input
                                    type="checkbox"
                                    checked={canMaps}
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
                        <ShieldCheck className="h-4 w-4 text-[var(--municipal-brand)]" />
                        Active Designated MPDC Staff ({designatedStaff.length})
                    </h4>
                    {designatedStaff.length === 0 ? (
                        <p className="rounded-lg border border-dashed border-[var(--municipal-border)] p-4 text-center text-[var(--municipal-muted)]">
                            No MPDC staff designations are currently active.
                        </p>
                    ) : (
                        <ul className="space-y-2">
                            {designatedStaff.map((member) => (
                                <li
                                    key={member.id}
                                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3"
                                >
                                    <div>
                                        <p className="font-bold text-[var(--municipal-text)]">
                                            {member.fullName}
                                        </p>
                                        <p className="text-[11px] text-[var(--municipal-muted)]">
                                            {member.positionTitle}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={member.canManagePlans}
                                                onChange={() =>
                                                    handleToggleScope(member, 'canManagePlans')
                                                }
                                            />
                                            Plans
                                        </label>
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={member.canManagePpas}
                                                onChange={() =>
                                                    handleToggleScope(member, 'canManagePpas')
                                                }
                                            />
                                            PPAs
                                        </label>
                                        <label className="inline-flex items-center gap-1 text-[11px]">
                                            <input
                                                type="checkbox"
                                                checked={member.canManageMaps}
                                                onChange={() =>
                                                    handleToggleScope(member, 'canManageMaps')
                                                }
                                            />
                                            Maps
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => handleRevoke(member.id)}
                                            className="inline-flex min-h-8 items-center gap-1 rounded border border-red-300 px-2 text-[11px] font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300"
                                        >
                                            <Trash2 className="h-3 w-3" /> Revoke
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </Dialog>
    );
}
