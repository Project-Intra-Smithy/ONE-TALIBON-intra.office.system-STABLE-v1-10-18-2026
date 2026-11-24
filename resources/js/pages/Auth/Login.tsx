import { Head, useForm } from '@inertiajs/react';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import './login.css';

export default function Login() {
  const form = useForm({ login: '', password: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.processing) form.post('/login');
  }

  return (
    <>
      <Head title="Employee Portal" />
      <main className="employee-login">
        <div className="employee-login__backdrop" aria-hidden="true" />
        <div className="employee-login__composition">
          <header className="employee-login__identity">
            <div className="employee-login__identity-content">
              <p className="employee-login__municipality">Municipality of Talibon</p>
              <h1 className="employee-login__headline">
                <span>ONE</span>
                <span className="employee-login__headline-accent">TALIBON</span>
              </h1>
              <p className="employee-login__subtitle">Intraoffice Portal</p>
              <span className="employee-login__rule" aria-hidden="true" />
              <p className="employee-login__description">
                One place for the tools and information your team uses every day,
                kept simple and easy to reach.
              </p>
            </div>
          </header>

          <section className="employee-login__panel" aria-labelledby="login-title">
            <p className="employee-login__eyebrow">Sign in</p>
            <h2 id="login-title">Sign in to your workspace</h2>
            <p className="employee-login__intro">Use your ONE TALIBON account to continue.</p>

            <form onSubmit={submit} aria-label="Employee sign-in" aria-busy={form.processing}>
              <div className="employee-login__field">
                <label htmlFor="login-identity">Username or email</label>
                <input
                  id="login-identity"
                  name="login"
                  type="text"
                  autoComplete="username"
                  value={form.data.login}
                  onChange={(event) => form.setData('login', event.target.value)}
                  required
                  disabled={form.processing}
                  aria-invalid={Boolean(form.errors.login)}
                  aria-describedby={form.errors.login ? 'login-identity-error' : undefined}
                />
                {form.errors.login && (
                  <p id="login-identity-error" className="employee-login__error" role="alert">
                    {form.errors.login}
                  </p>
                )}
              </div>

              <div className="employee-login__field">
                <label htmlFor="login-password">Password</label>
                <div className="employee-login__password">
                  <input
                    id="login-password"
                    name="password"
                    type={passwordVisible ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={form.data.password}
                    onChange={(event) => form.setData('password', event.target.value)}
                    required
                    disabled={form.processing}
                    aria-invalid={Boolean(form.errors.password)}
                    aria-describedby={form.errors.password ? 'login-password-error' : undefined}
                  />
                  <button
                    type="button"
                    className="employee-login__visibility"
                    aria-label={passwordVisible ? 'Hide password' : 'Show password'}
                    aria-controls="login-password"
                    aria-pressed={passwordVisible}
                    disabled={form.processing}
                    onClick={() => setPasswordVisible((visible) => !visible)}
                  >
                    {passwordVisible ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
                  </button>
                </div>
                {form.errors.password && (
                  <p id="login-password-error" className="employee-login__error" role="alert">
                    {form.errors.password}
                  </p>
                )}
              </div>

              <p className="employee-login__google-note">Remember me is disabled for account security. Sign in again when your session ends.</p>

              <button type="submit" className="employee-login__submit" disabled={form.processing}>
                <span>{form.processing ? 'Signing in…' : 'Sign in'}</span>
                <ArrowRight size={19} aria-hidden="true" />
              </button>
              <span className="employee-login__status" role="status">
                {form.processing ? 'Signing in. Please wait.' : ''}
              </span>
            </form>
            <button type="button" disabled className="employee-login__google" aria-describedby="google-note">Continue with Google</button>
            <p id="google-note" className="employee-login__google-note">Google account integration will be enabled after official LGU identity setup.</p>
          </section>
        </div>
      </main>
    </>
  );
}
