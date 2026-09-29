import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicSecureAccess({ content, authenticated }: Props) {
    return <section
        id="secure-access"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} public-gateway-secure-access`}
        aria-labelledby="public-secure-access-title"
    >
        <div className="public-gateway-secure-copy">
            <span className="public-gateway-secure-icon"><LockKeyhole size={19} aria-hidden="true" /></span>
            <div>
                <p>{content.secureAccess.eyebrow}</p>
                <h2 id="public-secure-access-title">{content.secureAccess.title}</h2>
                <span>{content.secureAccess.description}</span>
            </div>
        </div>

        <ul className="public-gateway-trust-list">
            {content.secureAccess.trustPoints.map(point => <li key={point}>
                <CheckCircle2 size={14} aria-hidden="true" />
                <span>{point}</span>
            </li>)}
        </ul>

        <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action public-gateway-secure-login">
            {authenticated ? 'Open Employee Portal' : 'Employee Login'}
            <ArrowRight size={16} aria-hidden="true" />
        </Link>
    </section>;
}
