import { Head, Link, router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import { ShieldCheck } from 'lucide-react';

type Employee = { id:number; number:string; name:string; office:string|null; departmentId:number };
type Invitation = { id:number; employee:string|null; status:string; expiresAt:string };
type Props = { employees:Employee[]; roles:string[]; invitations:Invitation[]; oneTimeLink:string|null };
const field = 'mt-1 w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-100';
const action = 'rounded-lg bg-[#0b2852] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

export default function Invitations({ employees, roles, invitations, oneTimeLink }: Props) {
    const form = useForm({ employee_id: 0, department_id: 0, role: 'department_staff' });
    const [confirmed, setConfirmed] = useState(false);
    const selected = employees.find((employee) => employee.id === form.data.employee_id);
    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!confirmed || !selected) return;
        form.post('/admin/invitations', { preserveScroll: true, onSuccess: () => setConfirmed(false) });
    };
    return <AppLayout title="Employee invitations"><PageFrame>
        <Head title="Employee invitations" />
        <PageHeader eyebrow="Accounts & Access" title="Staff activation invitations"
            description="Only approved, active employee records can receive a portal invitation. The system assigns the employee's existing office and the administrator-approved role." icon={ShieldCheck} />
        <Link href="/admin" className="inline-flex min-h-10 items-center text-sm font-semibold text-blue-800 dark:text-blue-200">Back to Accounts & Access</Link>
        {oneTimeLink && <section role="status" className="my-4 rounded-xl border border-blue-300 bg-blue-50 p-4 text-sm dark:border-blue-700 dark:bg-slate-900">
            <h2 className="font-bold">Invitation generated — reveal once</h2>
            <p className="mt-2">Provide this link privately to the authorized employee. It expires after 24 hours, works once, and is not recoverable from the account registry. Do not post it to public correspondence or issue trackers.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
                <input readOnly aria-label="One-time activation link" value={oneTimeLink} onFocus={e=>e.currentTarget.select()} className={field + ' min-w-0 flex-1 break-all'} />
                <button type="button" onClick={()=>void navigator.clipboard?.writeText(oneTimeLink)} className={action}>Copy private link</button>
            </div>
        </section>}
        <div className="grid gap-5 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
                <h2 className="font-bold">Create controlled invitation</h2>
                <p className="mt-2 text-xs leading-5 text-slate-600 dark:text-slate-300">Choose an eligible employee already registered by the municipality. Accounts are inactive until the invitation is redeemed and identity is checked.</p>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <label className="block text-xs font-bold">Registered employee
                        <select required className={field} value={form.data.employee_id} onChange={(event)=>{
                            const employee=employees.find(item=>item.id===Number(event.target.value));
                            form.setData({ ...form.data, employee_id:employee?.id ?? 0, department_id:employee?.departmentId ?? 0 });
                            setConfirmed(false);
                        }}>
                            <option value={0}>Select an approved employee</option>
                            {employees.map(employee=><option value={employee.id} key={employee.id}>{employee.name} ({employee.number}) — {employee.office}</option>)}
                        </select>
                    </label>
                    {selected && <div className="rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-900">
                        <div>Office: <strong>{selected.office}</strong></div><div>Employee ID: {selected.number}</div>
                        <p className="mt-1">Official email is taken from the registered employee record; it cannot be edited here.</p>
                    </div>}
                    <label className="block text-xs font-bold">Approved portal role
                        <select className={field} value={form.data.role} onChange={event=>form.setData('role',event.target.value)}>
                            {roles.map(role=><option key={role} value={role}>{role.replaceAll('_',' ')}</option>)}
                        </select>
                    </label>
                    <label className="flex items-start gap-3 text-xs leading-5">
                        <input type="checkbox" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} className="mt-1" />
                        <span>I verified this employee's identity, employment status, assigned office and approved role using authorized municipal records.</span>
                    </label>
                    {Object.entries(form.errors).map(([key,value])=><p key={key} role="alert" className="text-xs text-red-700">{value}</p>)}
                    <button disabled={form.processing || !confirmed || !selected} className={action}>Generate one-time invitation</button>
                </form>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-[#142236]">
                <h2 className="font-bold">Recent invitation activity</h2>
                <p className="my-2 text-xs text-slate-500">Tokens are never retrievable. Issuing a replacement revokes the previous unused invitation.</p>
                {invitations.length === 0 ? <p className="mt-4 text-sm text-slate-500">No invitations issued.</p> : <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                    {invitations.map(item=><li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-xs">
                        <div><div className="font-semibold">{item.employee || 'Employee record unavailable'}</div>
                            <div className="text-slate-500">{item.status} · Expires {new Date(item.expiresAt).toLocaleString()}</div></div>
                        {item.status==='pending' && <button type="button" onClick={()=>router.post('/admin/invitations/'+item.id+'/revoke',{}, { preserveScroll:true })} className="rounded-lg border border-red-300 px-3 py-2 font-semibold text-red-700">Revoke</button>}
                    </li>)}
                </ul>}
            </section>
        </div>
    </PageFrame></AppLayout>;
}
