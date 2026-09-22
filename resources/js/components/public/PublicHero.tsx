import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

const intraOfficeFocus = [
    'Coordinated Offices',
    'Official Workflows',
    'Authorized Access',
];

export default function PublicHero({ content }: { content: PublicContent }) {
    return <section id="home" className="public-hero" aria-labelledby="public-hero-title">
        <img className="public-hero-image" src={talibonAssets.publicHero} alt="" />
        <div className="public-hero-overlay" />
        <div className="public-hero-inner">
            <div className="public-hero-copy">
                <p className="public-hero-eyebrow">ONE TALIBON</p>
                <h1 id="public-hero-title" className="public-hero-title">ONE PORTAL.</h1>
                <p className="public-hero-lead">CONNECTED OFFICES.<br />BETTER SERVICE.</p>
                <p className="public-hero-description">
                    A secure municipal workspace for coordinating offices, documents, requests, employees, projects, schedules, and official workflows across the LGU.
                </p>
                <div className="public-hero-actions">
                    <a href="/login" className="public-primary-action">
                        Login to Portal
                        <ArrowRight size={16} aria-hidden="true" />
                    </a>
                </div>
            </div>
            <div className="public-civic-values" aria-label={`${content.government.surfaceLabel} focus areas`}>
                {intraOfficeFocus.map(value => <span key={value}>
                    <CheckCircle2 size={15} aria-hidden="true" />
                    {value}
                </span>)}
            </div>
        </div>
    </section>;
}
