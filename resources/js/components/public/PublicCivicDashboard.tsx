import {
    ArrowUpRight,
    BellRing,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    FileText,
    FolderOpen,
    Landmark,
    MapPin,
    Megaphone,
    ShieldCheck,
} from 'lucide-react';
import { PUBLIC_CONTENT_FRAME_CLASS, PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { PublicContent, ServiceItem } from './types';

const serviceIcons = [Building2, FileText, Landmark] as const;
const informationIcons = [Megaphone, BellRing, FolderOpen] as const;

function ServiceRow({ item, index, information = false }: { item: ServiceItem; index: number; information?: boolean }) {
    const icons = information ? informationIcons : serviceIcons;
    const Icon = icons[index % icons.length];

    const content = <>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center border [border-color:var(--public-divider)] [background:var(--public-surface-soft)] [color:var(--public-link)]">
            <Icon size={17} aria-hidden="true" />
        </span>
        <span className="min-w-0 flex-1">
            <span className="block text-[13px] font-extrabold leading-5 [color:var(--public-text)]">{item.title}</span>
            <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.06em] [color:var(--public-muted)]">{item.meta}</span>
            <span className="mt-1.5 block text-[12px] leading-5 [color:var(--public-muted)]">{item.description}</span>
        </span>
        {item.href && <ArrowUpRight size={15} className="mt-1 shrink-0 [color:var(--public-link)]" aria-hidden="true" />}
    </>;

    if (item.href) {
        return <a href={item.href} className="public-civic-row flex items-start gap-3 px-4 py-4">
            {content}
        </a>;
    }

    return <article className="flex items-start gap-3 px-4 py-4">{content}</article>;
}

