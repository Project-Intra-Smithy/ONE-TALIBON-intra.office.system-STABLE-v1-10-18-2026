import { Head, router, useForm } from '@inertiajs/react';
import { KeyRound, LogOut } from 'lucide-react';
import type { FormEvent } from 'react';
import './mfa-challenge.css';

export default function MfaChallenge() {
    const totp = useForm({ code: '', recovery_code: '' });
    const recovery = useForm({ code: '', recovery_code: '' });

    function submitTotp(event: FormEvent) {
        event.preventDefault();
        if (!totp.processing && !recovery.processing) totp.post('/security/mfa/challenge');
    }

    function submitRecovery(event: FormEvent) {
        event.preventDefault();
        if (!totp.processing && !recovery.processing) recovery.post('/security/mfa/challenge');
    }

    return (
        <>
            <Head title="MFA challenge" />
            <main className="mfa-challenge">
                <div className="mfa-challenge-card">
                    <header>
                        <p className="mfa-challenge-kicker">ONE TALIBON &middot; ACCOUNT VERIFICATION</p>
                        <h1 className="mt-2 text-2xl font-semibold text-slate-950">Verify your identity</h1>
                        <p className="mt-2 text-sm leading-6 text-slate-600">Enter your authenticator code to continue securely.</p>
                    </header>

                    <form aria-label="Authenticator verification" aria-busy={totp.processing} onSubmit={submitTotp} className="mt-5 space-y-3">
                        <label className="block"><span className="mb-1.5 block text-sm font-medium text-slate-700">Authenticator code</span><input name="code" aria-invalid={Boolean(totp.errors.code)} aria-describedby={totp.errors.code ? "mfa-code-error" : undefined} disabled={totp.processing || recovery.processing} autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={totp.data.code} onChange={(event) => totp.setData('code', event.target.value.replace(/\D/g, '').slice(0, 6))} className="mfa-challenge-input font-mono text-lg tracking-[0.25em]" />{totp.errors.code && <span id="mfa-code-error" role="alert" className="mt-1 block text-sm text-red-600">{totp.errors.code}</span>}</label>
                        <button disabled={totp.processing || recovery.processing} className="mfa-challenge-primary">{totp.processing ? 'Verifying…' : 'Verify and continue'}</button>
                    </form>

                    <hr className="my-5 border-slate-200" />

                    <form aria-label="Recovery verification" aria-busy={recovery.processing} onSubmit={submitRecovery} className="space-y-3">
                        <label className="block"><span className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"><KeyRound size={15} /> One-time recovery code</span><input name="recovery_code" aria-invalid={Boolean(recovery.errors.recovery_code || recovery.errors.code)} aria-describedby="mfa-recovery-errors" disabled={totp.processing || recovery.processing} value={recovery.data.recovery_code} onChange={(event) => recovery.setData('recovery_code', event.target.value)} autoComplete="off" className="mfa-challenge-input font-mono text-sm uppercase" /><span id="mfa-recovery-errors" role="alert">{recovery.errors.recovery_code && <span className="mt-1 block text-sm text-red-600">{recovery.errors.recovery_code}</span>}{recovery.errors.code && <span className="mt-1 block text-sm text-red-600">{recovery.errors.code}</span>}</span></label>
                        <button disabled={totp.processing || recovery.processing} className="mfa-challenge-secondary">Use recovery code</button>
                    </form>

                    <button type="button" onClick={() => router.post('/logout')} className="mfa-challenge-signout mt-5 inline-flex items-center gap-2 text-sm font-medium"><LogOut size={16} /> Sign out</button>
                </div>
            </main>
        </>
    );
}
