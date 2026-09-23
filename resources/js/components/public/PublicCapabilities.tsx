import { ArrowLeftRight, ArrowUpRight, BellRing, BriefcaseBusiness, Building2, CalendarDays, Files } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { CapabilityItem, PublicContent, PublicInfoSelection } from './types';

const capabilityIcons: Record<CapabilityItem['id'], typeof Files> = {
    transactions: ArrowLeftRight,
    documents: Files,
    projects: BriefcaseBusiness,
    people: Building2,
    calendar: CalendarDays,
    'follow-up': BellRing,
};

type OpenInfo = (item: PublicInfoSelection, trigger: HTMLElement) => void;

function CapabilityCard({ capability, onOpenInfo }: { capability: CapabilityItem; onOpenInfo: OpenInfo }) {
    const Icon = capabilityIcons[capability.id];

    return <button
        type="button"
        aria-haspopup="dialog"
        onClick={event => onOpenInfo({
            eyebrow: 'Portal Capability',
            title: capability.title,
            description: capability.description,
            detail: capability.detail,
        }, event.currentTarget)}
        className="public-interactive-card group min-w-0 rounded-lg border p-4 text-left [border-color:var(--public-divider)] [background:var(--public-surface)]"
    >
        <div className="flex items-start justify-between gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-md [background:var(--public-surface-soft)] [color:var(--public-link)]">
                <Icon size={18} aria-hidden="true" />
            </span>
            <ArrowUpRight size={15} className="mt-0.5 shrink-0 [color:var(--public-muted)]" aria-hidden="true" />
        </div>
        <h3 className="mt-3 text-sm font-extrabold leading-5 tracking-[-0.01em] [color:var(--public-text)]">{capability.title}</h3>
        <p className="mt-1.5 text-[12px] leading-5 [color:var(--public-muted)]">{capability.description}</p>
    </button>;
}

export default function PublicCapabilities({ content, onOpenInfo }: { content: PublicContent; onOpenInfo: OpenInfo }) {
    return <section
        id="capabilities"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} border-t py-10 md:py-12 lg:py-14 [border-color:var(--public-divider)]`}
        aria-labelledby="public-capabilities-title"
    >
        <header className="mb-5 max-w-3xl md:mb-6">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] [color:var(--public-link)]">Core Portal Capabilities</p>
            <h2 id="public-capabilities-title" className="mt-1.5 text-xl font-extrabold tracking-[-0.02em] [color:var(--public-text)] md:text-2xl">{content.capabilities.title}</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-5 [color:var(--public-muted)]">{content.capabilities.description}</p>
        </header>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2 xl:grid-cols-3">
            {content.capabilities.items.map(capability => <CapabilityCard key={capability.id} capability={capability} onOpenInfo={onOpenInfo} />)}
        </div>
    </section>;
}
