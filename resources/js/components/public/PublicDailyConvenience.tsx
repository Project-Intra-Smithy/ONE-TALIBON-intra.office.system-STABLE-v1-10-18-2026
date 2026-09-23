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

    return <article className="min-w-0 rounded-lg border p-4 transition-[border-color,transform] duration-150 hover:-translate-y-px [border-color:var(--public-divider)] [background:var(--public-surface)] hover:[border-color:var(--public-divider-strong)]">
        <span className="flex h-9 w-9 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
            <Icon size={17} aria-hidden="true" />
        </span>
        <h3 className="mt-3 text-[13px] font-extrabold tracking-[-0.01em] [color:var(--public-text)]">{item.title}</h3>
        <p className="mt-1.5 text-[12px] leading-5 [color:var(--public-muted)]">{item.description}</p>
    </article>;
}

export default function PublicDailyConvenience({ content }: { content: PublicContent }) {
    return <section
        id="everyday"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} py-10 md:py-12 lg:py-14`}
        aria-labelledby="public-everyday-title"
    >
        <header className="mb-5 max-w-3xl md:mb-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">{content.dailyConvenience.eyebrow}</p>
            <h2 id="public-everyday-title" className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] [color:var(--public-text)] md:text-2xl">{content.dailyConvenience.title}</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 [color:var(--public-muted)]">{content.dailyConvenience.description}</p>
        </header>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
            {content.dailyConvenience.items.map(item => <ConvenienceModule key={item.id} item={item} />)}
        </div>
    </section>;
}
