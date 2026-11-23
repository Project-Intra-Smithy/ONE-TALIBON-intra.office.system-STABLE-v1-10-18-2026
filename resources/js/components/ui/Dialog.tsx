import { X } from 'lucide-react';
import { type ReactNode, useEffect, useId, useRef } from 'react';

type DialogProps = {
    open: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    variant?: 'modal' | 'drawer-right' | 'drawer-left';
    size?: 'md' | 'lg' | 'xl';
    lightDismiss?: boolean;
    hideHeader?: boolean;
    children: ReactNode;
    footer?: ReactNode;
};

/**
 * Native top-layer modal dialog using <dialog> + showModal().
 * Browser provides inert backdrop, focus containment, Esc dismissal, and focus return.
 * Per W3C/modern-web-guidance: never add redundant role="dialog" or aria-modal.
 */
export function Dialog({
    open,
    onClose,
    title,
    description,
    variant = 'modal',
    size = 'md',
    lightDismiss = true,
    hideHeader = false,
    children,
    footer,
}: DialogProps) {
    const ref = useRef<HTMLDialogElement>(null);
    const titleId = useId();
    const descId = useId();

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (open) {
            if (!el.open) el.showModal();
        } else if (el.open) {
            el.close();
        }
    }, [open]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handleClose = () => {
            el.returnValue = '';
            if (open) onClose();
        };
        el.addEventListener('close', handleClose);
        return () => el.removeEventListener('close', handleClose);
    }, [open, onClose]);

    // Progressive enhancement fallback for light-dismiss when native closedby="any" is unsupported (e.g. Safari).
    useEffect(() => {
        const el = ref.current;
        if (!el || !open || !lightDismiss) return;
        if (typeof HTMLDialogElement !== 'undefined' && 'closedBy' in HTMLDialogElement.prototype) return;

        const isOutside = (event: PointerEvent) => {
            const rect = el.getBoundingClientRect();
            return (
                event.clientX < rect.left
                || event.clientX > rect.right
                || event.clientY < rect.top
                || event.clientY > rect.bottom
            );
        };

        let pressedOutside = false;
        const onDown = (event: PointerEvent) => {
            pressedOutside = isOutside(event);
        };
        const onUp = (event: PointerEvent) => {
            if (pressedOutside && isOutside(event)) el.close();
            pressedOutside = false;
        };

        el.addEventListener('pointerdown', onDown);
        el.addEventListener('pointerup', onUp);
        return () => {
            el.removeEventListener('pointerdown', onDown);
            el.removeEventListener('pointerup', onUp);
        };
    }, [open, lightDismiss]);

    const sizeClass = variant === 'modal'
        ? size === 'xl'
            ? 'tcds-dialog-xl w-full'
            : size === 'lg'
                ? 'tcds-dialog-lg w-full'
                : 'w-full'
        : '';

    const variantClass = variant === 'drawer-right'
        ? 'tcds-drawer'
        : variant === 'drawer-left'
            ? 'tcds-drawer-left'
            : sizeClass;

    return (
        <dialog
            ref={ref}
            aria-labelledby={titleId}
            aria-describedby={description ? descId : undefined}
            className={variantClass}
            {...({ closedby: lightDismiss ? 'any' : 'closerequest' } as Record<string, string>)}
        >
            <div className="flex h-full max-h-[inherit] flex-col">
                {hideHeader ? (
                    <h2 id={titleId} className="sr-only">{title}</h2>
                ) : (
                    <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-default)] px-5 py-4">
                        <div className="min-w-0">
                            <h2 id={titleId} className="text-lg font-bold tracking-tight text-[var(--ink-primary)]">
                                {title}
                            </h2>
                            {description && (
                                <p id={descId} className="mt-1 text-sm text-[var(--ink-secondary)]">
                                    {description}
                                </p>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => ref.current?.close()}
                            aria-label={`Close ${title}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[var(--ink-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]"
                        >
                            <X size={18} aria-hidden="true" />
                        </button>
                    </div>
                )}

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                    {children}
                </div>

                {footer && (
                    <div className="flex shrink-0 flex-wrap items-center justify-end gap-2.5 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-5 py-3.5">
                        {footer}
                    </div>
                )}
            </div>
        </dialog>
    );
}
