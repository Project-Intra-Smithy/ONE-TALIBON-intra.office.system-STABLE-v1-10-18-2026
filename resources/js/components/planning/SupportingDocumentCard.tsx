import { type ReactNode } from 'react';
import { FileText } from 'lucide-react';

export default function SupportingDocumentCard({ title, metadata, badges, icon, actions }: { title: string; metadata: ReactNode; badges: ReactNode; icon?: ReactNode; actions: ReactNode }) {
    return <li className="rounded-xl border border-[var(--border-default)] bg-[var(--surface-recessed)] p-3.5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--border-default)] bg-[var(--surface-card)] text-[var(--brand-ink)]">{icon ?? <FileText size={18} aria-hidden="true" />}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-1.5">{badges}</div><p className="mt-1.5 break-words text-sm font-bold leading-snug text-[var(--ink-primary)]">{title}</p><div className="mt-0.5 break-words text-xs text-[var(--ink-secondary)]">{metadata}</div></div></div>
            <div className="flex shrink-0 flex-wrap items-center gap-1.5">{actions}</div>
        </div>
    </li>;
}
