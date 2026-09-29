import { useEffect } from 'react';
import { X } from 'lucide-react';

type Props = {
    open: boolean;
    onClose: () => void;
    title: string;
    eyebrow?: string;
    children: React.ReactNode;
};

export default function DetailDrawer({ open, onClose, title, eyebrow, children }: Props) {
    useEffect(() => {
        if (!open) return;

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        window.addEventListener('keydown', onKeyDown);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[70]" role="presentation">
            <button
                type="button"
                aria-label="Close details"
                onClick={onClose}
                className="absolute inset-0 bg-slate-950/30 backdrop-blur-[1px]"
            />
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={title}
                className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#142236]"
            >
                <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
                    <div className="min-w-0">
                        {eyebrow && <div className="text-[9px] font-extrabold uppercase tracking-[0.09em] text-slate-400">{eyebrow}</div>}
                        <h2 className="mt-0.5 truncate text-[15px] font-extrabold text-slate-950 dark:text-slate-100">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        aria-label="Close details"
                    >
                        <X size={16} aria-hidden="true" />
                    </button>
                </header>
                <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
            </aside>
        </div>
    );
}
