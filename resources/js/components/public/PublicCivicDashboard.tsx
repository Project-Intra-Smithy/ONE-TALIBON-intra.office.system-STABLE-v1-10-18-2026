import {
    BriefcaseBusiness,
    Building2,
    FileBadge2,
    FileText,
    FolderOpen,
    Landmark,
    MapPinned,
    Megaphone,
    Scale,
    Search,
    Store,
    Trees,
    UsersRound,
    Waves,
} from 'lucide-react';
import { talibonAssets } from '../../branding/talibonAssets';
import { PUBLIC_SECTION_ANCHOR_STYLE } from './publicLayout';
import type { DashboardItem, ProjectItem, PublicContent, ServiceItem, TransparencyItem } from './types';

const serviceIcons = [Store, FileBadge2, Landmark, Trees, UsersRound, Waves, Building2, FolderOpen, MapPinned] as const;
const metricIcons = [BriefcaseBusiness, Search, FileText, Megaphone, Building2, Scale] as const;

function QuickService({ item, index }: { item: ServiceItem; index: number }) {
    const Icon = serviceIcons[index % serviceIcons.length];
    const content = <>
        <span className="public-reference-service-icon"><Icon size={20} aria-hidden="true" /></span>
        <span className="public-reference-service-copy">
            <strong>{item.title}</strong>
            <span>{item.meta}</span>
        </span>
    </>;

    return item.href
        ? <a href={item.href} className="public-reference-service">{content}</a>
        : <article className="public-reference-service">{content}</article>;
}

function Metric({ item, index }: { item: DashboardItem; index: number }) {
    const Icon = metricIcons[index % metricIcons.length];
    return <article className="public-reference-metric">
        <Icon size={24} aria-hidden="true" />
        <div>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            <small>{item.detail}</small>
        </div>
    </article>;
}

function ProjectRow({ project }: { project: ProjectItem }) {
    return <article className="public-reference-project-row">
        <span className="public-reference-project-mark"><BriefcaseBusiness size={17} aria-hidden="true" /></span>
        <div>
            <span>{project.tag}</span>
            <strong>{project.title}</strong>
            <p>{project.summary}</p>
        </div>
    </article>;
}

function DocumentRow({ item }: { item: TransparencyItem }) {
    return <article className="public-reference-document-row">
        <FileText size={16} aria-hidden="true" />
        <div>
            <strong>{item.label}</strong>
            <span>{item.note}</span>
        </div>
        <small>{item.value}</small>
    </article>;
}

export default function PublicCivicDashboard({ content }: { content: PublicContent }) {
    const quickServices = content.services.slice(0, 9);
    const announcements = content.news.filter(item => item.type.toLowerCase() === 'news');

    return <div className="public-reference-dashboard">
        <div className="public-reference-dashboard-top">
            <section id="services" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-reference-panel" aria-labelledby="public-services-title">
                <header className="public-reference-panel-heading">
                    <div>
                        <Building2 size={17} aria-hidden="true" />
                        <h2 id="public-services-title">Quick Services</h2>
                    </div>
                    <span>{content.sampleLabel}</span>
                </header>
                <div className="public-reference-service-grid">
                    {quickServices.map((item, index) => <QuickService key={item.title} item={item} index={index} />)}
                </div>
                <a href="#contact" className="public-reference-panel-link">Service guidance & municipal contacts →</a>
            </section>

            <section className="public-reference-panel" aria-labelledby="public-glance-title">
                <header className="public-reference-panel-heading">
                    <div>
                        <Landmark size={17} aria-hidden="true" />
                        <h2 id="public-glance-title">Talibon at a Glance</h2>
                    </div>
                    <span>Prototype-safe information</span>
                </header>
                <div className="public-reference-glance-identity">
                    <img src={talibonAssets.municipalHallEmblem} alt="Talibon Municipal Hall emblem" />
                    <div>
                        <strong>Talibon Municipal Hall</strong>
                        <span>Institutional civic identity · Talibon, Bohol</span>
                    </div>
                </div>
                <div className="public-reference-metric-grid">
                    {content.dashboard.slice(0, 6).map((item, index) => <Metric key={item.label} item={item} index={index} />)}
                </div>
            </section>
        </div>

        <div className="public-reference-dashboard-bottom">
            <section className="public-reference-panel" aria-labelledby="public-announcements-title">
                <header className="public-reference-panel-heading compact">
                    <div>
                        <Megaphone size={17} aria-hidden="true" />
                        <h2 id="public-announcements-title">Latest Announcements</h2>
                    </div>
                </header>
                <div className="public-reference-announcement-list">
                    {announcements.length
                        ? announcements.slice(0, 3).map(item => <article key={item.title}>
                            <Megaphone size={15} aria-hidden="true" />
                            <div>
                                <strong>{item.title}</strong>
                                <p>{item.summary}</p>
                                <span>{item.date || 'Prototype preview'}</span>
                            </div>
                        </article>)
                        : <p className="public-reference-empty">No announcement preview available.</p>}
                </div>
            </section>

            <section id="projects" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-reference-panel" aria-labelledby="public-projects-title">
                <header className="public-reference-panel-heading compact">
                    <div>
                        <BriefcaseBusiness size={17} aria-hidden="true" />
                        <h2 id="public-projects-title">Latest Projects</h2>
                    </div>
                </header>
                <div className="public-reference-project-list">
                    {content.projects.slice(0, 2).map(project => <ProjectRow key={project.title} project={project} />)}
                </div>
            </section>

            <section id="transparency" style={PUBLIC_SECTION_ANCHOR_STYLE} className="public-reference-panel public-reference-documents" aria-labelledby="public-transparency-title">
                <header className="public-reference-panel-heading compact">
                    <div>
                        <FolderOpen size={17} aria-hidden="true" />
                        <h2 id="public-transparency-title">Transparency & Public Documents</h2>
                    </div>
                </header>
                <div className="public-reference-document-list">
                    {content.transparency.slice(0, 4).map(item => <DocumentRow key={item.label} item={item} />)}
                </div>
            </section>
        </div>
    </div>;
}
