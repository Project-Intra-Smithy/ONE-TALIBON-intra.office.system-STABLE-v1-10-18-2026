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
        <figure className="relative min-h-[210px] overflow-hidden [background:var(--public-surface-soft)] sm:min-h-[250px] lg:min-h-[300px]" aria-label="Talibon municipal landscape">
            <img src={talibonAssets.publicHero} alt="" className="absolute inset-0 h-full w-full object-cover saturate-[.72]" />
            <figcaption className="absolute bottom-3 right-3 rounded bg-black/45 px-2 py-1 text-[9px] font-semibold tracking-[0.05em] text-white">Talibon, Bohol</figcaption>
        </figure>
        <div className="flex min-w-0 flex-col justify-center p-5 sm:p-6 lg:p-8">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">{content.officeOverview.eyebrow}</p>
            <h2 id="public-offices-title" className="mt-1.5 max-w-xl text-xl font-extrabold leading-tight tracking-[-0.02em] [color:var(--public-text)] md:text-2xl">{content.officeOverview.title}</h2>
            <p className="mt-3 max-w-xl text-[13px] leading-5 [color:var(--public-muted)]">{content.officeOverview.description}</p>
            <div className="mt-5 h-px w-14 [background:var(--municipal-gold)]" aria-hidden="true" />
        </div>
    </section>;
}
