import { BellRing, CalendarDays, CloudSun, FileText } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PreviewModuleItem, PreviewModuleKind, PublicContent } from './types';

const moduleIcons: Record<PreviewModuleKind, typeof FileText> = {
    memorandum: FileText,
    schedule: CalendarDays,
    notification: BellRing,
    weather: CloudSun,
};

function ConvenienceModule({ item }: { item: PreviewModuleItem }) {
    const Icon = moduleIcons[item.kind];

    return <article className="min-w-0 rounded-xl border p-5 transition-[border-color,transform] duration-150 hover:-translate-y-0.5 [border-color:var(--public-divider)] [background:var(--public-surface)] hover:[border-color:var(--public-divider-strong)]">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg [background:var(--public-surface-soft)] [color:var(--public-link)]">
            <Icon size={19} aria-hidden="true" />
        </span>
        <h3 className="mt-4 text-sm font-extrabold tracking-[-0.01em] [color:var(--public-text)]">{item.title}</h3>
        <p className="mt-2 text-[13px] leading-5 [color:var(--public-muted)]">{item.description}</p>
    </article>;
}

export default function PublicDailyConvenience({ content }: { content: PublicContent }) {
    return <section
        id="everyday"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} py-12 md:py-16 lg:py-20`}
        aria-labelledby="public-everyday-title"
    >
        <header className="mb-7 max-w-3xl md:mb-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">{content.dailyConvenience.eyebrow}</p>
            <h2 id="public-everyday-title" className="mt-2 text-2xl font-extrabold tracking-[-0.025em] [color:var(--public-text)] md:text-3xl">{content.dailyConvenience.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 [color:var(--public-muted)]">{content.dailyConvenience.description}</p>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {content.dailyConvenience.items.map(item => <ConvenienceModule key={item.id} item={item} />)}
        </div>
    </section>;
}
