const statusClasses: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300',
    superseded: 'bg-amber-50 text-amber-800 dark:bg-amber-950/35 dark:text-amber-300',
    repealed: 'bg-rose-50 text-rose-800 dark:bg-rose-950/35 dark:text-rose-300',
    archived: 'bg-slate-100 text-slate-600 dark:bg-[var(--surface-recessed)] dark:text-[var(--ink-secondary)]',
};

export default function LegislativeRecordStatus({ status }: { status: string }) {
    const normalized = status.toLowerCase();
    const classes = statusClasses[normalized] ?? statusClasses.archived;

    return <span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${classes}`}>{status.replaceAll('_', ' ')}</span>;
}
