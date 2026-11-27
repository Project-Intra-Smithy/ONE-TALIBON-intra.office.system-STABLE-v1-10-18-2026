import { Head, router, useForm } from '@inertiajs/react';
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';

type Props = {
    secret: string;
    provisioningUri: string;
    issuer: string;
};

export default function MfaEnrollment({ secret, provisioningUri, issuer }: Props) {
    const form = useForm({ code: '' });

    function submit(event: FormEvent) {
        event.preventDefault();
        form.post('/security/mfa/enroll');
    }

    return (
        <>
            <Head title="Set up MFA" />
            <main className="auth-canvas min-h-screen px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-2xl auth-panel bg-[var(--surface-card)] p-6 sm:p-8 dark:bg-[var(--surface-card)]">
                    <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-ink)]"><ShieldCheck size={21} /></div>
                        <div>
                            <div className="auth-kicker">Privileged identity assurance</div>
                            <h1 className="mt-1 text-2xl font-bold text-[var(--ink-primary)] dark:text-[var(--ink-primary)]">Set up multi-factor authentication</h1>
                            <p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">Municipal application access remains restricted until this enrollment is confirmed.</p>
                        </div>
                    </div>

                    <section className="mt-7 space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-4 sm:p-5">
                        <div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]">Authenticator issuer</div><div className="mt-1 text-sm font-semibold text-[var(--ink-primary)]">{issuer}</div></div>
                        <div><div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]">Setup secret</div><code className="mt-1 block break-all rounded-lg bg-[var(--surface-card)] px-3 py-2 font-mono text-sm font-semibold text-[var(--ink-primary)] dark:bg-[var(--surface-card)] dark:text-[var(--ink-primary)]">{secret}</code></div>
                        <a href={provisioningUri} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--brand-ink)] hover:underline"><KeyRound size={16} /> Open authenticator setup URI</a>
                        <p className="text-xs leading-5 text-[var(--ink-secondary)]">Add the account to a TOTP-compatible authenticator, then enter the current six-digit code below. The setup secret is shown only in this enrollment flow.</p>
                    </section>

                    <form onSubmit={submit} className="mt-6 space-y-3">
                        <label className="block"><span className="mb-1.5 block text-sm font-medium text-[var(--ink-primary)]">Six-digit verification code</span><input aria-invalid={Boolean(form.errors.code)} aria-describedby={form.errors.code ? "mfa-enrollment-code-error" : undefined} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={form.data.code} onChange={(event) => form.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))} className="w-full rounded-xl border border-[var(--border-control)] px-4 py-3 font-mono text-lg tracking-[0.25em] outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100" /></label>{form.errors.code && <p id="mfa-enrollment-code-error" role="alert" className="mt-1 text-sm text-[var(--status-danger-fg)]">{form.errors.code}</p>}
                        <button disabled={form.processing} className="w-full rounded-xl bg-[#0e4d36] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0a3b29] disabled:opacity-60">{form.processing ? 'Confirming…' : 'Confirm MFA enrollment'}</button>
                    </form>

                    <button type="button" onClick={() => router.post('/logout')} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]"><LogOut size={16} /> Sign out</button>
                </div>
            </main>
        </>
    );
}
