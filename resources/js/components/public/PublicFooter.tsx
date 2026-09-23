import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark } from 'lucide-react';
import MunicipalBrand from '../MunicipalBrand';
import type { PublicContent } from './types';

export default function PublicFooter({ content, authenticated }: { content: PublicContent; authenticated: boolean }) {
    return <footer className="public-footer">
        <div className="public-footer-grid" style={{ maxWidth: '1360px' }}>
            <div className="public-footer-identity">
                <MunicipalBrand inverse />
                <p className="public-footer-municipality"><Landmark size={15} aria-hidden="true" />{content.municipality}</p>
                <p className="public-footer-note">LGU Intra-Office Portal · For authorized municipal personnel.</p>
            </div>

            <nav aria-label="Footer portal links" className="public-footer-links">
                <h2>Portal</h2>
                <a href="#home">Overview</a>
                <a href="#capabilities">Capabilities</a>
                <a href="#workflow">Workflow</a>
                <a href="#secure-access">Security</a>
            </nav>

            <div className="public-footer-access">
                <h2>Access</h2>
                <p>Authorized municipal personnel enter the authenticated workspace to continue official work.</p>
                <Link href={authenticated ? '/dashboard' : '/login'} className="public-footer-login">
                    {authenticated ? 'Open Portal' : 'Login to Portal'}
                    <ArrowRight size={15} aria-hidden="true" />
                </Link>
            </div>
        </div>
        <div className="public-footer-bottom" style={{ maxWidth: '1360px' }}>
            <span>ONE TALIBON · Municipality of Talibon, Bohol</span>
            <span>LGU Intra-Office Portal</span>
        </div>
    </footer>;
}
