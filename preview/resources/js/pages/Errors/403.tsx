import { Link } from '@inertiajs/react';
import { ArrowLeft, ShieldX } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';

export default function Forbidden({ resource, message }: { resource: string; message: string }) {
    return (
        <AppLayout title="Access Denied">
            <div className="mx-auto flex min-h-[65vh] max-w-2xl items-center justify-center px-4 py-8">
                <section
                    className="tcds-card w-full border-t-4 border-t-[var(--status-danger-bar)] p-6 text-center sm:p-8"
                    aria-labelledby="access-denied-title"
                >
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl border border-[var(--status-danger-border)] bg-[var(--status-danger-bg)] text-[var(--status-danger-fg)]">
                        <ShieldX size={28} aria-hidden="true" />
                    </div>
                    <div className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--status-danger-fg)]">
                        Access restricted
                    </div>
                    <h1 id="access-denied-title" className="mt-2 text-2xl font-bold text-[var(--ink-primary)]">
                        {resource}
                    </h1>
                    <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[var(--ink-secondary)]">
                        {message}
                    </p>
                    <p className="mt-3 text-xs text-[var(--ink-tertiary)]">
                        Your current role remains unchanged. Contact the appropriate administrator only when this access is required for your municipal duties.
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                        <button
                            type="button"
                            onClick={() => window.history.back()}
                            className="municipal-secondary-button"
                        >
                            <ArrowLeft size={16} aria-hidden="true" />
                            <span>Go back</span>
                        </button>
                        <Link href="/dashboard" className="municipal-primary-button">
                            Return to dashboard
                        </Link>
                    </div>
                </section>
            </div>
        </AppLayout>
    );
}
