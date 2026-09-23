import { CheckCircle2 } from 'lucide-react';
import type { CapabilityItem, PublicContent } from './types';

function CapabilityRow({ capability }: { capability: CapabilityItem }) {
    return <li className="public-capability-row">
        <div className="public-capability-copy">
            <h3>{capability.title}</h3>
            <p>{capability.description}</p>
        </div>
        <CheckCircle2 size={18} aria-hidden="true" />
    </li>;
}

export default function PublicCapabilities({ content }: { content: PublicContent }) {
    const groups = [content.capabilities.items.slice(0, 3), content.capabilities.items.slice(3)];

    return <section id="capabilities" className="public-capabilities" aria-labelledby="public-capabilities-title">
        <div className="public-section-heading">
            <div>
                <h2 id="public-capabilities-title">{content.capabilities.title}</h2>
                <p>{content.capabilities.description}</p>
            </div>
        </div>

        <div className="public-capability-grid">
            {groups.map((items, index) => <div key={index} className="public-capability-column">
                <ul className="public-capability-list">
                    {items.map(capability => <CapabilityRow key={capability.id} capability={capability} />)}
                </ul>
            </div>)}
        </div>
    </section>;
}
