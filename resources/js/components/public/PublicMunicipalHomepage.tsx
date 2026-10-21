import PublicCivicDashboard from './PublicCivicDashboard';
import PublicInstitutionalPanel from './PublicInstitutionalPanel';
import PublicSecureAccess from './PublicSecureAccess';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicMunicipalHomepage({ content, authenticated }: Props) {
    return <>
        <PublicCivicDashboard content={content} />
        <PublicInstitutionalPanel content={content} />
        <PublicSecureAccess content={content} authenticated={authenticated} />
    </>;
}
