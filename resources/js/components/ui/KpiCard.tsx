import { Link } from '@inertiajs/react';

export type KpiAccent = 'brand' | 'ok' | 'warn' | 'danger' | 'neutral';

const accentBar: Record<KpiAccent, string> = {
    brand: 'border-l-[var(--status-ok-bar)]',
    ok: 'border-l-[var(--status-ok-bar)]',
    warn: 'border-l-[var(--status-warn-bar)]',
    danger: 'border-l-[var(--status-danger-bar)]',
    neutral: 'border-l-[var(--status-neutral-bar)]',
};

type KpiCardProps = {
    label: string;
    value: number | string;
    hint?: string;
    accent?: KpiAccent;
    href?: string;
};

export function KpiCard({ label, value, hint, accent = 'brand', href }: KpiCardProps) {
    const body = (
        <div className="flex flex-col gap-1">
            <span className="text-sm font-semibold text-[var(--ink-secondary)]">{label}</span>
            <strong className="text-3xl font-extrabold leading-tight tracking-tight text-[var(--ink-primary)] [font-variant-numeric:tabular-nums]">
                {value}
            </strong>
            {hint && <span className="text-xs font-medium text-[var(--ink-secondary)]">{hint}</span>}
        </div>
    );

    const baseClasses = `tcds-card block border-l-4 p-4 transition-colors ${accentBar[accent]}`;

    if (href) {
        return (
            <Link href={href} className={`${baseClasses} hover:border-[var(--brand-primary)] hover:bg-[var(--surface-hover)]`}>
                {body}
            </Link>
        );
    }

    return <div className={baseClasses}>{body}</div>;
}
