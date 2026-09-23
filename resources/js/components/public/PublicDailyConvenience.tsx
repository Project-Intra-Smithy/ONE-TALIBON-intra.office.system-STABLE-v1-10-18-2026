import { ArrowUpRight, BellRing, CalendarDays, CloudSun, FileText } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PreviewModuleItem, PreviewModuleKind, PublicContent, PublicInfoSelection } from './types';

const moduleIcons: Record<PreviewModuleKind, typeof FileText> = {
    memorandum: FileText,
    schedule: CalendarDays,
    notification: BellRing,
    weather: CloudSun,
};

type OpenInfo = (item: PublicInfoSelection, trigger: HTMLElement) => void;

function ConvenienceModule({ item, onOpenInfo }: { item: PreviewModuleItem; onOpenInfo: OpenInfo }) {
    const Icon = moduleIcons[item.kind];

    if (!item.detail) return null;

    return <button
        type="button"
        aria-haspopup="dialog"
        onClick={event => onOpenInfo({
            eyebrow: 'Everyday Coordination',
            title: item.title,
            description: item.description,
            detail: item.detail!,
        }, event.currentTarget)}
        className="public-interactive-card min-w-0 rounded-lg border p-4 text-left [border-color:var(--public-divider)] [background:var(--public-surface)]"
    >
        <div className="flex items-start justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
                <Icon size={17} aria-hidden="true" />
            </span>
            <ArrowUpRight size={15} className="mt-0.5 shrink-0 [color:var(--public-muted)]" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-[13px] font-extrabold tracking-[-0.01em] [color:var(--public-text)]">{item.title}</h3>
        <p className="mt-1.5 text-[12px] leading-5 [color:var(--public-muted)]">{item.description}</p>
    </button>;
}

export default function PublicDailyConvenience({ content, onOpenInfo }: { content: PublicContent; onOpenInfo: OpenInfo }) {
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
            {content.dailyConvenience.items.map(item => <ConvenienceModule key={item.id} item={item} onOpenInfo={onOpenInfo} />)}
        </div>
    </section>;
}
