import { Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicSecureAccess({ content, authenticated }: Props) {
    return <section id="secure-access" className="public-official-information" aria-labelledby="public-secure-access-title">
        <header className="public-official-header">
            <p className="public-official-kicker">{content.secureAccess.eyebrow}</p>
            <h2 id="public-secure-access-title">{content.secureAccess.title}</h2>
            <p>{content.secureAccess.description}</p>
        </header>

        <div className="border-y py-5 [border-color:var(--public-divider)]">
            <p className="max-w-2xl text-sm leading-6 [color:var(--public-muted)]">{content.secureAccess.note}</p>
            <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action mt-5">
                {authenticated ? 'Open Portal' : 'Login to Portal'}
                <ArrowRight size={16} aria-hidden="true" />
            </Link>
        </div>
    </section>;
}
