import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type Props = {
    eyebrow: ReactNode;
    title: ReactNode;
    description?: ReactNode;
    aside?: ReactNode;
    icon?: LucideIcon;
};

export default function PageHeader({ eyebrow, title, description, aside, icon: Icon }: Props) {
    return (
        <header className="min-w-0 border-b border-[var(--municipal-border)] pb-3 sm:pb-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between lg:gap-4">
                <div className="min-w-0 flex-1">
                    <div className="municipal-eyebrow flex items-center gap-2">
                        {Icon && <Icon size={15} aria-hidden="true" />}
                        <span>{eyebrow}</span>
                    </div>
                    <h1
                        className="mt-1.5 text-[clamp(1.5rem,2.4vw,1.875rem)] font-bold leading-tight tracking-[-0.025em] text-[var(--municipal-brand-deep)] dark:text-[var(--ink-primary)]"
                        style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual' }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--ink-secondary)]">
                            {description}
                        </p>
                    )}
                </div>
                {aside && <div className="w-full shrink-0 lg:w-auto lg:max-w-sm">{aside}</div>}
            </div>
        </header>
    );
}
