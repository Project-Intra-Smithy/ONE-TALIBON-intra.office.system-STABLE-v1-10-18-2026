type Props = { status: number; requestId: string };

const content: Record<number, { eyebrow: string; title: string; description: string }> = {
    403: { eyebrow: 'Access denied', title: 'You cannot open this page', description: 'Your current account does not have permission to access this resource.' },
    404: { eyebrow: 'Page not found', title: 'We could not find that page', description: 'The address may be incorrect, or the page may no longer be available.' },
    500: { eyebrow: 'Application error', title: 'Something went wrong', description: 'We could not complete this page. Retry the request or return to the dashboard.' },
    503: { eyebrow: 'Service unavailable', title: 'The portal is temporarily unavailable', description: 'The service cannot complete this request right now. Please retry shortly.' },
};

export default function Status({ status, requestId }: Props) {
    const copy = content[status] ?? content[500];
    return (
        <main className="flex min-h-dvh items-center justify-center bg-[var(--surface-canvas)] px-4 py-12 text-[var(--ink-primary)]">
            <section
                className="tcds-card w-full max-w-xl p-6 sm:p-8"
                aria-labelledby="status-title"
            >
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-ink)]">
                    {copy.eyebrow}
                </p>
                <h1 id="status-title" className="mt-2 text-2xl font-bold text-[var(--ink-primary)]">
                    {copy.title}
                </h1>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-secondary)]">
                    {copy.description}
                </p>
                {requestId && (
                    <div className="mt-5 rounded-lg border border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-[var(--ink-secondary)]">
                            Request ID
                        </div>
                        <code className="mt-1 block break-all font-mono text-xs text-[var(--ink-primary)]">
                            {requestId}
                        </code>
                    </div>
                )}
                <div className="mt-6 flex flex-wrap gap-2.5">
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="municipal-primary-button"
                    >
                        Retry
                    </button>
                    <button
                        type="button"
                        onClick={() => window.history.back()}
                        className="municipal-secondary-button"
                    >
                        Go back
                    </button>
                    <a href="/dashboard" className="municipal-secondary-button">
                        Return to dashboard
                    </a>
                </div>
            </section>
        </main>
    );
}
