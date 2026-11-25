import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { talibonAssets } from '../../branding/talibonAssets';

export default function Login() {
    const form = useForm({ login: '', password: '' });
    const [passwordVisible, setPasswordVisible] = useState(false);

    function submit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!form.processing) form.post('/login');
    }

    return (
        <>
            <Head title="Staff Sign In" />
            <a href="#login-panel" className="tcds-skip-link">
                Skip to sign-in form
            </a>

            <div className="grid min-h-[calc(100dvh-var(--ot-toolbar-height,0px))] grid-cols-1 bg-[var(--surface-canvas)] lg:grid-cols-2">
                {/* Left Civic Identity Panel — compact header on mobile so Sign In stays above the fold */}
                <section
                    aria-label="Municipality of Talibon Portal Identity"
                    className="relative flex flex-col justify-between overflow-hidden bg-[#0a3626] px-5 py-5 text-white sm:px-10 lg:px-12 lg:py-9"
                >
                    <img
                        src="/images/municipality/talibon-homepage-hero.jpg"
                        alt=""
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 mix-blend-luminosity"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a3626]/95 via-[#0e4d36]/88 to-[#07261b]/95"
                    />

                    <div className="relative z-10 flex items-center gap-3.5">
                        <img
                            src={talibonAssets.municipalSeal}
                            alt="Official seal of the Municipality of Talibon"
                            width={48}
                            height={48}
                            className="h-11 w-11 shrink-0 rounded-full object-contain lg:h-12 lg:w-12"
                        />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#e2bd62]">
                                Republic of the Philippines
                            </p>
                            <p className="text-sm font-semibold text-white">
                                Municipality of Talibon, Province of Bohol
                            </p>
                        </div>
                    </div>

                    <div className="relative z-10 mt-4 max-w-lg lg:my-0">
                        <span className="mb-4 hidden h-1 w-12 rounded-full bg-[#e2bd62] lg:block" aria-hidden="true" />
                        <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl lg:text-5xl">
                            ONE TALIBON
                        </h1>
                        <p className="mt-1 text-sm font-semibold text-[#d4ece0] sm:text-base lg:mt-2 lg:text-2xl">
                            Municipal Intra-Office Portal
                        </p>
                        <p className="mt-4 hidden text-base leading-7 text-[#d8ece2] lg:block">
                            A single secure workspace for Talibon LGU offices to manage work requests, official memoranda,
                            municipal records, and daily operations.
                        </p>
                    </div>

                    <div className="relative z-10 hidden items-start gap-2.5 border-t border-white/15 pt-4 text-xs leading-5 text-[#c2ded0] lg:flex">
                        <ShieldCheck size={17} aria-hidden="true" className="mt-0.5 shrink-0 text-[#e2bd62]" />
                        <p>
                            Official municipal system · Authorized LGU personnel only · Protected under the Data Privacy Act
                            of 2012 (RA 10173).
                        </p>
                    </div>
                </section>

                {/* Right Sign-In Column — zero overlap at every viewport */}
                <main
                    id="login-panel"
                    tabIndex={-1}
                    className="flex flex-col justify-between bg-[var(--surface-canvas)] px-4 py-5 sm:px-8 lg:px-12 lg:py-7"
                >
                    <div className="flex justify-end">
                        <Link
                            href="/"
                            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-[var(--brand-ink)] hover:bg-[var(--surface-hover)]"
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                            <span>Back to Public Portal</span>
                        </Link>
                    </div>

                    <div className="mx-auto my-auto w-full max-w-[420px] py-6">
                        <section
                            aria-labelledby="login-title"
                            className="tcds-card p-6 sm:p-8"
                        >
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--brand-ink)]">
                                Staff Sign In
                            </p>
                            <h2 id="login-title" className="mt-1.5 text-2xl font-extrabold tracking-tight text-[var(--ink-primary)]">
                                Sign in to your workspace
                            </h2>
                            <p className="mt-1.5 text-sm text-[var(--ink-secondary)]">
                                Use your assigned municipal account credentials.
                            </p>

                            <form onSubmit={submit} aria-label="Employee sign-in" aria-busy={form.processing} className="mt-6 space-y-5">
                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="login-identity" className="text-sm font-semibold text-[var(--ink-primary)]">
                                        Username or municipal email
                                    </label>
                                    <input
                                        id="login-identity"
                                        name="login"
                                        type="text"
                                        autoComplete="username"
                                        autoCorrect="off"
                                        autoCapitalize="none"
                                        spellCheck={false}
                                        placeholder="juan.delacruz@talibon.gov.ph"
                                        value={form.data.login}
                                        onChange={(event) => form.setData('login', event.target.value)}
                                        required
                                        disabled={form.processing}
                                        aria-invalid={Boolean(form.errors.login) || undefined}
                                        aria-describedby={form.errors.login ? 'login-identity-error' : undefined}
                                        className="tcds-input min-h-12"
                                    />
                                    {form.errors.login && (
                                        <p id="login-identity-error" role="alert" className="text-xs font-semibold text-[var(--status-danger-fg)]">
                                            {form.errors.login}
                                        </p>
                                    )}
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="login-password" className="text-sm font-semibold text-[var(--ink-primary)]">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            id="login-password"
                                            name="password"
                                            type={passwordVisible ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            value={form.data.password}
                                            onChange={(event) => form.setData('password', event.target.value)}
                                            required
                                            disabled={form.processing}
                                            aria-invalid={Boolean(form.errors.password) || undefined}
                                            aria-describedby={form.errors.password ? 'login-password-error' : undefined}
                                            className="tcds-input min-h-12 pr-12"
                                        />
                                        <button
                                            type="button"
                                            aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                                            aria-controls="login-password"
                                            aria-pressed={passwordVisible}
                                            disabled={form.processing}
                                            onClick={() => setPasswordVisible((visible) => !visible)}
                                            className="absolute right-1 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-md text-[var(--ink-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                                        >
                                            {passwordVisible ? <EyeOff size={19} aria-hidden="true" /> : <Eye size={19} aria-hidden="true" />}
                                        </button>
                                    </div>
                                    {form.errors.password && (
                                        <p id="login-password-error" role="alert" className="text-xs font-semibold text-[var(--status-danger-fg)]">
                                            {form.errors.password}
                                        </p>
                                    )}
                                </div>

                                <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm font-medium text-[var(--ink-primary)]">
                                    <input
                                        name="remember"
                                        type="checkbox"
                                        checked={false}
                                        disabled
                                        className="h-5 w-5 rounded border border-[var(--border-control)] bg-[var(--surface-card)]"
                                    />
                                    <span>Persistent sign-in is unavailable</span>
                                </label>

                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="municipal-primary-button min-h-12 w-full text-base font-bold"
                                >
                                    <span>{form.processing ? 'Signing in…' : 'Sign in'}</span>
                                    <ArrowRight size={18} aria-hidden="true" />
                                </button>

                                <span className="sr-only" role="status">
                                    {form.processing ? 'Signing in. Please wait.' : ''}
                                </span>
                            </form>

                            <div className="my-5 flex items-center gap-3 text-xs font-semibold text-[var(--ink-secondary)]">
                                <span className="h-px flex-1 bg-[var(--border-default)]" />
                                <span>or</span>
                                <span className="h-px flex-1 bg-[var(--border-default)]" />
                            </div>

                            <Link
                                href="/activate-account"
                                className="municipal-secondary-button min-h-12 w-full text-center text-sm"
                            >
                                First time here? Activate your LGU account
                            </Link>
                        </section>

                        <p className="mt-4 text-center text-xs text-[var(--ink-secondary)]">
                            Contact your authorized account administrator
                        </p>
                    </div>

                    <div aria-hidden="true" />
                </main>
            </div>
        </>
    );
}
