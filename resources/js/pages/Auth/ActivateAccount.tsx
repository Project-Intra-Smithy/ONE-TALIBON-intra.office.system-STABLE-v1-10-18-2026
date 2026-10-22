import { Head, Link, useForm } from '@inertiajs/react';
import { type FormEvent } from 'react';
import { Building2, LockKeyhole } from 'lucide-react';

type Props = { token?:string|null; status?:'valid'|'invalid'|'expired'|'consumed'|'revoked'|null };
const messages = {
    invalid: 'This activation link is invalid. Request a new invitation from the system administrator.',
    expired: 'This invitation has expired. Request a replacement from the system administrator.',
    consumed: 'This invitation has already been used. Sign in normally or contact the administrator.',
    revoked: 'This invitation is no longer authorized. Contact the administrator.',
};
const field = 'mt-1 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500';
export default function ActivateAccount({token,status}:Props) {
    const form=useForm({employee_number:'',password:'',password_confirmation:''});
    const submit=(event:FormEvent)=>{
        event.preventDefault();
        if (status!=='valid'||!token) return;
        form.post('/activate-account/'+token, {onFinish:()=>form.reset('password','password_confirmation')});
    };
    return <>
        <Head title="Activate Employee Account" />
        <main className="min-h-screen bg-slate-100 px-4 py-12">
            <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                <div className="bg-[#0b2852] px-6 py-7 text-white">
                    <div className="flex items-center gap-3"><Building2 aria-hidden="true" size={24} />
                        <div><p className="text-xs font-bold uppercase tracking-widest text-blue-200">ONE TALIBON</p><h1 className="text-2xl font-bold">Employee activation</h1></div>
                    </div>
                    <p className="mt-3 text-sm text-blue-100">Secure activation is available only to invited, registered municipal employees.</p>
                </div>
                <div className="space-y-5 p-6">
                    {status==='valid' && token ? <>
                        <p className="text-sm leading-6 text-slate-700">Confirm the employee number on your authorized invitation and set a new password. Your office and role are already assigned by the administrator. Privileged users must complete MFA enrollment after activation.</p>
                        <form onSubmit={submit} className="space-y-4" aria-label="Activate employee account">
                            <label className="block text-xs font-bold text-slate-700">Registered employee number
                                <input required autoComplete="off" maxLength={64} value={form.data.employee_number} onChange={event=>form.setData('employee_number',event.target.value)} className={field}/>
                            </label>
                            <label className="block text-xs font-bold text-slate-700">New password (minimum 16 characters, letters and numbers)
                                <input required minLength={16} maxLength={128} type="password" autoComplete="new-password" value={form.data.password} onChange={event=>form.setData('password',event.target.value)} className={field}/>
                            </label>
                            <label className="block text-xs font-bold text-slate-700">Confirm new password
                                <input required type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={event=>form.setData('password_confirmation',event.target.value)} className={field}/>
                            </label>
                            {Object.entries(form.errors).map(([key,value])=><p key={key} role="alert" className="text-xs font-semibold text-red-700">{value}</p>)}
                            <button disabled={form.processing} className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2852] px-5 text-sm font-bold text-white disabled:opacity-50"><LockKeyhole size={16}/>Activate account</button>
                        </form>
                    </> : <div role="status" className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                        {status && status in messages ? messages[status as keyof typeof messages] : 'Request a private employee activation invitation from your authorized municipal administrator. Public registration is not available.'}
                    </div>}
                    <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-900 hover:underline">Return to Employee Login</Link>
                </div>
            </div>
        </main>
    </>;
}
