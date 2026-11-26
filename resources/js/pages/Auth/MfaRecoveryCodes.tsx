import { Head, Link, usePage } from '@inertiajs/react';
import { KeyRound, ShieldCheck } from 'lucide-react';

type Props = {
    continueUrl: string;
};

type RecoveryFlash = {
    mfaRecoveryCodes?: string[];
};

export default function MfaRecoveryCodes({ continueUrl }: Props) {
    const flash = usePage().flash as RecoveryFlash | undefined;
    const codes = Array.isArray(flash?.mfaRecoveryCodes) ? flash.mfaRecoveryCodes : [];
    const block = codes.join('\n');

    return (
        <>
            <Head title="MFA recovery codes" />
            <main className="auth-canvas min-h-screen px-4 py-8 sm:px-6">
                <div className="mx-auto max-w-xl auth-panel bg-[var(--surface-card)] p-6 sm:p-8 dark:bg-[var(--surface-card)]">
                    <div className="flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><ShieldCheck size={21} /></div><div><div className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--brand-ink)]">MFA active</div><h1 className="mt-1 text-2xl font-bold text-[var(--ink-primary)] dark:text-[var(--ink-primary)]">Store your recovery codes</h1><p className="mt-2 text-sm leading-6 text-[var(--ink-secondary)]">Each code works once. The portal stores only one-way hashes and will not show this set again.</p></div></div>

                    <pre className="mt-6 whitespace-pre-wrap rounded-xl border border-[var(--border-default)] bg-slate-950 p-4 font-mono text-sm leading-7 text-slate-100">{block}</pre>
                    <button type="button" onClick={() => navigator.clipboard?.writeText(block)} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-[var(--border-control)] px-3 py-2 text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]"><KeyRound size={15} /> Copy codes</button>

                    <div className="mt-6 grid gap-3 sm:grid-cols-2"><Link href={continueUrl} className="rounded-xl bg-[#0e4d36] px-4 py-3 text-center text-sm font-semibold text-white hover:bg-[#0a3b29]">Continue to portal</Link><Link href="/security/mfa" className="rounded-xl border border-[var(--border-control)] px-4 py-3 text-center text-sm font-semibold text-[var(--ink-primary)] hover:bg-[var(--surface-hover)]">MFA settings</Link></div>
                </div>
            </main>
        </>
    );
}
