import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicSecureAccess({ content, authenticated }: Props) {
    return <section
        id="secure-access"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} py-10 md:py-12 lg:py-14`}
        aria-labelledby="public-secure-access-title"
    >
        <div className="grid items-center gap-5 rounded-xl border p-5 md:grid-cols-[minmax(0,1fr)_auto] md:p-6 lg:p-7 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
            <div className="min-w-0">
                <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg [background:var(--municipal-deep)] [color:var(--municipal-gold)]">
                        <LockKeyhole size={18} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">{content.secureAccess.eyebrow}</p>
                        <h2 id="public-secure-access-title" className="mt-0.5 text-lg font-extrabold tracking-[-0.02em] [color:var(--public-text)] md:text-xl">{content.secureAccess.title}</h2>
                    </div>
                </div>

                <p className="mt-3 max-w-2xl text-[13px] leading-5 [color:var(--public-muted)]">Official work continues inside the authenticated Talibon Intra-Office Portal.</p>
                <ul className="mt-3 grid gap-1.5 sm:grid-cols-3">
                    {content.secureAccess.trustPoints.map(point => <li key={point} className="flex items-start gap-1.5 text-[11px] leading-[1.4] [color:var(--public-text)]">
                        <CheckCircle2 size={14} className="mt-0.5 shrink-0 [color:var(--public-link)]" aria-hidden="true" />
                        <span>{point}</span>
                    </li>)}
                </ul>
            </div>

            <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action w-full md:min-w-[150px] md:w-auto">
                {authenticated ? 'Open Portal' : 'Login to Portal'}
                <ArrowRight size={16} aria-hidden="true" />
            </Link>
        </div>
    </section>;
}
