import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

type Props = {
    content: PublicContent;
    authenticated: boolean;
};

export default function PublicHero({ content, authenticated }: Props) {
    return <section id="home" className="public-hero" aria-labelledby="public-hero-title">
        <div className="public-hero-intro">
            <div className="public-hero-copy">
                <p className="public-welcome">{content.hero.eyebrow}</p>
                <h1 id="public-hero-title" className="public-hero-title">{content.hero.title}</h1>
                <p className="public-hero-lead">{content.hero.lead}</p>
                <p className="public-hero-description">{content.hero.description}</p>
                <div className="public-hero-actions">
                    <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action">
                        {authenticated ? 'Open Portal' : 'Login to Portal'}
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                </div>
            </div>
            <figure className="public-hero-landscape" aria-label="Talibon municipal landscape placeholder">
                <img src={talibonAssets.publicHero} alt="" />
                <figcaption>Talibon, Bohol</figcaption>
            </figure>
        </div>
    </section>;
}
