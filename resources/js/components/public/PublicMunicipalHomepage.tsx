import PublicCivicDashboard from './PublicCivicDashboard';
import PublicHero from './PublicHero';
import PublicInstitutionalPanel from './PublicInstitutionalPanel';
import PublicSecureAccess from './PublicSecureAccess';
import { PUBLIC_CONTENT_FRAME_CLASS } from './publicLayout';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicMunicipalHomepage({ content, authenticated }: Props) {
    return <div className={`${PUBLIC_CONTENT_FRAME_CLASS} public-reference-shell public-gateway-shell`}>
        <PublicHero content={content} authenticated={authenticated} />
        <PublicCivicDashboard content={content} />
        <PublicInstitutionalPanel content={content} />
        <PublicSecureAccess content={content} authenticated={authenticated} />
    </div>;
}
