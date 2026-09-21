import {
    ArrowRight,
    Building2,
    BriefcaseBusiness,
    FileText,
    Info,
    Landmark,
    MapPinned,
    Newspaper,
} from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

const iconById = {
    news: Newspaper,
    tourism: MapPinned,
    services: Landmark,
    transparency: FileText,
    officials: Building2,
    business: BriefcaseBusiness,
    'public-information': Info,
} as const;

export default function PublicServices({ content }: { content: PublicContent }) {
    return <section className="public-feature-section" aria-labelledby="public-features-title">
        <div className="public-section-heading">
            <div>
                <span>Public Website Directory</span>
                <h2 id="public-features-title">Information and services for residents, visitors, and businesses</h2>
            </div>
            <p>Prototype content remains clearly identified until verified municipal records and official publishing workflows are supplied.</p>
        </div>

        <div className="public-feature-grid">
            {content.features.map(feature => {
                const Icon = iconById[feature.id as keyof typeof iconById] ?? Landmark;
                return <article key={feature.id} id={feature.id} className="public-feature-card">
                    <header>
                        <Icon size={21} aria-hidden="true" />
                        <div>
                            <h3>{feature.title}</h3>
                            <p>{feature.description}</p>
                        </div>
                    </header>
                    <div className="public-feature-visual" aria-hidden="true">
                        <img
                            src={feature.image || (feature.id === 'tourism' ? talibonAssets.publicPromoImage : talibonAssets.publicLandmark)}
                            alt=""
                        />
                    </div>
                    <ul>
                        {feature.items.map(item => <li key={item}>{item}</li>)}
                    </ul>
                    {feature.href && feature.action
                        ? <a className="public-feature-action" href={feature.href}>
                            {feature.action}<ArrowRight size={14} aria-hidden="true" />
                        </a>
                        : feature.id === 'officials'
                            ? <span className="public-feature-unavailable">Verified directory data pending</span>
                            : null}
                </article>;
            })}
        </div>
    </section>;
}
