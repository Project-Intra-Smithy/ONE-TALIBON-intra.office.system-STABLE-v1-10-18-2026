import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark, Mail, MapPin, Phone } from 'lucide-react';
import MunicipalBrand from '../MunicipalBrand';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer id="contact" className="public-footer public-reference-footer">
        <div className="public-reference-footer-grid">
            <section className="public-reference-footer-identity" aria-label="Municipality contact">
                <MunicipalBrand inverse publicPortal />
                <p><Landmark size={14} aria-hidden="true" /> {content.municipality}</p>
                <p><MapPin size={14} aria-hidden="true" /> {content.contact.location}</p>
                <p><Mail size={14} aria-hidden="true" /> talibonofficial@gmail.com</p>
                <p><Phone size={14} aria-hidden="true" /> Office of Mayor: (038) 422-2895</p>
            </section>

            <nav className="public-reference-footer-links" aria-label="Public portal quick links">
                <h2>Quick Links</h2>
                <a href="#services">Municipal Services</a>
                <a href="#news">News & Events</a>
                <a href="#projects">Projects</a>
                <a href="#transparency">Transparency</a>
                <a href="#about">About Talibon</a>
            </nav>

            <section className="public-reference-footer-access">
                <h2>Employee Access</h2>
                <p>Protected municipal workflows remain inside the authenticated LGU workspace.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-reference-footer-login">
                    {authenticated ? 'Open Employee Portal' : 'Employee Login'}
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
            </section>

            <section className="public-reference-footer-mark" aria-label="ONE TALIBON identity">
                <Landmark size={30} aria-hidden="true" />
                <div>
                    <strong><span>ONE</span> TALIBON</strong>
                    <small>Municipal Digital Portal</small>
                </div>
            </section>
        </div>

        <div className="public-reference-footer-bottom">
            <span>ONE TALIBON · Municipality of Talibon, Bohol</span>
            <span>Prototype public portal · No protected operational records displayed</span>
        </div>
    </footer>;
}
