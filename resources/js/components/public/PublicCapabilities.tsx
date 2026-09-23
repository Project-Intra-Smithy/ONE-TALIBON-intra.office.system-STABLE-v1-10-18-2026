import { ArrowLeftRight, BellRing, BriefcaseBusiness, Building2, CalendarDays, Files } from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { CapabilityItem, PublicContent } from './types';

const capabilityIcons: Record<CapabilityItem['id'], typeof Files> = {
    transactions: ArrowLeftRight,
    documents: Files,
    projects: BriefcaseBusiness,
    people: Building2,
    calendar: CalendarDays,
    'follow-up': BellRing,
};

function CapabilityCard({ capability }: { capability: CapabilityItem }) {
    const Icon = capabilityIcons[capability.id];

    return <article className="group min-w-0 rounded-xl border p-5 transition-[border-color,transform,background-color] duration-150 hover:-translate-y-0.5 [border-color:var(--public-divider)] [background:var(--public-surface)] hover:[border-color:var(--public-divider-strong)]">
        <span className="flex h-11 w-11 items-center justify-center rounded-lg [background:var(--public-surface-soft)] [color:var(--public-link)]">
            <Icon size={20} aria-hidden="true" />
        </span>
        <h3 className="mt-5 text-[15px] font-extrabold leading-5 tracking-[-0.015em] [color:var(--public-text)]">{capability.title}</h3>
        <p className="mt-2 text-[13px] leading-5 [color:var(--public-muted)]">{capability.description}</p>
        <p className="mt-5 border-t pt-3 text-[10px] font-bold uppercase tracking-[0.1em] [border-color:var(--public-divider)] [color:var(--public-muted)]">Available after sign-in</p>
    </article>;
}

export default function PublicCapabilities({ content }: { content: PublicContent }) {
    return <section
        id="capabilities"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} border-t py-12 md:py-16 lg:py-20 [border-color:var(--public-divider)]`}
        aria-labelledby="public-capabilities-title"
    >
        <header className="mb-7 max-w-3xl md:mb-9">
            <p className="text-[11px] font-extrabold uppercase tracking-[0.13em] [color:var(--public-link)]">Core Portal Capabilities</p>
            <h2 id="public-capabilities-title" className="mt-2 text-2xl font-extrabold tracking-[-0.025em] [color:var(--public-text)] md:text-3xl">{content.capabilities.title}</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 [color:var(--public-muted)]">{content.capabilities.description}</p>
        </header>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {content.capabilities.items.map(capability => <CapabilityCard key={capability.id} capability={capability} />)}
        </div>
    </section>;
}
