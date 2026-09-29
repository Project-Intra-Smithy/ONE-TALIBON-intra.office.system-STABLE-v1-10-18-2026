import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark, MapPin } from 'lucide-react';
import MunicipalBrand from '../MunicipalBrand';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer className="public-footer">
        <div
            className="public-footer-grid"
            style={{ maxWidth: '1360px', gap: '28px', paddingTop: '30px', paddingBottom: '24px' }}
        >
            <div className="public-footer-identity">
                <MunicipalBrand inverse publicPortal />
                <p className="public-footer-municipality"><Landmark size={15} aria-hidden="true" />{content.municipality}</p>
                <p className="public-footer-location"><MapPin size={14} aria-hidden="true" />{content.contact.location}</p>
                <p className="public-footer-note">Municipal public information and secure employee access in one ONE TALIBON gateway. Prototype/sample content remains labeled.</p>
            </div>

            <nav aria-label="Footer public links" className="public-footer-links">
                <h2>Public portal</h2>
                <a href="#services">Services</a>
                <a href="#news">Updates</a>
                <a href="#transparency">Transparency</a>
                <a href="#about">About</a>
                <a href="#contact">Contact</a>
            </nav>

            <div className="public-footer-access">
                <h2>Employee access</h2>
                <p>Protected municipal work continues only inside the authenticated LGU workspace.</p>
                <Link
                    href={authenticated ? '/dashboard' : '/login'}
                    className="public-footer-login"
                    style={{ marginTop: '12px' }}
                >
                    {authenticated ? 'Open Employee Portal' : 'Employee Login'}
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
            </div>
        </div>
        <div
            className="public-footer-bottom"
            style={{ maxWidth: '1360px', paddingTop: '10px', paddingBottom: '12px' }}
        >
            <span>ONE TALIBON · Municipality of Talibon, Bohol</span>
            <span>Municipal Public Portal</span>
        </div>
    </footer>;
}
