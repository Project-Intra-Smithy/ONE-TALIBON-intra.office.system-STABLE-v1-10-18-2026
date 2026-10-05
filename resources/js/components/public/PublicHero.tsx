import { Link } from '@inertiajs/react';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

type Props = {
    content: PublicContent;
    authenticated: boolean;
};

export default function PublicHero({ content, authenticated }: Props) {
    return <section
        id="home"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className="public-reference-hero public-gateway-hero"
        aria-labelledby="public-hero-title"
    >
        <img
            src={talibonAssets.publicHero}
            alt=""
            className="public-reference-hero-image"
        />
        <div className="public-reference-hero-overlay" aria-hidden="true" />

        <div className="public-reference-hero-copy">
            <p className="public-reference-hero-eyebrow">{content.hero.eyebrow}</p>
            <h1 id="public-hero-title">{content.hero.title}</h1>
            <p className="public-reference-hero-lead">{content.hero.lead}</p>
            <p className="public-reference-hero-description">Manage documents, memoranda, schedules, requests, and office coordination in one secure workspace.</p>

            <div className="public-gateway-hero-actions">
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action public-gateway-login">
                    {authenticated ? 'Open Employee Portal' : 'Employee Login'}
                    <ArrowRight size={16} aria-hidden="true" />
                </Link>
                <a href="#about-portal" className="public-secondary-action public-gateway-secondary-action">
                    About the Portal
                </a>
            </div>

            <p className="public-gateway-hero-trust">
                <ShieldCheck size={14} aria-hidden="true" />
                Authorized municipal personnel only · protected operational records remain inside authenticated access.
            </p>
        </div>
    </section>;
}
