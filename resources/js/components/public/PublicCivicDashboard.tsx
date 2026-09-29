import {
    ArrowLeftRight,
    BellRing,
    Building2,
    ClipboardCheck,
    FileText,
    UsersRound,
} from 'lucide-react';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { CapabilityItem, PublicContent } from './types';

const capabilityIcons: Record<CapabilityItem['id'], typeof FileText> = {
    transactions: ArrowLeftRight,
    documents: FileText,
    projects: ClipboardCheck,
    people: UsersRound,
    calendar: Building2,
    'follow-up': BellRing,
};

export default function PublicCivicDashboard({ content }: { content: PublicContent }) {
    return <section
        id="capabilities"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className="public-gateway-capabilities"
        aria-labelledby="public-capabilities-title"
    >
        <header className="public-gateway-section-heading">
            <div>
                <p>Internal Portal Capabilities</p>
                <h2 id="public-capabilities-title">{content.capabilities.title}</h2>
            </div>
            <span>Prototype scope · authenticated workspace</span>
        </header>

        <p className="public-gateway-section-intro">{content.capabilities.description}</p>

        <div className="public-gateway-capability-grid">
            {content.capabilities.items.map(capability => {
                const Icon = capabilityIcons[capability.id];

                return <article key={capability.id} className="public-gateway-capability">
                    <span className="public-gateway-capability-icon"><Icon size={19} aria-hidden="true" /></span>
                    <div>
                        <h3>{capability.title}</h3>
                        <p>{capability.description}</p>
                        <small>{capability.detail.note ?? 'Available to authorized personnel inside the portal.'}</small>
                    </div>
                </article>;
            })}
        </div>
    </section>;
}
