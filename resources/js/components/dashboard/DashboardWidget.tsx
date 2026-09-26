import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

export default function DashboardWidget({ title, icon: Icon, href, count, children, className = '' }: { title: string; icon: LucideIcon; href?: string; count?: number; children: ReactNode; className?: string }) {
    return <section className={`dashboard-widget ${className}`} aria-label={title}>
        <header className="dashboard-widget-header"><div><Icon size={15} aria-hidden="true" /><h2>{title}</h2>{count !== undefined && <span className="dashboard-count">{count}</span>}</div>{href && <Link href={href}>View all<span className="sr-only">: {title}</span></Link>}</header>
        {children}
    </section>;
}
