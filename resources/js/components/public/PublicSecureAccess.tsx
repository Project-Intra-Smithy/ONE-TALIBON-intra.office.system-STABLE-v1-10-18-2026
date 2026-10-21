import { Link } from '@inertiajs/react';
import { ArrowRight, Check } from 'lucide-react';
import type { PublicContent } from './types';
type Props = { content: PublicContent; authenticated: boolean };
export default function PublicSecureAccess({ content, authenticated }: Props) {
    return <section id="secure-access" className="secure" aria-labelledby="public-secure-access-title">
        <div className="wrap secure-grid">
            <div><p className="label">{content.secureAccess.eyebrow}</p>
                <h2 id="public-secure-access-title">{content.secureAccess.title === 'SECURE MUNICIPAL WORKSPACE' ? 'Secure municipal workspace.' : content.secureAccess.title}</h2>
                <p>{content.secureAccess.description}</p></div>
            <ul className="checks">{content.secureAccess.trustPoints.map(point => <li key={point}><Check className="icon" aria-hidden="true" />{point}</li>)}</ul>
            <Link href={authenticated ? '/dashboard' : '/login'} className="btn btn-light">
                {authenticated ? 'Open Employee Portal' : 'Employee Login'}<ArrowRight className="icon" aria-hidden="true" />
            </Link>
        </div>
    </section>;
}
