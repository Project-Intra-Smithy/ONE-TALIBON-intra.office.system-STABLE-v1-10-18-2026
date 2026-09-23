import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark, MapPin } from 'lucide-react';
import MunicipalBrand from '../MunicipalBrand';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer id="contact" className="public-footer">
        <div className="public-footer-grid">
            <div className="public-footer-identity">
                <MunicipalBrand inverse />
                <p className="public-footer-municipality"><Landmark size={15} aria-hidden="true" />{content.municipality}</p>
                <p className="public-footer-location"><MapPin size={15} aria-hidden="true" />{content.contact.location}</p>
                <p className="public-footer-note">Prototype presentation. Official municipal content and final photography remain subject to LGU confirmation.</p>
            </div>

            <nav aria-label="Footer portal overview links" className="public-footer-links">
                <h2>Portal Overview</h2>
                <a href="#home">Overview</a>
                <a href="#capabilities">Capabilities</a>
                <a href="#workflow">How Work Moves</a>
                <a href="#offices">Connected Offices</a>
                <a href="#secure-access">Secure Access</a>
            </nav>

            <div className="public-footer-access">
                <h2>Authorized Access</h2>
                <p>Authorized municipal personnel use the secure LGU Intra-Office Portal for official internal work.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-footer-login">
                    {authenticated ? 'Open Portal' : 'Login to Portal'}
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
                <div className="public-footer-contact">
                    <h3>Pre-Login Boundary</h3>
                    <p>{content.secureAccess.note}</p>
                </div>
            </div>
        </div>
        <div className="public-footer-bottom">
            <span>ONE TALIBON · Municipality of Talibon, Bohol</span>
            <span>LGU Intra-Office Portal</span>
        </div>
    </footer>;
}
