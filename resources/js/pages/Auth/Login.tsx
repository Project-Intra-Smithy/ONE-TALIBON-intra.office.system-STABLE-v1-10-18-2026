import { Head, useForm } from '@inertiajs/react';
import { Building2, ArrowRight } from 'lucide-react';
import type { FormEvent } from 'react';
import './login.css';

export default function Login() {
    const form = useForm({ email: '', password: '', remember: false });

    function submit(event: FormEvent) {
        event.preventDefault();
        if (!form.processing) form.post('/login');
    }

    return (
        <>
            <Head title="Employee Portal" />
            <main className="employee-login">
                <div className="employee-login__composition">
                    <header className="employee-login__brand">
                        <Building2 size={25} strokeWidth={1.5} aria-hidden="true" />
                        <div>
                            <div className="employee-login__wordmark">ONE TALIBON</div>
                            <p>Municipality of Talibon</p>
                        </div>
                    </header>
                    <section className="employee-login__panel" aria-labelledby="login-title">
                        <p className="employee-login__eyebrow">Employee access</p>
                        <h1 id="login-title">Employee Portal</h1>
                        <p className="employee-login__intro">Sign in with the credentials privately issued for this prototype environment.</p>
                        <form onSubmit={submit} aria-label="Employee sign-in" aria-busy={form.processing}>
                            <div className="employee-login__field">
                                <label htmlFor="login-email">Email</label>
                                <input
                                    id="login-email"
                                    name="email"
                                    autoComplete="username"
                                    autoFocus
                                    value={form.data.email}
                                    onChange={(event) => form.setData('email', event.target.value)}
                                    type="email"
                                    required
                                    disabled={form.processing}
                                    aria-invalid={Boolean(form.errors.email)}
                                    aria-describedby={form.errors.email ? 'login-email-error' : undefined}
                                />
                                {form.errors.email && <p id="login-email-error" className="employee-login__error" role="alert">{form.errors.email}</p>}
                            </div>
                            <div className="employee-login__field">
                                <label htmlFor="login-password">Password</label>
                                <input
                                    id="login-password"
                                    name="password"
                                    autoComplete="current-password"
                                    value={form.data.password}
                                    onChange={(event) => form.setData('password', event.target.value)}
                                    type="password"
                                    required
                                    disabled={form.processing}
                                    aria-invalid={Boolean(form.errors.password)}
                                    aria-describedby={form.errors.password ? 'login-password-error' : undefined}
                                />
                                {form.errors.password && <p id="login-password-error" className="employee-login__error" role="alert">{form.errors.password}</p>}
                            </div>
                            <label className="employee-login__remember">
                                <input
                                    name="remember"
                                    type="checkbox"
                                    checked={form.data.remember}
                                    onChange={(event) => form.setData('remember', event.target.checked)}
                                    disabled={form.processing}
                                />
                                <span>Remember me on this device</span>
                            </label>
                            <button type="submit" className="employee-login__submit" disabled={form.processing}>
                                {form.processing ? 'Signing in…' : 'Sign in'}
                                <ArrowRight size={18} aria-hidden="true" />
                            </button>
                            <span className="employee-login__status" role="status">{form.processing ? 'Signing in. Please wait.' : ''}</span>
                        </form>
                        <div className="employee-login__alternative">
                            <button type="button" disabled>Continue with Google</button>
                            <p>Google sign-in is unavailable.</p>
                        </div>
                    </section>
                    <p className="employee-login__notice">Account activation is not enabled in this prototype.</p>
                </div>
            </main>
        </>
    );
}