export default function PublicCivicDashboard({ content }: { content: PublicContent }) {
    const services = content.services.filter(item => item.group === 'services');
    const information = content.services.filter(item => item.group === 'information');

    return <section
        id="services"
        style={PUBLIC_SECTION_ANCHOR_STYLE}
        className={`${PUBLIC_CONTENT_FRAME_CLASS} public-civic-dashboard border-x border-b [border-color:var(--public-divider)] [background:var(--public-surface)]`}
        aria-labelledby="public-services-title"
    >
        <div className="grid border-b md:grid-cols-2 xl:grid-cols-4 [border-color:var(--public-divider)]">
            {content.dashboard.map((item, index) => <article
                key={item.label}
                className={`min-w-0 px-4 py-3.5 ${index > 0 ? 'border-t md:border-t-0 md:border-l' : ''} ${index === 2 ? 'md:border-t xl:border-t-0' : ''} [border-color:var(--public-divider)]`}
            >
                <p className="text-[9px] font-extrabold uppercase tracking-[0.1em] [color:var(--public-link)]">{item.label}</p>
                <p className="mt-1 text-sm font-extrabold [color:var(--public-text)]">{item.value}</p>
                <p className="mt-0.5 text-[11px] leading-4 [color:var(--public-muted)]">{item.detail}</p>
            </article>)}
        </div>

        <div className="grid xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,.85fr)]">
            <div className="min-w-0">
                <header className="border-b px-4 py-4 sm:px-5 [border-color:var(--public-divider)]">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] [color:var(--public-link)]">Public access</p>
                    <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
                        <div>
                            <h2 id="public-services-title" className="text-lg font-extrabold tracking-[-0.02em] [color:var(--public-text)]">Municipal services & information</h2>
                            <p className="mt-1 max-w-2xl text-[12px] leading-5 [color:var(--public-muted)]">Service guidance and public-information entry points. Prototype-only items remain clearly labeled.</p>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] [color:var(--public-muted)]">{content.sampleLabel}</span>
                    </div>
                </header>

                <div className="grid md:grid-cols-2">
                    <div>
                        <div className="border-b px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.09em] [border-color:var(--public-divider)] [background:var(--public-surface-soft)] [color:var(--public-text)]">Quick services</div>
                        <div className="divide-y [border-color:var(--public-divider)] [--tw-divide-opacity:1]">
                            {services.map((item, index) => <ServiceRow key={item.title} item={item} index={index} />)}
                        </div>
                    </div>
                    <div className="border-t md:border-l md:border-t-0 [border-color:var(--public-divider)]">
                        <div className="border-b px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-[0.09em] [border-color:var(--public-divider)] [background:var(--public-surface-soft)] [color:var(--public-text)]">Public information</div>
                        <div className="divide-y [border-color:var(--public-divider)] [--tw-divide-opacity:1]">
                            {information.map((item, index) => <ServiceRow key={item.title} item={item} index={index} information />)}
                        </div>
                    </div>
                </div>
            </div>

            <aside id="news" className="border-t xl:border-l xl:border-t-0 [border-color:var(--public-divider)]" aria-labelledby="public-updates-title">
                <header className="border-b px-4 py-4 sm:px-5 [border-color:var(--public-divider)]">
                    <p className="text-[9px] font-extrabold uppercase tracking-[0.11em] [color:var(--public-link)]">Municipal information</p>
                    <h2 id="public-updates-title" className="mt-1 text-lg font-extrabold tracking-[-0.02em] [color:var(--public-text)]">Advisories, events & announcements</h2>
                </header>
                <div className="divide-y [border-color:var(--public-divider)] [--tw-divide-opacity:1]">
                    {content.news.map((item, index) => {
                        const Icon = item.type.toLowerCase() === 'event' ? CalendarDays : item.type.toLowerCase() === 'advisory' ? BellRing : Megaphone;
                        return <article key={item.title} className="grid grid-cols-[36px_minmax(0,1fr)] gap-3 px-4 py-4 sm:px-5">
                            <span className="flex h-9 w-9 items-center justify-center [background:var(--public-surface-soft)] [color:var(--public-link)]"><Icon size={16} aria-hidden="true" /></span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                    <span className="text-[9px] font-extrabold uppercase tracking-[0.09em] [color:var(--public-link)]">{item.type}</span>
                                    <span className="text-[10px] [color:var(--public-muted)]">{item.date || 'Prototype preview'}</span>
                                </div>
                                <h3 className="mt-1 text-[13px] font-extrabold leading-5 [color:var(--public-text)]">{item.title}</h3>
                                <p className="mt-1 text-[12px] leading-5 [color:var(--public-muted)]">{item.summary}</p>
                            </div>
                        </article>;
                    })}
                </div>
            </aside>
        </div>

        <div className="grid border-t xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] [border-color:var(--public-divider)]">
            <section className="min-w-0" aria-labelledby="public-projects-title">
                <header className="border-b px-4 py-3.5 sm:px-5 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
                    <div className="flex items-center gap-2">
                        <BriefcaseBusiness size={16} className="[color:var(--public-link)]" aria-hidden="true" />
                        <h2 id="public-projects-title" className="text-sm font-extrabold [color:var(--public-text)]">Projects & programs</h2>
                    </div>
                </header>
                <div className="grid md:grid-cols-3">
                    {content.projects.map((project, index) => <article key={project.title} className={`min-w-0 px-4 py-4 sm:px-5 ${index > 0 ? 'border-t md:border-l md:border-t-0' : ''} [border-color:var(--public-divider)]`}>
                        <span className="text-[9px] font-extrabold uppercase tracking-[0.08em] [color:var(--public-link)]">{project.tag}</span>
                        <h3 className="mt-1.5 text-[13px] font-extrabold leading-5 [color:var(--public-text)]">{project.title}</h3>
                        <p className="mt-1.5 text-[12px] leading-5 [color:var(--public-muted)]">{project.summary}</p>
                    </article>)}
                </div>
            </section>

            <section id="transparency" style={PUBLIC_SECTION_ANCHOR_STYLE} className="border-t xl:border-l xl:border-t-0 [border-color:var(--public-divider)]" aria-labelledby="public-transparency-title">
                <header className="border-b px-4 py-3.5 sm:px-5 [border-color:var(--public-divider)] [background:var(--public-surface-soft)]">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={16} className="[color:var(--public-link)]" aria-hidden="true" />
                        <h2 id="public-transparency-title" className="text-sm font-extrabold [color:var(--public-text)]">Transparency & public documents</h2>
                    </div>
                </header>
                <div className="divide-y [border-color:var(--public-divider)] [--tw-divide-opacity:1]">
                    {content.transparency.map(item => <article key={item.label} className="px-4 py-3.5 sm:px-5">
                        <div className="flex items-start justify-between gap-3">
                            <h3 className="text-[12px] font-extrabold leading-5 [color:var(--public-text)]">{item.label}</h3>
                            <span className="shrink-0 text-[9px] font-bold uppercase tracking-[0.06em] [color:var(--public-link)]">{item.value}</span>
                        </div>
                        <p className="mt-1 text-[11px] leading-4 [color:var(--public-muted)]">{item.note}</p>
                    </article>)}
                </div>
            </section>
        </div>

        <div id="contact" style={PUBLIC_SECTION_ANCHOR_STYLE} className="grid border-t md:grid-cols-[minmax(0,1fr)_auto] md:items-center [border-color:var(--public-divider)] [background:var(--municipal-deep)]">
            <div className="px-4 py-4 text-white sm:px-5">
                <div className="flex items-start gap-3">
                    <MapPin size={17} className="mt-0.5 shrink-0 [color:var(--municipal-gold)]" aria-hidden="true" />
                    <div>
                        <p className="text-[10px] font-extrabold uppercase tracking-[0.1em] text-white/65">Municipal contact</p>
                        <h2 className="mt-0.5 text-sm font-extrabold">{content.contact.heading}</h2>
                        <p className="mt-1 text-[12px] leading-5 text-white/70">{content.contact.location} · {content.contact.description}</p>
                    </div>
                </div>
            </div>
            <a href="#secure-access" className="flex min-h-12 items-center justify-between gap-3 border-t px-4 text-[12px] font-bold text-white md:min-h-full md:border-l md:border-t-0 sm:px-5 [border-color:rgba(255,255,255,.16)]">
                Employee portal access
                <ArrowUpRight size={15} className="[color:var(--municipal-gold)]" aria-hidden="true" />
            </a>
        </div>
    </section>;
}
