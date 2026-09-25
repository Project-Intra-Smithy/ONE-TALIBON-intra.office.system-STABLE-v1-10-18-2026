import { BookOpenCheck, Building2, FileDown, FileText, Gavel, PhoneCall, ScrollText } from 'lucide-react';
import type { PublicContent } from './types';

const icons = [FileDown, BookOpenCheck, Building2, FileText, Gavel, PhoneCall, ScrollText];

export default function PublicQuickAccess({ content }: { content: PublicContent }) {
    return <section className="public-quick-strip" aria-labelledby="public-quick-access-title">
        <div className="public-quick-label">
            <span>Citizen Resources</span>
            <h2 id="public-quick-access-title">Quick Access</h2>
        </div>
        <div className="public-quick-items">
            {content.quickAccess.map((item, index) => {
                const Icon = icons[index] ?? FileText;
                return item.href
                    ? <a key={item.label} href={item.href} className="public-quick-item">
                        <Icon size={19} aria-hidden="true" />
                        <span>{item.label}</span>
                    </a>
                    : <div key={item.label} className="public-quick-item is-static" aria-label={`${item.label}, information pending`}>
                        <Icon size={19} aria-hidden="true" />
                        <span>{item.label}</span>
                    </div>;
            })}
        </div>
    </section>;
}
