import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark, MapPin } from 'lucide-react';
import MunicipalBrand from '../MunicipalBrand';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer id="contact" className="public-footer public-reference-footer">
        <div className="public-reference-footer-grid public-gateway-footer-grid">
            <section className="public-reference-footer-identity" aria-label="Municipality identity">
                <MunicipalBrand inverse publicPortal />
                <p><Landmark size={14} aria-hidden="true" /> {content.municipality}</p>
                <p><MapPin size={14} aria-hidden="true" /> {content.contact.location}</p>
            </section>

            <nav className="public-reference-footer-links" aria-label="Portal quick links">
                <h2>Portal</h2>
                <a href="#about-portal">About the Portal</a>
                <a href="#capabilities">Internal Capabilities</a>
                <a href="#support">Help / Support</a>
            </nav>

            <section className="public-reference-footer-access">
                <h2>Authorized Access</h2>
                <p>Protected municipal operations continue only inside the authenticated Talibon Intra-Office Portal.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-reference-footer-login">
                    {authenticated ? 'Open Employee Portal' : 'Employee Login'}
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
            </section>

            <section className="public-reference-footer-mark" aria-label="ONE TALIBON Intra-Office Portal identity">
                <Landmark size={30} aria-hidden="true" />
                <div>
                    <strong><span>ONE</span> TALIBON</strong>
                    <small>Intra-Office Portal</small>
                </div>
            </section>
        </div>

        <div className="public-reference-footer-bottom">
            <span>ONE TALIBON · Municipality of Talibon, Bohol</span>
            <span>Intra-Office Portal · Authorized municipal personnel</span>
        </div>
    </footer>;
}
