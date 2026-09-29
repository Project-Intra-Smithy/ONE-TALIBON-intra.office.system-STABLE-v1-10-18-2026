import { MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

export default function PublicHero({ content }: { content: PublicContent }) {
    return <section
        id="home"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className="public-reference-hero"
        aria-labelledby="public-hero-title"
    >
        <img
            src={talibonAssets.publicHero}
            alt="Municipality of Talibon, Bohol"
            className="public-reference-hero-image"
        />
        <div className="public-reference-hero-overlay" aria-hidden="true" />

        <div className="public-reference-hero-copy">
            <p className="public-reference-hero-eyebrow">{content.hero.eyebrow}</p>
            <h1 id="public-hero-title">{content.hero.title}</h1>
            <p className="public-reference-hero-lead">{content.hero.lead}</p>
            <p className="public-reference-hero-description">{content.hero.description}</p>
            <p className="public-reference-hero-location"><MapPin size={13} aria-hidden="true" /> Municipality of Talibon · Province of Bohol</p>
        </div>
    </section>;
}
