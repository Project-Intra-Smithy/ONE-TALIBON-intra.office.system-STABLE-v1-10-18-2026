import type { ReactNode } from 'react';

export const sectionId = (title: string) => 'dashboard-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');

export function jumpToSection(title: string) {
    const target = document.getElementById(sectionId(title));
    target?.focus({ preventScroll: true });
    target?.scrollIntoView({ block: 'start', behavior: 'instant' });
}

export default function DashboardSection({ title, description, action, children }: {
    title: string; description?: string; action?: ReactNode; children: ReactNode;
}) {
    return <section className="dashboard-section" id={sectionId(title)} tabIndex={-1} aria-label={title}>
        <header className="dashboard-section-heading">
            <div><h2>{title}</h2>{description && <p>{description}</p>}</div>
            {action}
        </header>
        {children}
    </section>;
}
export function EmptyState({ children }: { children: ReactNode }) {
    return <p className="dashboard-empty">{children}</p>;
}
