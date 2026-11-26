import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { Dialog } from '../ui/Dialog';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'compact' | 'standard';
};

export default function DetailDrawer({ open, onClose, title, eyebrow, children, footer, size = 'standard' }: Props) {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            title={title}
            hideHeader
            size="xl"
            className={`max-h-[92vh] max-w-[calc(100vw-16px)] sm:max-h-[84vh] ${size === 'compact' ? 'sm:max-w-[660px]' : 'sm:max-w-[880px]'}`}
            bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
        >
            <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-default)] px-4 py-3 sm:px-5">
                <div className="min-w-0">
                    {eyebrow && <div className="text-[9px] font-extrabold uppercase tracking-[0.09em] text-[var(--ink-secondary)]">{eyebrow}</div>}
                    <h2 className="mt-0.5 truncate text-[16px] font-extrabold text-[var(--ink-primary)]">{title}</h2>
                </div>
                <button type="button" onClick={onClose} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] text-[var(--ink-secondary)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink-primary)]" aria-label="Close details">
                    <X size={16} aria-hidden="true" />
                </button>
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>
            {footer && <footer className="shrink-0 border-t border-[var(--border-default)] bg-[var(--surface-recessed)] px-4 py-3 sm:px-5">{footer}</footer>}
        </Dialog>
    );
}
