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
        <header className="municipal-page-header min-w-0">
            <div className="municipal-page-header-layout flex flex-col lg:flex-row lg:items-end lg:justify-between">
                <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[var(--municipal-brand)] sm:text-xs">
                        {Icon && <Icon size={15} aria-hidden="true" />}
                        <span>{eyebrow}</span>
                    </div>
                    <h1 className="municipal-page-header-title break-words municipal-page-title">
                        {title}
                    </h1>
                    {description && (
                        <p className="municipal-page-header-description max-w-3xl municipal-page-description">
                            {description}
                        </p>
                    )}
                </div>
                {aside && <div className="w-full shrink-0 lg:w-auto lg:max-w-sm">{aside}</div>}
            </div>
        </header>
    );
}
