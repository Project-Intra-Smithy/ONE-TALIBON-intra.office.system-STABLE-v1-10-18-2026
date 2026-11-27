import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import type { FormEvent } from 'react';
import { FormField } from '../../components/ui';

export default function ActivateAccount() {
    const form = useForm({ code: '', password: '', password_confirmation: '' });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post('/activate-account', { preserveScroll: true });
    };

    return (
        <>
            <Head title="Activate Account" />
            <a href="#activate-main" className="tcds-skip-link">
                Skip to activation form
            </a>
            <main id="activate-main" tabIndex={-1} className="min-h-[calc(100dvh-var(--ot-toolbar-height,0px))] bg-[var(--surface-canvas)] px-4 py-8 sm:px-6 lg:py-12">
                <div className="mx-auto max-w-xl">
                    <div className="flex items-center justify-between gap-4">
                        <Link href="/" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]">
                            <ArrowLeft size={16} aria-hidden="true" />
                            <span>Back to Public Portal</span>
                        </Link>
                        <Link href="/login" className="inline-flex min-h-11 items-center text-sm font-semibold text-[var(--brand-ink)] hover:underline">
                            Sign in
                        </Link>
                    </div>

                    <section className="tcds-card mt-5 overflow-hidden" aria-labelledby="activation-title">
                        <header className="border-b border-[var(--border-default)] border-l-4 border-l-[var(--accent-gold)] bg-[#0e4d36] px-6 py-6 text-white sm:px-8">
                            <div className="flex items-center gap-3">
                                <KeyRound size={26} aria-hidden="true" className="shrink-0 text-[#e2bd62]" />
                                <div>
                                    <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#d4ece0]">Accounts &amp; Access</p>
                                    <h1 id="activation-title" className="mt-0.5 text-2xl font-extrabold">Activate your LGU account</h1>
                                </div>
                            </div>
                            <p className="mt-2.5 text-sm leading-6 text-[#d8ece2]">
                                Enter the one-time activation code provided by your Municipal MIS Administrator.
                            </p>
                        </header>

                        <form onSubmit={submit} className="space-y-5 p-6 sm:p-8" aria-busy={form.processing}>
                            <FormField
                                label="Activation code"
                                htmlFor="activate-code"
                                required
                                hint="Enter the code exactly as issued (dashes optional)."
                                error={form.errors.code}
                            >
                                <input
                                    id="activate-code"
                                    name="code"
                                    type="text"
                                    autoComplete="one-time-code"
                                    autoCorrect="off"
                                    autoCapitalize="characters"
                                    spellCheck={false}
                                    placeholder="XXXX-XXXX-XXXX-XXXX"
                                    value={form.data.code}
                                    onChange={(e) => form.setData('code', e.target.value)}
                                    required
                                    aria-invalid={Boolean(form.errors.code) || undefined}
                                    aria-describedby={form.errors.code ? 'activate-code-error' : 'activate-code-hint'}
                                    className="tcds-input font-mono uppercase tracking-wider"
                                />
                            </FormField>

                            <FormField
                                label="Choose password"
                                htmlFor="activate-password"
                                required
                                hint="At least 12 characters with uppercase, lowercase, a number, and a symbol."
                                error={form.errors.password}
                            >
                                <input
                                    id="activate-password"
                                    name="password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.data.password}
                                    onChange={(e) => form.setData('password', e.target.value)}
                                    required
                                    aria-invalid={Boolean(form.errors.password) || undefined}
                                    aria-describedby={form.errors.password ? 'activate-password-error' : 'activate-password-hint'}
                                    className="tcds-input"
                                />
                            </FormField>

                            <FormField
                                label="Confirm password"
                                htmlFor="activate-password-confirm"
                                required
                                error={form.errors.password_confirmation}
                            >
                                <input
                                    id="activate-password-confirm"
                                    name="password_confirmation"
                                    type="password"
                                    autoComplete="new-password"
                                    value={form.data.password_confirmation}
                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                    required
                                    aria-invalid={Boolean(form.errors.password_confirmation) || undefined}
                                    aria-describedby={form.errors.password_confirmation ? 'activate-password-confirm-error' : undefined}
                                    className="tcds-input"
                                />
                            </FormField>

                            <button
                                type="submit"
                                disabled={form.processing}
                                className="municipal-primary-button min-h-12 w-full text-base font-bold"
                            >
                                <ShieldCheck size={18} aria-hidden="true" />
                                <span>{form.processing ? 'Activating…' : 'Activate account'}</span>
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        </>
    );
}
