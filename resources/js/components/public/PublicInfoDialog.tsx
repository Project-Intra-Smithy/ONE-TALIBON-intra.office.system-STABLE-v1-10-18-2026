import { CheckCircle2, X } from 'lucide-react';
import { useEffect, useRef, type KeyboardEvent, type RefObject } from 'react';
import type { PublicInfoSelection } from './types';

type Props = {
    item: PublicInfoSelection | null;
    onClose: () => void;
    returnFocusRef: RefObject<HTMLElement | null>;
};

const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function PublicInfoDialog({ item, onClose, returnFocusRef }: Props) {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        const dialog = dialogRef.current;
        if (!dialog) return;

        if (item) {
            if (!dialog.open) dialog.showModal();
            requestAnimationFrame(() => closeButtonRef.current?.focus());
            return;
        }

        if (dialog.open) dialog.close();
        requestAnimationFrame(() => returnFocusRef.current?.focus());
    }, [item, returnFocusRef]);

    useEffect(() => () => {
        if (dialogRef.current?.open) dialogRef.current.close();
    }, []);

    const trapFocus = (event: KeyboardEvent<HTMLDialogElement>) => {
        if (event.key !== 'Tab') return;

        const dialog = dialogRef.current;
        if (!dialog) return;

        const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
            .filter(element => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true');

        if (focusable.length === 0) {
            event.preventDefault();
            dialog.focus();
            return;
        }

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;

        if (event.shiftKey && active === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && active === last) {
            event.preventDefault();
            first.focus();
        }
    };

    return <dialog
        ref={dialogRef}
        className="public-info-dialog m-auto max-h-[calc(100dvh-32px)] w-[min(580px,calc(100vw-32px))] overflow-y-auto rounded-xl border p-0 shadow-2xl [border-color:var(--public-divider)] [background:var(--public-surface)] [color:var(--public-text)]"
        aria-modal="true"
        aria-labelledby="public-info-dialog-title"
        aria-describedby="public-info-dialog-summary"
        onCancel={event => {
            event.preventDefault();
            onClose();
        }}
        onKeyDown={trapFocus}
        onClick={event => {
            if (event.target === dialogRef.current) onClose();
        }}
    >
        {item && <div className="min-w-0">
            <header className="flex items-start justify-between gap-5 border-b px-5 py-4 [border-color:var(--public-divider)] [background:var(--public-surface-soft)] sm:px-6">
                <div className="min-w-0">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">{item.eyebrow}</p>
                    <h2 id="public-info-dialog-title" className="mt-1 text-xl font-extrabold tracking-[-0.025em] [color:var(--public-text)]">{item.title}</h2>
                </div>
                <button
                    ref={closeButtonRef}
                    type="button"
                    onClick={onClose}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md transition-colors hover:[background:var(--public-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:[outline-color:var(--public-focus-ring)]"
                    aria-label="Close details"
                >
                    <X size={18} aria-hidden="true" />
                </button>
            </header>

            <div className="px-5 py-5 sm:px-6">
                <p id="public-info-dialog-summary" className="text-[13px] leading-5 [color:var(--public-muted)]">{item.detail.summary}</p>

                <div className="mt-5">
                    <h3 className="text-[10px] font-extrabold uppercase tracking-[0.11em] [color:var(--public-text)]">What it helps with</h3>
                    <ul className="mt-2.5 grid gap-2">
                        {item.detail.highlights.map(highlight => <li key={highlight} className="flex items-start gap-2 text-[12px] leading-5 [color:var(--public-text)]">
                            <CheckCircle2 size={15} className="mt-0.5 shrink-0 [color:var(--public-link)]" aria-hidden="true" />
                            <span>{highlight}</span>
                        </li>)}
                    </ul>
                </div>

                {item.detail.note && <div className="mt-5 rounded-lg border px-3.5 py-3 text-[11px] leading-4 [border-color:var(--public-divider)] [background:var(--public-surface-soft)] [color:var(--public-muted)]">
                    {item.detail.note}
                </div>}

                <div className="mt-5 flex justify-end">
                    <button type="button" onClick={onClose} className="inline-flex min-h-10 items-center justify-center rounded-md border px-4 text-[12px] font-bold transition-colors [border-color:var(--public-divider-strong)] hover:[background:var(--public-hover)] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:[outline-color:var(--public-focus-ring)]">
                        Close
                    </button>
                </div>
            </div>
        </div>}
    </dialog>;
}
