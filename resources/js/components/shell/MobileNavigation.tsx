import { X } from 'lucide-react';
import { useEffect, useRef, type PropsWithChildren } from 'react';

type Props = PropsWithChildren<{ onClose: () => void; onDesktop: () => void }>;

export default function MobileNavigation({ children, onClose, onDesktop }: Props) {
    const dialog = useRef<HTMLDialogElement>(null);
    const closeButton = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        const element = dialog.current;
        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement as HTMLElement | null;
        element?.showModal();
        closeButton.current?.focus();
        document.body.style.overflow = 'hidden';
        const keepFocusInside = (event: KeyboardEvent) => {
            if (event.key !== 'Tab' || !element) return;
            const controls = Array.from(element.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled]), [tabindex="0"]'))
                .filter(control => control.tabIndex >= 0 && control.getClientRects().length > 0);
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault(); last?.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault(); first?.focus();
            }
        };
        element?.addEventListener('keydown', keepFocusInside);
        return () => {
            element?.removeEventListener('keydown', keepFocusInside);
            element?.close();
            document.body.style.overflow = previousOverflow;
            previousFocus?.focus();
        };
    }, []);
    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => { if (desktop.matches) onDesktop(); };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, [onDesktop]);
    return <dialog id="portal-mobile-navigation" ref={dialog}
        onCancel={(event) => { event.preventDefault(); onClose(); }}
        aria-label="Workspace navigation" className="portal-mobile-navigation">
        <button type="button" onClick={onClose} className="portal-drawer-backdrop" aria-label="Dismiss navigation backdrop" tabIndex={-1} />
        <div className="portal-drawer">
            <div className="portal-drawer-heading">
                <span>Navigation</span>
                <button ref={closeButton} type="button" onClick={onClose} aria-label="Close navigation">
                    <X size={20} aria-hidden="true" /><span>Close</span>
                </button>
            </div>
            <div className="portal-drawer-content">{children}</div>
        </div>
    </dialog>;
}
