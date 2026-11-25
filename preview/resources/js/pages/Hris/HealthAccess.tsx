import { router, useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck, UserRoundCog } from 'lucide-react';
import { type FormEvent, useId } from 'react';
import { Button, DateTimeInput, PageHeader, StatusBadge } from '../../components/ui';
import AppLayout from '../../layouts/AppLayout';
import { formatDateTimePH } from '../../lib/format';

type User = { id: number; name: string; email: string; role: string };
type Employee = { id: number; employee_number: string; full_name?: string | null; position_title: string };
type Grant = {
    id: number;
    user: User;
    employee?: Employee | null;
    can_view: boolean;
    can_manage: boolean;
    purpose: string;
    granted_at: string;
    expires_at?: string | null;
    revoked_at?: string | null;
    granter?: { name: string } | null;
};

export default function HealthAccess({ grants, users, employees }: { grants: Grant[]; users: User[]; employees: Employee[] }) {
    const form = useForm({ user_id: users[0]?.id ?? '', employee_id: '', can_manage: false, purpose: '', expires_at: '' });
    const userIdField = useId();
    const scopeField = useId();
    const purposeField = useId();
    const expiresField = useId();

    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/hris/health-access', { preserveScroll: true, onSuccess: () => form.reset('purpose', 'expires_at') });
    };

    return (
        <AppLayout title="Health Vault Access">
            <div className="mx-auto max-w-6xl space-y-5 px-4 py-5 sm:px-6">
                <section className="rounded-2xl bg-[var(--surface-sidebar)] p-6 text-white sm:p-7">
                    <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
                        <ShieldCheck size={16} aria-hidden="true" />
                        <span>Explicit authorization boundary</span>
                    </div>
                    <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                        Employee Health Vault Access Policy
                    </h1>
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--surface-sidebar-ink)]">
                        System administration does not automatically grant medical-content access. This surface manages explicit, purpose-bound, revocable access to employment and occupational-health records. RHU patient clinical records remain outside this HRIS boundary.
                    </p>
                </section>

                <form onSubmit={submit} className="tcds-card space-y-4 p-5 sm:p-6">
                    <div className="flex items-center gap-2">
                        <UserRoundCog size={19} aria-hidden="true" className="text-[var(--brand-ink)]" />
                        <h2 className="text-base font-bold text-[var(--ink-primary)]">Grant restricted access</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <label htmlFor={userIdField} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Authorized user
                            </label>
                            <select
                                id={userIdField}
                                value={form.data.user_id}
                                onChange={(e) => form.setData('user_id', Number(e.target.value))}
                                className="tcds-input"
                            >
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} · {user.email}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label htmlFor={scopeField} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Vault scope
                            </label>
                            <select
                                id={scopeField}
                                value={form.data.employee_id}
                                onChange={(e) => form.setData('employee_id', e.target.value)}
                                className="tcds-input"
                            >
                                <option value="">All employee health vaults</option>
                                {employees.map((employee) => (
                                    <option key={employee.id} value={employee.id}>
                                        {employee.employee_number} · {employee.full_name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label htmlFor={purposeField} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Purpose / authority
                        </label>
                        <textarea
                            id={purposeField}
                            required
                            rows={3}
                            value={form.data.purpose}
                            onChange={(e) => form.setData('purpose', e.target.value)}
                            className="tcds-input min-h-24 resize-y"
                            placeholder="State the authorized employment or occupational-health purpose."
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 md:items-end">
                        <div>
                            <label htmlFor={expiresField} className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-[var(--ink-secondary)]">
                                Expires at (optional)
                            </label>
                            <DateTimeInput
                                id={expiresField}
                                value={form.data.expires_at}
                                onChange={(next) => form.setData('expires_at', next)}
                                presets={[
                                    { label: '+7 days', daysFromNow: 7 },
                                    { label: '+30 days', daysFromNow: 30 },
                                    { label: '+90 days', daysFromNow: 90 },
                                ]}
                            />
                        </div>

                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[var(--border-control)] bg-[var(--surface-recessed)] px-4 py-2.5 text-sm font-semibold text-[var(--ink-primary)]">
                            <input
                                type="checkbox"
                                checked={form.data.can_manage}
                                onChange={(e) => form.setData('can_manage', e.target.checked)}
                                className="h-4 w-4 accent-[var(--brand-primary)]"
                            />
                            <span>Allow adding governed health records</span>
                        </label>
                    </div>

                    <Button type="submit" disabled={form.processing}>
                        Record explicit grant
                    </Button>
                </form>

                <section className="tcds-card overflow-hidden">
                    <div className="border-b border-[var(--border-default)] px-5 py-4">
                        <div className="flex items-center gap-2">
                            <KeyRound size={18} aria-hidden="true" className="text-[var(--brand-ink)]" />
                            <h2 className="text-base font-bold text-[var(--ink-primary)]">Access grant ledger</h2>
                        </div>
                        <p className="mt-1 text-xs text-[var(--ink-secondary)]">
                            Access grant details are auditable; health-record content is never shown here.
                        </p>
                    </div>
                    <div className="divide-y divide-[var(--border-default)]">
                        {grants.map((grant) => (
                            <div key={grant.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-start md:justify-between">
                                <div>
                                    <div className="font-semibold text-[var(--ink-primary)]">
                                        {grant.user.name} · {grant.user.email}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                        Scope: {grant.employee ? `${grant.employee.employee_number} · ${grant.employee.full_name}` : 'All employee health vaults'}
                                    </div>
                                    <div className="mt-1 text-xs text-[var(--ink-secondary)]">Purpose: {grant.purpose}</div>
                                    <div className="mt-1 text-xs text-[var(--ink-secondary)]">
                                        {grant.can_manage ? 'View + manage' : 'View only'} · Granted {formatDateTimePH(grant.granted_at)}
                                        {grant.expires_at ? ` · Expires ${formatDateTimePH(grant.expires_at)}` : ''}
                                    </div>
                                </div>
                                {grant.revoked_at ? (
                                    <StatusBadge tone="neutral">Revoked</StatusBadge>
                                ) : (
                                    <Button variant="danger" size="sm" onClick={() => router.post(`/hris/health-access/${grant.id}/revoke`)}>
                                        Revoke
                                    </Button>
                                )}
                            </div>
                        ))}
                        {grants.length === 0 && (
                            <div className="px-5 py-10 text-center text-sm text-[var(--ink-secondary)]">
                                No explicit health-vault access grants recorded.
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
