import { talibonAssets } from '../../branding/talibonAssets';
import type { PublicContent } from './types';

export default function PublicOfficeOverview({ content }: { content: PublicContent }) {
    return <section id="offices" className="public-about" aria-labelledby="public-offices-title">
        <figure className="public-about-visual" aria-label="Talibon municipal landmark placeholder">
            <img src={talibonAssets.publicLandmark} alt="" />
        </figure>
        <div className="public-about-copy">
            <p className="public-about-place">{content.officeOverview.eyebrow}</p>
            <h2 id="public-offices-title">{content.officeOverview.title}</h2>
            <p className="public-about-description">{content.officeOverview.description}</p>
        </div>
    </section>;
}
