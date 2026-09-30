import { CircleHelp, LockKeyhole, MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

export default function PublicInstitutionalPanel({ content }: { content: PublicContent }) {
    return <section
        id="about-portal"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className="public-gateway-institutional"
        aria-labelledby="public-about-portal-title"
    >
        <div className="public-gateway-institutional-main">
            <img src={talibonAssets.municipalHallEmblem} alt="Talibon Municipal Hall emblem" />
            <div>
                <p className="public-gateway-kicker">{content.about.eyebrow}</p>
                <h2 id="public-about-portal-title">{content.about.title}</h2>
                <p>{content.about.description}</p>
                <span><MapPin size={13} aria-hidden="true" /> Municipality of Talibon · Province of Bohol</span>
            </div>
        </div>

        <div id="support" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-gateway-support">
            <div className="public-gateway-support-item">
                <LockKeyhole size={18} aria-hidden="true" />
                <div>
                    <strong>Access boundary</strong>
                    <p>Internal records, transactions, approvals, and employee information require authenticated access.</p>
                </div>
            </div>
            <div className="public-gateway-support-item">
                <CircleHelp size={18} aria-hidden="true" />
                <div>
                    <strong>{content.contact.heading}</strong>
                    <p>{content.contact.description}</p>
                </div>
            </div>
        </div>
    </section>;
}
