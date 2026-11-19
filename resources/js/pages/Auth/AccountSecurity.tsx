import { Head, Link, useForm } from '@inertiajs/react';

export default function AccountSecurity({ requiresMfa }: { requiresMfa: boolean }) {
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <>
            <Head title="Account security" />
            <main className="auth-canvas min-h-screen px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-lg auth-panel bg-white p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-slate-950">Account security</h1>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-blue-800">
                        <Link href="/dashboard">Back to dashboard</Link>
                        {requiresMfa && <Link href="/security/mfa">Multi-factor authentication</Link>}
                    </div>
                    <form onSubmit={event=>{event.preventDefault();password.put('/security/password',{preserveScroll:true,onSuccess:()=>password.reset()});}} className="mt-7 space-y-3 border-t border-slate-200 pt-6">
                        <h2 className="font-bold text-slate-950">Change password</h2>
                        <p className="text-sm text-slate-600">Changing your password invalidates other signed-in sessions.</p>
                        <input aria-label="Current password" type="password" autoComplete="current-password" placeholder="Current password" value={password.data.current_password} onChange={e=>password.setData('current_password',e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3" required/>
                        <input aria-label="New password" type="password" autoComplete="new-password" placeholder="New password" value={password.data.password} onChange={e=>password.setData('password',e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3" required/>
                        <input aria-label="Confirm new password" type="password" autoComplete="new-password" placeholder="Confirm new password" value={password.data.password_confirmation} onChange={e=>password.setData('password_confirmation',e.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-3" required/>
                        {Object.values(password.errors).map(error=><p key={error} role="alert" className="text-sm font-semibold text-red-700">{error}</p>)}
                        <button disabled={password.processing} className="rounded-xl bg-[#0b2852] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Update password</button>
                    </form>
                </div>
            </main>
        </>
    );
}
