import PublicActionStrip from './PublicActionStrip';
import PublicCivicDashboard from './PublicCivicDashboard';
import PublicHero from './PublicHero';
import PublicSideRail from './PublicSideRail';
import { PUBLIC_CONTENT_FRAME_CLASS } from './publicLayout';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicMunicipalHomepage({ content, authenticated }: Props) {
    return <div className={`${PUBLIC_CONTENT_FRAME_CLASS} public-reference-shell`}>
        <div className="public-reference-layout">
            <div className="public-reference-main">
                <PublicHero content={content} />
                <PublicActionStrip authenticated={authenticated} />
                <PublicCivicDashboard content={content} />
            </div>
            <PublicSideRail content={content} />
        </div>
    </div>;
}
