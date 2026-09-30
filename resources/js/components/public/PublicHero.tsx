import { Link } from '@inertiajs/react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import PublicPortalPreview from './PublicPortalPreview';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent, PublicInfoSelection } from './types';

type Props = {
    content: PublicContent;
    authenticated: boolean;
    onOpenInfo: (item: PublicInfoSelection, trigger: HTMLElement) => void;
};

export default function PublicHero({ content, authenticated, onOpenInfo }: Props) {
    return <section
        id="home"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} public-hero overflow-hidden rounded-none lg:rounded-b-2xl [background:var(--municipal-deep)] text-white`}
        aria-labelledby="public-hero-title"
    >
        <div className="grid grid-cols-1 lg:min-h-[410px] lg:grid-cols-[minmax(0,5.2fr)_minmax(0,6.8fr)]">
            <div className="public-hero-copy-final flex min-w-0 flex-col justify-center px-6 py-8 sm:px-8 sm:py-9 lg:px-10 lg:py-10 xl:px-11">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] [color:var(--municipal-gold)] sm:text-[11px]">Talibon Intra-Office Portal</p>
                <h1 id="public-hero-title" className="mt-2.5 max-w-[520px] text-[clamp(2rem,3.2vw,3.25rem)] font-extrabold leading-[1.02] tracking-[-0.04em] text-white">
                    {content.hero.title}
                </h1>
                <p className="mt-3.5 max-w-[520px] text-[12px] font-extrabold uppercase tracking-[0.075em] text-white/90 sm:text-[13px]">{content.hero.lead}</p>
                <p className="mt-3 max-w-[560px] text-[13px] leading-[1.45] text-white/80 sm:text-sm">{content.hero.description}</p>

                <div className="mt-5">
                    <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action">
                        {authenticated ? 'Open Portal' : 'Employee Login'}
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <p className="mt-3 flex max-w-[480px] items-center gap-2 text-[10px] font-semibold leading-4 text-white/60">
                        <LockKeyhole size={13} className="shrink-0 [color:var(--municipal-gold)]" aria-hidden="true" />
                        Authorized staff · Official workflows · Secure access
                    </p>
                </div>
            </div>

            <div className="public-hero-preview-final relative flex min-w-0 items-center border-t border-white/10 bg-white/[0.045] lg:border-l lg:border-t-0">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_18%,rgba(210,173,69,0.13),transparent_34%)]" aria-hidden="true" />
                <div className="relative w-full">
                    <PublicPortalPreview content={content} onOpenInfo={onOpenInfo} />
                </div>
            </div>
        </div>
    </section>;
}
