import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

export default function PublicOfficeOverview({ content }: { content: PublicContent }) {
    return <section
        id="offices"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} grid overflow-hidden rounded-xl border lg:grid-cols-[minmax(0,1.05fr)_minmax(0,.95fr)] [border-color:var(--public-divider)] [background:var(--public-surface)]`}
        aria-labelledby="public-offices-title"
    >
        <figure className="relative min-h-[240px] overflow-hidden [background:var(--public-surface-soft)] sm:min-h-[300px] lg:min-h-[360px]" aria-label="Talibon municipal landscape">
            <img src={talibonAssets.publicHero} alt="" className="absolute inset-0 h-full w-full object-cover saturate-[.72]" />
            <figcaption className="absolute bottom-4 right-4 rounded bg-black/45 px-2.5 py-1 text-[10px] font-semibold tracking-[0.06em] text-white">Talibon, Bohol</figcaption>
        </figure>
        <div className="flex min-w-0 flex-col justify-center p-6 sm:p-8 lg:p-12">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">{content.officeOverview.eyebrow}</p>
            <h2 id="public-offices-title" className="mt-2 max-w-xl text-2xl font-extrabold leading-tight tracking-[-0.025em] [color:var(--public-text)] md:text-3xl">{content.officeOverview.title}</h2>
            <p className="mt-4 max-w-xl text-sm leading-6 [color:var(--public-muted)]">{content.officeOverview.description}</p>
            <div className="mt-7 h-px w-16 [background:var(--municipal-gold)]" aria-hidden="true" />
        </div>
    </section>;
}
