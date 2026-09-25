import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer id="contact" className="public-footer">
        <div className="public-footer-grid">
            <div className="public-footer-identity">
                <img src={talibonAssets.municipalSeal} alt="" className="public-footer-seal" />
                <div>
                    <span>Municipality of</span>
                    <strong>Talibon</strong>
                    <small>Province of Bohol · Public Website</small>
                </div>
                <p><MapPin size={15} aria-hidden="true" />{content.contact.location}</p>
                <p className="public-footer-note">Prototype public website. Sample information is for interface evaluation and is not an official municipal publication.</p>
            </div>

            <nav className="public-footer-links" aria-label="Public website footer links">
                <h2>Public Website</h2>
                {content.navigation.slice(1).map(item => <a key={item.label} href={item.href}>{item.label}</a>)}
            </nav>

            <div className="public-footer-contact">
                <h2>Contact &amp; Guidance</h2>
                <p>{content.contact.description}</p>
                {content.contact.telephone && <p>{content.contact.telephone}</p>}
                {content.contact.email && <p>{content.contact.email}</p>}
                {content.contact.officeHours && <p>{content.contact.officeHours}</p>}
                <a href="#services">Municipal service guidance <ArrowRight size={14} aria-hidden="true" /></a>
            </div>

            <div className="public-footer-employee">
                <h2>Employee Access</h2>
                <p>The authenticated LGU Intra-Office Portal is a separate workspace for authorized municipal employees.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-footer-login">
                    <Building2 size={16} aria-hidden="true" />
                    {authenticated ? 'Open Employee Intra-Office Portal' : 'Employee Intra-Office Portal'}
                    <ArrowRight size={14} aria-hidden="true" />
                </Link>
            </div>
        </div>
        <div className="public-footer-bottom">
            <span>Municipality of Talibon · Province of Bohol</span>
            <strong>PUBLIC WEBSITE</strong>
        </div>
    </footer>;
}
