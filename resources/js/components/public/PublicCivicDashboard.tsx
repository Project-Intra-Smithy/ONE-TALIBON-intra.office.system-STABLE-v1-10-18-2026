import { ArrowLeftRight, BellRing, CalendarDays, ClipboardCheck, FileText, UsersRound } from 'lucide-react';
import type { CapabilityItem, PublicContent } from './types';
const capabilityIcons: Record<CapabilityItem['id'], typeof FileText> = {
    transactions: ArrowLeftRight, documents: FileText, projects: ClipboardCheck,
    people: UsersRound, calendar: CalendarDays, 'follow-up': BellRing,
};
export default function PublicCivicDashboard({ content }: { content: PublicContent }) {
    const capabilities = content.capabilities.items.filter(item => item.id !== 'projects');
    return <section id="capabilities" tabIndex={-1} className="section" aria-labelledby="public-capabilities-title">
        <div className="wrap caps">
            <div className="caps-intro">
                <p className="label">Internal portal capabilities</p>
                <h2 id="public-capabilities-title">{content.capabilities.title}</h2>
                <p>{content.capabilities.description}</p>
                <span className="label">Available to authorized employees</span>
            </div>
            <ul className="cap-list">
                {capabilities.map(item => {
                    const Icon = capabilityIcons[item.id];
                    return <li key={item.id} className="cap">
                        <Icon className="icon" aria-hidden="true" /><h3>{item.title}</h3>
                        <div><p>{item.description}</p>
                            {item.detail.note && item.detail.note !== 'Available inside the authenticated portal.' && <p>{item.detail.note}</p>}
                        </div>
                    </li>;
                })}
            </ul>
        </div>
    </section>;
}
