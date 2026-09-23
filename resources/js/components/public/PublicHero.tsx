import { Link } from '@inertiajs/react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import PublicPortalPreview from './PublicPortalPreview';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

type Props = {
    content: PublicContent;
    authenticated: boolean;
};

export default function PublicHero({ content, authenticated }: Props) {
    return <section
        id="home"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} public-hero overflow-hidden rounded-none lg:rounded-b-2xl [background:var(--municipal-deep)] text-white`}
        aria-labelledby="public-hero-title"
    >
        <div className="grid min-h-[520px] grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
            <div className="flex min-w-0 flex-col justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 lg:py-16 xl:px-14">
                <p className="text-xs font-extrabold uppercase tracking-[0.14em] [color:var(--municipal-gold)]">{content.hero.eyebrow}</p>
                <h1 id="public-hero-title" className="mt-3 max-w-[620px] text-[clamp(2.35rem,4.6vw,4.75rem)] font-extrabold leading-[0.98] tracking-[-0.045em] text-white">
                    {content.hero.title}
                </h1>
                <p className="mt-5 max-w-[560px] text-sm font-extrabold uppercase tracking-[0.08em] text-white/90 sm:text-base">{content.hero.lead}</p>
                <p className="mt-4 max-w-[620px] text-sm leading-6 text-white/80 sm:text-[15px]">{content.hero.description}</p>

                <div className="mt-7">
                    <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action">
                        {authenticated ? 'Open Portal' : 'Login to Portal'}
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <p className="mt-4 flex max-w-[520px] items-center gap-2 text-[11px] font-semibold leading-5 text-white/60">
                        <LockKeyhole size={14} className="shrink-0 [color:var(--municipal-gold)]" aria-hidden="true" />
                        Authorized personnel · Official workflows · Secure access
                    </p>
                </div>
            </div>

            <div className="relative flex min-w-0 items-center border-t border-white/10 bg-white/[0.045] lg:border-l lg:border-t-0">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(210,173,69,0.13),transparent_34%)]" aria-hidden="true" />
                <div className="relative w-full">
                    <PublicPortalPreview content={content} />
                </div>
            </div>
        </div>
    </section>;
}
