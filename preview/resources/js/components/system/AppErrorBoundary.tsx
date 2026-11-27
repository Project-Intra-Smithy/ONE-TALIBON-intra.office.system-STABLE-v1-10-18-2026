import { Component, type ReactNode } from 'react';

type Props = {
    children: ReactNode;
    resetKey?: string;
};

type State = {
    failed: boolean;
};

export default class AppErrorBoundary extends Component<Props, State> {
    state: State = { failed: false };

    static getDerivedStateFromError(): State {
        return { failed: true };
    }

    componentDidUpdate(prevProps: Props) {
        if (prevProps.resetKey !== this.props.resetKey && this.state.failed) {
            this.setState({ failed: false });
        }
    }

    render() {
        if (!this.state.failed) {
            return this.props.children;
        }

        return (
            <main className="flex min-h-dvh items-center justify-center bg-[var(--surface-canvas)] px-4 py-12 text-[var(--ink-primary)]">
                <section
                    role="alert"
                    aria-live="assertive"
                    className="tcds-card w-full max-w-xl p-6 sm:p-8"
                >
                    <p className="text-xs font-bold uppercase tracking-wider text-[var(--brand-primary)]">
                        Application recovery
                    </p>
                    <h1 className="mt-2 text-2xl font-bold">Something went wrong</h1>
                    <p className="mt-3 text-sm leading-6 text-[var(--ink-secondary)]">
                        We could not complete this page. You can retry the current view or return to the dashboard.
                    </p>
                    <div className="mt-6 flex flex-wrap gap-3">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="municipal-primary-button"
                        >
                            Retry page
                        </button>
                        <a href="/dashboard" className="municipal-secondary-button">
                            Return to dashboard
                        </a>
                    </div>
                </section>
            </main>
        );
    }
}
