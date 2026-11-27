import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';
export default function PublicFooter({ content }: { content: PublicContent; authenticated: boolean }) {
    return <footer id="contact" className="footer">
        <div className="wrap footer-grid">
            <div>
                <a className="brand" href="#home"><img src={talibonAssets.municipalSeal} alt="" width="36" height="36" loading="lazy" />
                    <span><span className="brand-name">ONE TALIBON</span><span className="brand-sub">Municipal Public Portal</span></span>
                </a>
                <address className="address">{content.municipality}<br />{content.contact.location}</address>
            </div>
            <nav className="footer-links" aria-label="Footer">
                <a href="#about-portal">About the Portal</a><a href="#capabilities">Internal Capabilities</a><a href="#support">Help / Support</a>
            </nav>
        </div>
        <div className="legal"><div className="wrap">
            <span>ONE TALIBON &middot; {content.municipality}</span><span>Intra-Office Portal &middot; Authorized municipal personnel</span>
        </div></div>
    </footer>;
}
