import type { ReactNode } from 'react';

export function PageHeader({
    eyebrow,
    title,
    subtitle,
    actions,
}: {
    eyebrow?: string;
    title: string;
    subtitle?: string;
    actions?: ReactNode;
}) {
    return (
        <header className="mb-5 flex flex-col gap-3 border-b border-[var(--border-default)] pb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between">
            <div className="min-w-0 sm:flex-1">
                {eyebrow && (
                    <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[var(--brand-ink)]">
                        {eyebrow}
                    </p>
                )}
                <h1 className="text-2xl font-extrabold tracking-tight text-[var(--ink-primary)] sm:text-[1.75rem]">
                    {title}
                </h1>
                {subtitle && (
                    <p className="mt-1 max-w-3xl text-sm leading-6 text-[var(--ink-secondary)]">
                        {subtitle}
                    </p>
                )}
            </div>
            {actions && <div className="flex min-w-0 max-w-full shrink-0 flex-wrap items-center gap-2.5">{actions}</div>}
        </header>
    );
}

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon?: ReactNode;
    title: string;
    description: string;
    action?: ReactNode;
}) {
    return (
        <div className="tcds-card flex flex-col items-center justify-center px-6 py-10 text-center">
            {icon && (
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                    {icon}
                </div>
            )}
            <h2 className="text-base font-bold text-[var(--ink-primary)]">{title}</h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-[var(--ink-secondary)]">{description}</p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
