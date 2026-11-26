import { Head, Link, useForm } from '@inertiajs/react';

export default function AccountSecurity({ requiresMfa }: { requiresMfa: boolean }) {
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });
    return (
        <>
            <Head title="Account security" />
            <main className="auth-canvas min-h-screen px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-lg auth-panel bg-[var(--surface-card)] p-6 sm:p-8">
                    <h1 className="text-2xl font-bold text-[var(--ink-primary)]">Account security</h1>
                    <div className="mt-4 flex flex-wrap gap-4 text-sm font-semibold text-[var(--brand-ink)]">
                        <Link href="/dashboard">Back to dashboard</Link>
                        {requiresMfa && <Link href="/security/mfa">Multi-factor authentication</Link>}
                    </div>
                    <form onSubmit={event=>{event.preventDefault();password.put('/security/password',{preserveScroll:true,onSuccess:()=>password.reset()});}} className="mt-7 space-y-3 border-t border-[var(--border-default)] pt-6">
                        <h2 className="font-bold text-[var(--ink-primary)]">Change password</h2>
                        <p className="text-sm text-[var(--ink-secondary)]">Changing your password invalidates other signed-in sessions.</p>
                        <input aria-label="Current password" aria-invalid={Boolean(password.errors.current_password)} aria-describedby={password.errors.current_password ? "password-error-current_password" : undefined} type="password" autoComplete="current-password" placeholder="Current password" value={password.data.current_password} onChange={e=>password.setData('current_password',e.target.value)} className="w-full rounded-xl border border-[var(--border-control)] px-3 py-3" required/>
                        <input aria-label="New password" aria-invalid={Boolean(password.errors.password)} aria-describedby={password.errors.password ? "password-error-password" : undefined} type="password" autoComplete="new-password" placeholder="New password" value={password.data.password} onChange={e=>password.setData('password',e.target.value)} className="w-full rounded-xl border border-[var(--border-control)] px-3 py-3" required/>
                        <input aria-label="Confirm new password" aria-invalid={Boolean(password.errors.password_confirmation)} aria-describedby={password.errors.password_confirmation ? "password-error-password_confirmation" : undefined} type="password" autoComplete="new-password" placeholder="Confirm new password" value={password.data.password_confirmation} onChange={e=>password.setData('password_confirmation',e.target.value)} className="w-full rounded-xl border border-[var(--border-control)] px-3 py-3" required/>
                        {Object.entries(password.errors).map(([field,error])=><p id={`password-error-${field}`} key={field} role="alert" className="text-sm font-semibold text-[var(--status-danger-fg)]">{error}</p>)}
                        <button disabled={password.processing} className="rounded-xl bg-[var(--brand-primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">Update password</button>
                    </form>
                </div>
            </main>
        </>
    );
}
