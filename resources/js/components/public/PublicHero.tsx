import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

export default function PublicHero({ content }: { content: PublicContent }) {
    return <section id="home" className="public-hero" aria-labelledby="public-hero-title">
        <img className="public-hero-image" src={talibonAssets.publicHero} alt="" />
        <div className="public-hero-overlay" />
        <div className="public-hero-inner">
            <div className="public-hero-copy">
                <p className="public-hero-eyebrow">{content.hero.eyebrow}</p>
                <h1 id="public-hero-title" className="public-hero-title">{content.hero.title}</h1>
                <p className="public-hero-lead">{content.hero.lead}</p>
                <p className="public-hero-description">{content.hero.description}</p>
                <div className="public-hero-actions">
                    <a href="#services" className="public-primary-action">
                        Explore Public Services
                        <ArrowRight size={16} aria-hidden="true" />
                    </a>
                    <a href="#tourism" className="public-secondary-action">Discover Talibon</a>
                </div>
            </div>
            <div className="public-civic-values" aria-label="Public website focus areas">
                {content.hero.values.map(value => <span key={value}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {value}
                </span>)}
            </div>
        </div>
    </section>;
}
