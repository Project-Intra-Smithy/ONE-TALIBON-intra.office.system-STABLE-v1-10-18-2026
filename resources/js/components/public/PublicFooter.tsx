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
                    <small>Province of Bohol · LGU Intra-Office Portal</small>
                </div>
                <p><MapPin size={15} aria-hidden="true" />{content.contact.location}</p>
                <p className="public-footer-note">Pre-login portal overview for authorized municipal personnel. Sign in to access the authenticated municipal workspace.</p>
            </div>

            <nav className="public-footer-links" aria-label="Portal overview footer links">
                <h2>Portal Overview</h2>
                {content.navigation.slice(1).map(item => <a key={item.label} href={item.href}>{item.label}</a>)}
            </nav>

            <div className="public-footer-contact">
                <h2>Municipal Information</h2>
                <p>{content.contact.description}</p>
                {content.contact.telephone && <p>{content.contact.telephone}</p>}
                {content.contact.email && <p>{content.contact.email}</p>}
                {content.contact.officeHours && <p>{content.contact.officeHours}</p>}
                <a href="#services">Portal overview <ArrowRight size={14} aria-hidden="true" /></a>
            </div>

            <div className="public-footer-employee">
                <h2>Authorized Access</h2>
                <p>The LGU Intra-Office Portal is for authorized municipal personnel.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-footer-login">
                    <Building2 size={16} aria-hidden="true" />
                    {authenticated ? 'Portal' : 'Login'}
                    <ArrowRight size={14} aria-hidden="true" />
                </Link>
            </div>
        </div>
        <div className="public-footer-bottom">
            <span>Municipality of Talibon · Province of Bohol</span>
            <strong>LGU INTRA-OFFICE PORTAL</strong>
        </div>
    </footer>;
}
