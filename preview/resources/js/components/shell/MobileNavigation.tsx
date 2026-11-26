import { X } from 'lucide-react';
import { type PropsWithChildren, useEffect, useRef } from 'react';

type Props = PropsWithChildren<{ onClose: () => void; onDesktop: () => void }>;

/**
 * Native top-layer mobile navigation drawer using <dialog> + showModal().
 * Avoids document.body overflow hacks and manual Tab focus traps.
 */
export default function MobileNavigation({ children, onClose, onDesktop }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        const element = dialog.current;
        if (!element) return;
        if (!element.open) element.showModal();
        const handleClose = () => onClose();
        element.addEventListener('close', handleClose);
        return () => {
            element.removeEventListener('close', handleClose);
            if (element.open) element.close();
        };
    }, [onClose]);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => {
            if (desktop.matches) onDesktop();
        };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, [onDesktop]);

    return (
        <dialog
            id="portal-mobile-navigation"
            ref={dialog}
            aria-label="Municipal navigation"
            className="tcds-drawer-left"
            {...({ closedby: 'any' } as Record<string, string>)}
        >
            <div className="flex h-full flex-col">
                <div className="flex shrink-0 items-center justify-between border-b border-[var(--surface-sidebar-border)] px-4 py-2.5">
                    <span className="text-xs font-bold uppercase tracking-wider text-[var(--surface-sidebar-muted)]">
                        Navigation
                    </span>
                    <button
                        type="button"
                        onClick={() => dialog.current?.close()}
                        aria-label="Close navigation"
                        autoFocus
                        className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold text-white hover:bg-[var(--surface-sidebar-hover)] focus-visible:outline-[var(--focus-ring-sidebar)]"
                    >
                        <X size={18} aria-hidden="true" />
                        <span>Close</span>
                    </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
            </div>
        </dialog>
    );
}
