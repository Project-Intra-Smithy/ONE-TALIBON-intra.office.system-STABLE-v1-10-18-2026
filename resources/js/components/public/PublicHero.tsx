import { ArrowRight } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

export default function PublicHero({ content }: { content: PublicContent }) {
    return <section id="home" className="public-hero" aria-labelledby="public-hero-title">
        <div className="public-hero-intro">
            <div className="public-hero-copy">
                <p className="public-welcome">{content.hero.eyebrow}</p>
                <h1 id="public-hero-title" className="public-hero-title">{content.hero.title}</h1>
                <p className="public-hero-lead">{content.hero.lead}</p>
                <p className="public-hero-description">{content.hero.description}</p>
                <div className="public-hero-actions">
                    <a href="/login" className="public-primary-action">
                        Login to Portal
                        <ArrowRight size={16} aria-hidden="true" />
                    </a>
                </div>
            </div>
            <figure className="public-hero-landscape" aria-label="Talibon municipal landscape placeholder">
                <img src={talibonAssets.publicHero} alt="" />
                <figcaption>Talibon, Bohol</figcaption>
            </figure>
        </div>
    </section>;
}
