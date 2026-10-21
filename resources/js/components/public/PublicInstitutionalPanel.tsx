import { MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';
export default function PublicInstitutionalPanel({ content }: { content: PublicContent }) {
    return <section id="about-portal" tabIndex={-1} className="about section" aria-labelledby="public-about-portal-title">
        <div className="wrap about-grid">
            <div className="about-main">
                <img src={talibonAssets.municipalSeal} alt="Municipal identity placeholder" width="64" height="64" loading="lazy" />
                <div>
                    <p className="label">{content.about.eyebrow}</p>
                    <h2 id="public-about-portal-title">{content.about.title}</h2>
                    <p>{content.about.description}</p>
                    <p className="place"><MapPin className="icon" aria-hidden="true" />{content.municipality}</p>
                </div>
            </div>
            <dl className="facts" id="support" tabIndex={-1}>
                <div><dt>Access boundary</dt><dd>Internal records, transactions, approvals, and employee information require authenticated access.</dd></div>
                <div><dt>{content.contact.heading}</dt><dd>{content.contact.description}</dd></div>
            </dl>
        </div>
    </section>;
}
