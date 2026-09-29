import { Link } from '@inertiajs/react';
import { ArrowRight, Landmark, LockKeyhole, MapPin } from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
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
        className={`${PUBLIC_CONTENT_FRAME_CLASS} public-hero overflow-hidden border-x border-t [border-color:var(--public-divider)] [background:var(--municipal-deep)] text-white`}
        aria-labelledby="public-hero-title"
    >
        <div className="grid grid-cols-1 lg:min-h-[430px] lg:grid-cols-[minmax(0,5.3fr)_minmax(0,6.7fr)]">
            <div className="public-hero-copy-final flex min-w-0 flex-col justify-center px-6 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-11 xl:px-12">
                <div className="flex items-center gap-3">
                    <img src={talibonAssets.municipalSeal} alt="" className="h-14 w-14 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm sm:h-16 sm:w-16" />
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.13em] [color:var(--municipal-gold)]">{content.hero.eyebrow}</p>
                        <p className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-white/70"><MapPin size={12} aria-hidden="true" />Municipality of Talibon, Bohol</p>
                    </div>
                </div>

                <h1 id="public-hero-title" className="mt-5 max-w-[560px] text-[clamp(2.45rem,4.4vw,4.4rem)] font-extrabold leading-[.94] tracking-[-0.055em] text-white">
                    {content.hero.title}
                </h1>
                <p className="mt-4 max-w-[560px] text-[12px] font-extrabold uppercase tracking-[0.075em] text-white/92 sm:text-[13px]">{content.hero.lead}</p>
                <p className="mt-3 max-w-[590px] text-[13px] leading-6 text-white/76 sm:text-sm">{content.hero.description}</p>

                <div className="mt-6 flex flex-wrap items-center gap-3">
                    <Link href={authenticated ? '/dashboard' : '/login'} className="public-primary-action !bg-white !text-[#0b442d] hover:!bg-[#f3f7f4]">
                        {authenticated ? 'Open Employee Portal' : 'Employee Login'}
                        <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                    <a href="#services" className="public-secondary-action !border-white/25 !text-white hover:!bg-white/10">
                        Public information
                    </a>
                </div>
                <p className="mt-3 flex max-w-[520px] items-center gap-2 text-[10px] font-semibold leading-4 text-white/58">
                    <LockKeyhole size={13} className="shrink-0 [color:var(--municipal-gold)]" aria-hidden="true" />
                    Public information remains separate from protected employee records.
                </p>
            </div>

            <figure className="public-hero-preview-final relative min-h-[280px] overflow-hidden border-t border-white/10 lg:min-h-0 lg:border-l lg:border-t-0" aria-label="Municipality of Talibon civic activity">
                <img src={talibonAssets.publicHero} alt="Municipal coordination activity in Talibon, Bohol" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#062d1d]/90 via-[#0b442d]/20 to-transparent" aria-hidden="true" />
                <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                    <div className="max-w-md border-l-2 pl-3 [border-color:var(--municipal-gold)]">
                        <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.12em] text-white/65"><Landmark size={13} aria-hidden="true" />Municipal identity</p>
                        <p className="mt-1 text-sm font-extrabold text-white">ONE TALIBON · public information and secure municipal coordination</p>
                    </div>
                </figcaption>
            </figure>
        </div>
    </section>;
}
