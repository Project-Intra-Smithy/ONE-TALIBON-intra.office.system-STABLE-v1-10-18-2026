import { Link } from '@inertiajs/react';
import { ArrowRight, Building2, FileSearch, MessageCircleMore, UserRoundCheck } from 'lucide-react';

type Props = { authenticated: boolean };

export default function PublicActionStrip({ authenticated }: Props) {
    return <section className="public-reference-actions" aria-label="Quick public access">
        <a href="#services" className="public-reference-action">
            <span className="public-reference-action-icon"><Building2 size={25} aria-hidden="true" /></span>
            <span className="public-reference-action-copy">
                <strong>Municipal Services</strong>
                <span>Find service guidance and office information.</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
        </a>

        <a href="#transparency" className="public-reference-action">
            <span className="public-reference-action-icon"><FileSearch size={25} aria-hidden="true" /></span>
            <span className="public-reference-action-copy">
                <strong>Public Information</strong>
                <span>Review notices, projects and document previews.</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
        </a>

        <Link href={authenticated ? '/dashboard' : '/login'} className="public-reference-action">
            <span className="public-reference-action-icon"><UserRoundCheck size={25} aria-hidden="true" /></span>
            <span className="public-reference-action-copy">
                <strong>Employee Portal</strong>
                <span>Secure access for authorized LGU personnel.</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
        </Link>

        <a href="#contact" className="public-reference-action">
            <span className="public-reference-action-icon"><MessageCircleMore size={25} aria-hidden="true" /></span>
            <span className="public-reference-action-copy">
                <strong>Contact / Concern</strong>
                <span>Find confirmed municipal contact information.</span>
            </span>
            <ArrowRight size={18} aria-hidden="true" />
        </a>
    </section>;
}
