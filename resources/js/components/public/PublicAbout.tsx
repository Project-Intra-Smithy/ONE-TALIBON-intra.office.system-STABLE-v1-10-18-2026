import { ArrowRight, Layers3, Network, Route } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent } from './types';

const pillarIcons = [Network, Layers3, Route] as const;

export default function PublicAbout({ content }: { content: PublicContent }) {
    return <section
        id="about"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} border-b py-9 md:py-10 [border-color:var(--public-divider)]`}
        aria-labelledby="public-about-title"
    >
        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1.35fr)] lg:items-end">
            <header className="max-w-2xl">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">{content.about.eyebrow}</p>
                <h2 id="public-about-title" className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] [color:var(--public-text)] md:text-2xl">{content.about.title}</h2>
                <p className="mt-2 max-w-xl text-[13px] leading-5 [color:var(--public-muted)]">{content.about.description}</p>
            </header>

            <div className="grid gap-2.5 sm:grid-cols-3">
                {content.about.pillars.map((pillar, index) => {
                    const Icon = pillarIcons[index] ?? ArrowRight;
                    return <article key={pillar.title} className="rounded-lg border p-3.5 [border-color:var(--public-divider)] [background:var(--public-surface)]">
                        <span className="flex h-8 w-8 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
                            <Icon size={16} aria-hidden="true" />
                        </span>
                        <h3 className="mt-2.5 text-[12px] font-extrabold uppercase tracking-[0.04em] [color:var(--public-text)]">{pillar.title}</h3>
                        <p className="mt-1 text-[11px] leading-[1.5] [color:var(--public-muted)]">{pillar.description}</p>
                    </article>;
                })}
            </div>
        </div>
    </section>;
}
