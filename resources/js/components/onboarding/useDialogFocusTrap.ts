import { type RefObject, useEffect } from 'react';

const focusableSelector = [
    'button:not([disabled])',
    '[href]',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

export default function useDialogFocusTrap(
    ref: RefObject<HTMLElement | null>,
    active: boolean,
    onEscape: () => void,
) {
    useEffect(() => {
        if (!active) return;

        const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        const shell = document.getElementById('portal-shell');
        shell?.setAttribute('inert', '');

        const focusInitial = window.setTimeout(() => {
            const preferred = ref.current?.querySelector<HTMLElement>('[data-autofocus]');
            const first = ref.current?.querySelector<HTMLElement>(focusableSelector);
            (preferred ?? first)?.focus();
        }, 0);

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onEscape();
                return;
            }

            if (event.key !== 'Tab') return;
            const focusable = Array.from(ref.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? [])
                .filter((element) => element.offsetParent !== null);

            if (focusable.length === 0) {
                event.preventDefault();
                return;
            }

            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            const current = document.activeElement;

            if (event.shiftKey && (current === first || !ref.current?.contains(current))) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && current === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            window.clearTimeout(focusInitial);
            document.removeEventListener('keydown', handleKeyDown);
            shell?.removeAttribute('inert');
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [active, onEscape, ref]);
}
