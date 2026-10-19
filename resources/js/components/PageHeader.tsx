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
        <header className="min-w-0 border-b border-[var(--municipal-border)] pb-5 sm:pb-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                <div className="min-w-0 flex-1">
                    <div className="municipal-eyebrow flex items-center gap-2">
                        {Icon && <Icon size={15} aria-hidden="true" />}
                        <span>{eyebrow}</span>
                    </div>
                    <h1
                        className="mt-2 text-[clamp(1.5rem,3.2vw,2.25rem)] font-extrabold leading-tight tracking-[-0.035em] text-[#0b2852] dark:text-slate-100"
                        style={{ overflowWrap: 'break-word', wordBreak: 'normal', hyphens: 'manual' }}
                    >
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                            {description}
                        </p>
                    )}
                </div>
                {aside && <div className="w-full shrink-0 lg:w-auto lg:max-w-sm">{aside}</div>}
            </div>
        </header>
    );
}
