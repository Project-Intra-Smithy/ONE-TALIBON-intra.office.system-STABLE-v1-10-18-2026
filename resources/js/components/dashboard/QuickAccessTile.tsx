import { Link } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';
import type { CSSProperties } from 'react';
const colors: Record<string, [string, string]> = {
    documentCenter: ['#EAF5ED', '#166534'], memoranda: ['#EAF3FE', '#1768B5'], ppas: ['#FFF5DF', '#B77708'], calendar: ['#FFF0EC', '#C64448'], announcements: ['#F1ECFC', '#7252A8'], myWork: ['#E7F5F4', '#147D76'], executiveDepartments: ['#F6F1E3', '#8B671F'], developmentPlans: ['#FBEAF1', '#B93873'],
};
export default function QuickAccessTile({ destinationKey, label, href, icon: Icon }: { destinationKey: string; label: string; href: string; icon: LucideIcon }) {
    const [background, color] = colors[destinationKey] || colors.documentCenter;
    return <Link href={href} className="dashboard-quick-tile" style={{ '--tile-background': background, '--tile-color': color } as CSSProperties}><Icon size={32} strokeWidth={1.8} aria-hidden="true" /><span>{label}</span></Link>;
}
