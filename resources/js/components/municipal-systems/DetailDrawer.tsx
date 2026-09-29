import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;
    children: ReactNode;
    footer?: ReactNode;
};

export default function DetailDrawer({ open, onClose, title, eyebrow, children, footer }: Props) {
    const closeButtonRef = useRef<HTMLButtonElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const onCloseRef = useRef(onClose);
    onCloseRef.current = onClose;

    useEffect(() => {
        if (!open) return;

        previousFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onCloseRef.current();
        };

        window.addEventListener('keydown', onKeyDown);
        const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());

        return () => {
            window.cancelAnimationFrame(focusFrame);
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
            previousFocusRef.current?.focus();
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-6" role="presentation">
            <button
                type="button"
                aria-label="Close details"
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/35 backdrop-blur-[1px]"
            />
            <section
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="relative flex max-h-[92vh] w-[calc(100vw-16px)] flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl sm:max-h-[84vh] sm:w-[min(880px,calc(100vw-48px))] sm:rounded-2xl dark:border-slate-700 dark:bg-[#142236]"
            >
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 sm:px-5 dark:border-slate-700">
                    <div className="min-w-0">
                        {eyebrow && <div className="text-[9px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{eyebrow}</div>}
                        <h2 className="mt-0.5 truncate text-[16px] font-extrabold text-slate-950 dark:text-slate-100">{title}</h2>
                    </div>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close details"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
                {footer && (
                    <footer className="shrink-0 border-t border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5 dark:border-slate-700 dark:bg-slate-900/35">
                        {footer}
                    </footer>
                )}
            </section>
        </div>
    );
}
