import { X } from 'lucide-react';
import { useEffect, useId, useRef, type MouseEvent, type PropsWithChildren } from 'react';

export default function MobileNavigation({ children, onClose }: PropsWithChildren<{ onClose: () => void }>) {
    const closeButton = useRef<HTMLButtonElement>(null);
    const titleId = useId();

    useEffect(() => {
        const previousOverflow = document.body.style.overflow;
        const previousFocus = document.activeElement as HTMLElement | null;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            onClose();
        };

        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        closeButton.current?.focus();

        return () => {
            window.removeEventListener('keydown', closeOnEscape);
            document.body.style.overflow = previousOverflow;
            if (previousFocus?.isConnected) previousFocus.focus();
        };
    }, [onClose]);

    useEffect(() => {
        const desktop = window.matchMedia('(min-width: 1024px)');
        const closeOnDesktop = () => { if (desktop.matches) onClose(); };
        desktop.addEventListener('change', closeOnDesktop);
        return () => desktop.removeEventListener('change', closeOnDesktop);
    }, [onClose]);

    const closeFromBackdrop = (event: MouseEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) onClose();
    };

    return (
        <div
            role="dialog"
            aria-labelledby={titleId}
            aria-modal="true"
            onClick={closeFromBackdrop}
            className="fixed inset-0 z-[80] h-dvh w-full overflow-hidden bg-slate-950/55 text-white lg:hidden"
        >
            <span id={titleId} className="sr-only">Municipal navigation</span>
            <aside className="relative h-full w-[88%] max-w-[320px] overflow-hidden overscroll-contain shadow-2xl">{children}</aside>
            <button
                ref={closeButton}
                type="button"
                onClick={onClose}
                className="absolute flex h-11 w-11 items-center justify-center rounded-lg bg-white text-slate-900 shadow dark:bg-slate-800 dark:text-slate-100"
                style={{
                    right: 'max(0.75rem, env(safe-area-inset-right))',
                    top: 'max(0.75rem, env(safe-area-inset-top))',
                }}
                aria-label="Close navigation"
            >
                <X size={18} aria-hidden="true" />
            </button>
        </div>
    );
}
