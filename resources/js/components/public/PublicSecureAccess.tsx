import { Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, LockKeyhole } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

type Props = { content: PublicContent; authenticated: boolean };

export default function PublicSecureAccess({ content, authenticated }: Props) {
    return <section
        id="secure-access"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} py-12 md:py-16 lg:py-20`}
        aria-labelledby="public-secure-access-title"
    >
        <div className="grid items-center gap-6 rounded-xl border p-6 md:grid-cols-[minmax(0,1fr)_auto] md:p-8 lg:p-10 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
            <div className="min-w-0">
                <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg [background:var(--municipal-deep)] [color:var(--municipal-gold)]">
                        <LockKeyhole size={20} aria-hidden="true" />
                    </span>
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">{content.secureAccess.eyebrow}</p>
                        <h2 id="public-secure-access-title" className="mt-1 text-xl font-extrabold tracking-[-0.02em] [color:var(--public-text)] md:text-2xl">{content.secureAccess.title}</h2>
                    </div>
                </div>

                <p className="mt-5 max-w-2xl text-sm leading-6 [color:var(--public-muted)]">{content.secureAccess.description}</p>
                <ul className="mt-5 grid gap-2 sm:grid-cols-3">
                    {content.secureAccess.trustPoints.map(point => <li key={point} className="flex items-start gap-2 text-[12px] leading-5 [color:var(--public-text)]">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 [color:var(--public-link)]" aria-hidden="true" />
                        <span>{point}</span>
                    </li>)}
                </ul>
                <p className="mt-4 text-[11px] font-medium [color:var(--public-muted)]">{content.secureAccess.note}</p>
            </div>

            <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action w-full md:w-auto">
                {authenticated ? 'Open Portal' : 'Login to Portal'}
                <ArrowRight size={16} aria-hidden="true" />
            </Link>
        </div>
    </section>;
}
