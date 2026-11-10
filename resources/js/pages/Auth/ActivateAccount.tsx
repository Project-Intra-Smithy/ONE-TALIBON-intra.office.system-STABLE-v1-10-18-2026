import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import type { FormEvent, ReactNode } from 'react';

export default function ActivateAccount() {
    const form = useForm({ code: '', password: '', password_confirmation: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/activate-account', { preserveScroll: true });
    };

    return <>
        <Head title="Activate Account" />
        <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:py-12">
            <div className="mx-auto max-w-xl">
                <div className="flex items-center justify-between gap-4">
                    <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-slate-600 hover:text-blue-900"><ArrowLeft size={16}/>One Talibon</Link>
                    <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-blue-900 hover:underline">Sign in</Link>
                </div>
                <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/5" aria-labelledby="activation-title">
                    <header className="bg-[#0b2852] px-6 py-7 text-white sm:px-8">
                        <div className="flex items-center gap-3"><KeyRound size={27}/><div><p className="text-xs font-bold uppercase tracking-[.18em] text-blue-200">Accounts & Access</p><h1 id="activation-title" className="mt-1 text-2xl font-black sm:text-3xl">Activate your account</h1></div></div>
                        <p className="mt-3 text-sm leading-6 text-blue-100">Enter the private one-time code an authorized administrator gave you. No email service is required.</p>
                    </header>
                    <form onSubmit={submit} className="space-y-5 p-6 sm:p-8" aria-busy={form.processing}>
                        <Field label="Activation code" error={form.errors.code}>
                            <input aria-label="Activation code" autoComplete="one-time-code" value={form.data.code} onChange={e=>form.setData('code',e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 font-mono uppercase tracking-wider outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX" />
                        </Field>
                        <Field label="Choose password" error={form.errors.password}>
                            <input aria-label="Choose password" type="password" autoComplete="new-password" value={form.data.password} onChange={e=>form.setData('password',e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
                        </Field>
                        <Field label="Confirm password" error={form.errors.password_confirmation}>
                            <input aria-label="Confirm password" type="password" autoComplete="new-password" value={form.data.password_confirmation} onChange={e=>form.setData('password_confirmation',e.target.value)} required className="w-full rounded-xl border border-slate-300 px-3 py-3 outline-none focus:border-blue-700 focus:ring-2 focus:ring-blue-100" />
                        </Field>
                        <p className="text-xs leading-5 text-slate-500">Use at least 12 characters with uppercase, lowercase, a number, and a symbol. Invalid, expired, revoked, and previously used codes receive the same neutral refusal.</p>
                        <button disabled={form.processing} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0b2852] px-5 py-3 font-semibold text-white hover:bg-[#10396f] disabled:opacity-60"><ShieldCheck size={18}/>{form.processing?'Activating…':'Activate account'}</button>
                    </form>
                </section>
            </div>
        </main>
    </>;
}

function Field({label,error,children}:{label:string;error?:string;children:ReactNode}) {
    return <label className="block text-sm font-semibold text-slate-700">{label}<span className="mt-1.5 block">{children}</span>{error&&<span role="alert" className="mt-1.5 block text-sm font-medium text-rose-700">{error}</span>}</label>;
}
