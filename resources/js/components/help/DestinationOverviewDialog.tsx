import { Info, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { DestinationOverview } from '../../data/municipal/destinationOverviewCatalog';

type Props = {
    overview: DestinationOverview;
};

const focusableSelector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function DestinationOverviewDialog({ overview }: Props) {
    const [open, setOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const previousFocus = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : triggerRef.current;
        const frame = window.requestAnimationFrame(() => {
            dialogRef.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
        });

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setOpen(false);
                return;
            }
            if (event.key !== 'Tab' || !dialogRef.current) return;

            const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector))
                .filter((element) => element.offsetParent !== null);
            if (focusable.length === 0) {
                event.preventDefault();
                dialogRef.current.focus();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', onKeyDown);
        return () => {
            window.cancelAnimationFrame(frame);
            document.removeEventListener('keydown', onKeyDown);
            window.requestAnimationFrame(() => {
                if (previousFocus?.isConnected) previousFocus.focus();
                else triggerRef.current?.focus();
            });
        };
    }, [open]);

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setOpen(true)}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] transition hover:bg-[var(--municipal-hover)] hover:text-[var(--municipal-brand)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
                aria-label={`About ${overview.title}`}
                title={`About ${overview.title}`}
            >
                <Info size={17} aria-hidden="true" />
            </button>

            {open && (
                <div
                    className="fixed inset-0 z-[90] flex items-center justify-center overflow-x-hidden bg-slate-950/50 p-3 sm:p-6"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) setOpen(false);
                    }}
                >
                    <div
                        ref={dialogRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="destination-overview-title"
                        aria-describedby="destination-overview-description"
                        tabIndex={-1}
                        className="max-h-[calc(100dvh-1.5rem)] w-full max-w-xl overflow-y-auto overflow-x-hidden rounded-2xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] text-[var(--municipal-text)] shadow-2xl sm:max-h-[calc(100dvh-3rem)]"
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-[var(--municipal-border)] px-4 py-4 sm:px-5">
                            <div className="min-w-0">
                                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] text-[var(--municipal-brand)]">ONE TALIBON overview</p>
                                <h2 id="destination-overview-title" className="mt-1 break-words text-xl font-extrabold tracking-[-0.02em] sm:text-2xl">{overview.title}</h2>
                            </div>
                            <button
                                type="button"
                                data-autofocus
                                onClick={() => setOpen(false)}
                                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)]"
                                aria-label="Close overview"
                            >
                                <X size={18} aria-hidden="true" />
                            </button>
                        </div>

                        <div className="space-y-5 px-4 py-5 sm:px-5">
                            <section>
                                <h3 className="text-sm font-extrabold text-[var(--municipal-text)]">Overview</h3>
                                <p id="destination-overview-description" className="mt-2 text-sm leading-6 text-[var(--municipal-muted)]">{overview.overview}</p>
                            </section>

                            <section>
                                <h3 className="text-sm font-extrabold text-[var(--municipal-text)]">What this area is for</h3>
                                <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-6 text-[var(--municipal-muted)]">
                                    {overview.purpose.map((item) => <li key={item}>{item}</li>)}
                                </ul>
                            </section>

                            {overview.connection && (
                                <section className="rounded-xl bg-[var(--municipal-brand-soft)] p-4">
                                    <h3 className="text-sm font-extrabold text-[var(--municipal-text)]">How it connects to ONE TALIBON</h3>
                                    <p className="mt-2 text-sm leading-6 text-[var(--municipal-muted)]">{overview.connection}</p>
                                </section>
                            )}
                        </div>

                        <div className="flex justify-end border-t border-[var(--municipal-border)] px-4 py-3 sm:px-5">
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                className="inline-flex min-h-11 items-center rounded-lg bg-[var(--municipal-brand-deep)] px-4 py-2 text-sm font-bold text-white hover:bg-[var(--municipal-brand-active)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--municipal-focus)] focus-visible:ring-offset-2"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
