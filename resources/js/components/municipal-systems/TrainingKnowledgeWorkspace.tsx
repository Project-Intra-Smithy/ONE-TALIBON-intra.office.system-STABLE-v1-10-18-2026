import { useEffect, useMemo, useState } from 'react';
import {
    ArrowLeft,
    BookOpen,
    ChevronRight,
    CircleDot,
    FileText,
    GraduationCap,
    History,
    Layers3,
    Library,
    PlayCircle,
    Search,
    Sparkles,
} from 'lucide-react';
import type { FutureSystemPrototypeConfig } from '../../data/municipal/futureSystemPrototypeData';
import {
    institutionalKnowledge,
    knowledgeCategories,
    knowledgeResources,
    onboardingPath,
    type KnowledgeCategory,
    type KnowledgeResource,
    type KnowledgeResourceType,
} from '../../data/municipal/trainingKnowledgeData';
import DetailDrawer from './DetailDrawer';

type Props = {
    prototype: FutureSystemPrototypeConfig;
    onBack?: () => void;
};

type WorkspaceTab = 'Overview' | 'Knowledge Library' | 'Onboarding' | 'Institutional Knowledge';
type DetailStep = 'Resource' | 'Context' | 'Related';
type LibraryCategory = KnowledgeCategory | 'All resources';

const tabs: WorkspaceTab[] = ['Overview', 'Knowledge Library', 'Onboarding', 'Institutional Knowledge'];

const typeTone: Record<KnowledgeResourceType, string> = {
    Manual: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200',
    SOP: 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
    Template: 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-200',
    Video: 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/25 dark:text-rose-200',
    Onboarding: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200',
    'Institutional Knowledge': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
};

const onboardingStateTone: Record<(typeof onboardingPath)[number]['state'], string> = {
    'Start here': 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-200',
    'Core reference': 'border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-900/60 dark:bg-blue-950/25 dark:text-blue-200',
    'Guided reference': 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-200',
    'Companion reference': 'border-violet-200 bg-violet-50 text-violet-800 dark:border-violet-900/60 dark:bg-violet-950/25 dark:text-violet-200',
};

function TypeBadge({ type }: { type: KnowledgeResourceType }) {
    return <span className={'inline-flex rounded-full border px-2 py-1 text-[9px] font-bold ' + typeTone[type]}>{type}</span>;
}

function FeaturedResources({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    const featured = knowledgeResources.filter((resource) => resource.featured).slice(0, 3);

    return (
        <section aria-label="Featured essential knowledge resources">
            <div className="mb-2 flex items-center gap-2">
                <Sparkles size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" />
                <div>
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Featured / Essential Resources</div>
                    <p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Quick reference shelf for common learning and office context.</p>
                </div>
            </div>
            <div className="grid gap-2.5 md:grid-cols-3">
                {featured.map((resource) => (
                    <button key={resource.reference} type="button" onClick={() => onOpen(resource)} className="group rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3 text-left transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-sm dark:hover:border-emerald-900/70">
                        <div className="flex items-start justify-between gap-2">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-[var(--municipal-brand)] dark:bg-emerald-950/20"><BookOpen size={15} aria-hidden="true" /></span>
                            <TypeBadge type={resource.type} />
                        </div>
                        <div className="mt-3 text-[9px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-brand)]">{resource.reference}</div>
                        <div className="mt-1 text-[12px] font-extrabold leading-4 text-[var(--municipal-text)]">{resource.title}</div>
                        <div className="mt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">{resource.owningOffice} · {resource.topic}</div>
                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-[var(--municipal-border)] pt-2 text-[9px] font-semibold text-[var(--municipal-muted)]"><span>{resource.format}</span><ChevronRight size={12} className="transition group-hover:translate-x-0.5" aria-hidden="true" /></div>
                    </button>
                ))}
            </div>
        </section>
    );
}

function CategoryNav({ active, onChange }: { active: LibraryCategory; onChange: (category: LibraryCategory) => void }) {
    const items: LibraryCategory[] = ['All resources', ...knowledgeCategories];

    return (
        <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-2.5" aria-label="Knowledge categories">
            <div className="flex items-center gap-2 px-1 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><Layers3 size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Categories</div>
            <div className="mt-2 space-y-0.5">
                {items.map((category) => {
                    const count = category === 'All resources'
                        ? knowledgeResources.length
                        : knowledgeResources.filter((resource) => resource.category === category).length;
                    const selected = active === category;
                    return (
                        <button key={category} type="button" onClick={() => onChange(category)} className={'flex min-h-8 w-full items-center justify-between gap-2 rounded-lg px-2.5 text-left text-[10px] font-semibold transition ' + (selected ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/25 dark:text-emerald-100' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}>
                            <span className="truncate">{category}</span>
                            <span className="rounded-full bg-[var(--municipal-surface-subtle)] px-1.5 py-0.5 text-[9px] font-extrabold tabular-nums">{count}</span>
                        </button>
                    );
                })}
            </div>
        </aside>
    );
}

function ResourceList({ resources, onOpen, compact = false }: { resources: KnowledgeResource[]; onOpen: (resource: KnowledgeResource) => void; compact?: boolean }) {
    return (
        <div className="divide-y divide-[var(--municipal-border)]">
            {resources.map((resource) => (
                <button key={resource.reference} type="button" onClick={() => onOpen(resource)} className="grid w-full gap-2 px-3 py-3 text-left transition hover:bg-[var(--municipal-hover)] sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[9px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-brand)]">{resource.reference}</span><TypeBadge type={resource.type} /></div>
                        <div className="mt-1 text-[11px] font-extrabold text-[var(--municipal-text)]">{resource.title}</div>
                        <div className="mt-1 text-[9px] leading-4 text-[var(--municipal-muted)]">{resource.owningOffice} · {resource.topic}</div>
                        {!compact && <p className="mt-1 line-clamp-2 text-[9px] leading-4 text-[var(--municipal-muted)]">{resource.summary}</p>}
                    </div>
                    <div className="flex items-center gap-3 sm:justify-end">
                        <div className="text-left sm:text-right"><div className="text-[9px] font-semibold text-[var(--municipal-text)]">{resource.updatedReference}</div><div className="mt-0.5 text-[8px] text-[var(--municipal-muted)]">{resource.format}</div></div>
                        <ChevronRight size={13} className="shrink-0 text-[var(--municipal-muted)]" aria-hidden="true" />
                    </div>
                </button>
            ))}
            {resources.length === 0 && <div className="px-4 py-8 text-center text-[10px] text-[var(--municipal-muted)]">No illustrative resources match this view.</div>}
        </div>
    );
}

function LibraryPanel({ category, onOpen }: { category: LibraryCategory; onOpen: (resource: KnowledgeResource) => void }) {
    const resources = category === 'All resources'
        ? knowledgeResources
        : knowledgeResources.filter((resource) => resource.category === category);

    return (
        <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Knowledge library overview">
            <header className="flex items-center justify-between gap-3 border-b border-[var(--municipal-border)] px-3 py-2.5">
                <div><div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><Library size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Knowledge Library</div><div className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">{category} · {resources.length} reference items</div></div>
            </header>
            <ResourceList resources={resources.slice(0, 6)} onOpen={onOpen} compact />
        </section>
    );
}

function RecentPopular({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    const recent = knowledgeResources.filter((resource) => resource.recentlyUpdated).slice(0, 3);
    const popular = knowledgeResources.filter((resource) => resource.popular).slice(0, 3);

    const miniList = (label: string, resources: KnowledgeResource[]) => (
        <div>
            <div className="text-[8px] font-extrabold uppercase tracking-[0.07em] text-slate-400">{label}</div>
            <div className="mt-1 divide-y divide-[var(--municipal-border)]">
                {resources.map((resource) => (
                    <button key={label + resource.reference} type="button" onClick={() => onOpen(resource)} className="block w-full py-2 text-left hover:text-[var(--municipal-brand)]">
                        <span className="block text-[9px] font-extrabold text-[var(--municipal-brand)]">{resource.reference}</span>
                        <span className="mt-0.5 block text-[10px] font-bold leading-4 text-[var(--municipal-text)]">{resource.title}</span>
                        <span className="mt-0.5 block text-[8px] text-[var(--municipal-muted)]">{resource.updatedReference}</span>
                    </button>
                ))}
            </div>
        </div>
    );

    return (
        <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Recent and popular knowledge resources">
            <div className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]"><History size={13} className="text-[var(--municipal-brand)]" aria-hidden="true" /> Recent / Popular</div>
            <div className="mt-2 space-y-3">{miniList('Recently updated', recent)}<div className="border-t border-[var(--municipal-border)] pt-3">{miniList('Popular references', popular)}</div></div>
        </aside>
    );
}

function OnboardingPathSurface({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    return (
        <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Municipal onboarding path">
            <div className="flex items-center gap-2"><GraduationCap size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /><div><div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Onboarding Path</div><p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Guided reference sequence only · no employee completion tracking.</p></div></div>
            <ol className="mt-3 grid gap-2 lg:grid-cols-5">
                {onboardingPath.map((item, index) => {
                    const resource = knowledgeResources.find((candidate) => candidate.reference === item.reference);
                    return (
                        <li key={item.reference} className="relative rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-2.5">
                            <div className="flex items-start justify-between gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--municipal-surface)] text-[9px] font-extrabold tabular-nums text-[var(--municipal-brand)]">{index + 1}</span><span className={'rounded-full border px-1.5 py-0.5 text-[8px] font-bold ' + onboardingStateTone[item.state]}>{item.state}</span></div>
                            <div className="mt-2 text-[10px] font-extrabold leading-4 text-[var(--municipal-text)]">{item.title}</div>
                            <div className="mt-1 text-[8px] leading-3 text-[var(--municipal-muted)]">{item.officeContext}</div>
                            <p className="mt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">{item.learningContext}</p>
                            {resource && <button type="button" onClick={() => onOpen(resource)} className="mt-2 inline-flex items-center gap-1 text-[9px] font-bold text-[var(--municipal-brand)]">View reference <ChevronRight size={10} aria-hidden="true" /></button>}
                        </li>
                    );
                })}
            </ol>
        </section>
    );
}

function Overview({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    const [category, setCategory] = useState<LibraryCategory>('All resources');

    return (
        <div className="space-y-2.5">
            <FeaturedResources onOpen={onOpen} />
            <div className="grid gap-2.5 xl:grid-cols-[210px_minmax(0,1fr)_250px]">
                <CategoryNav active={category} onChange={setCategory} />
                <LibraryPanel category={category} onOpen={onOpen} />
                <RecentPopular onOpen={onOpen} />
            </div>
            <OnboardingPathSurface onOpen={onOpen} />
        </div>
    );
}

function KnowledgeLibraryTab({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    const [query, setQuery] = useState('');
    const [category, setCategory] = useState<LibraryCategory>('All resources');
    const resources = useMemo(() => {
        const search = query.trim().toLowerCase();
        return knowledgeResources.filter((resource) => {
            const categoryMatch = category === 'All resources' || resource.category === category;
            const searchMatch = !search || [resource.reference, resource.title, resource.type, resource.owningOffice, resource.topic, resource.format].some((value) => value.toLowerCase().includes(search));
            return categoryMatch && searchMatch;
        });
    }, [category, query]);

    return (
        <div className="grid gap-2.5 lg:grid-cols-[220px_minmax(0,1fr)]">
            <CategoryNav active={category} onChange={setCategory} />
            <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]" aria-label="Browse knowledge library">
                <div className="border-b border-[var(--municipal-border)] p-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div><div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Browse Knowledge Library</div><p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Content-first reference browsing across manuals, SOPs, templates, videos and continuity material.</p></div>
                        <label className="relative w-full sm:max-w-[320px]"><span className="sr-only">Search knowledge resources</span><Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search title, topic, office or format" className="min-h-9 w-full rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-8 pr-2 text-[10px] text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-brand)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" /></label>
                    </div>
                </div>
                <ResourceList resources={resources} onOpen={onOpen} />
            </section>
        </div>
    );
}

function OnboardingTab({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    const onboardingResources = knowledgeResources.filter((resource) => resource.onboardingOrder).sort((a, b) => (a.onboardingOrder ?? 0) - (b.onboardingOrder ?? 0));

    return (
        <div className="space-y-2.5">
            <OnboardingPathSurface onOpen={onOpen} />
            <div className="grid gap-2.5 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section className="overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)]">
                    <div className="border-b border-[var(--municipal-border)] px-3 py-2.5"><div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Guided Learning References</div><p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Reference materials associated with the illustrative onboarding path.</p></div>
                    <ResourceList resources={onboardingResources} onOpen={onOpen} compact />
                </section>
                <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3">
                    <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Path Context</div>
                    <div className="mt-2 space-y-2">
                        {[
                            ['Orientation', 'Shared municipal context before office-specific references.'],
                            ['Office procedures', 'Common routines and coordination expectations at reference level.'],
                            ['Routing + records', 'Document movement and records-awareness concepts without confidential instructions.'],
                            ['Service standards', 'Citizen-facing professionalism as recorded-learning context.'],
                        ].map(([label, detail]) => <div key={label} className="rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2"><div className="text-[9px] font-bold text-[var(--municipal-text)]">{label}</div><p className="mt-0.5 text-[9px] leading-4 text-[var(--municipal-muted)]">{detail}</p></div>)}
                    </div>
                    <div className="mt-3 border-t border-[var(--municipal-border)] pt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">No employee progress, training completion, certification or personnel record is represented.</div>
                </aside>
            </div>
        </div>
    );
}

function InstitutionalKnowledgeTab({ onOpen }: { onOpen: (resource: KnowledgeResource) => void }) {
    return (
        <div className="grid gap-2.5 xl:grid-cols-[minmax(0,1fr)_320px]">
            <section className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3" aria-label="Institutional knowledge continuity shelf">
                <div className="flex items-center gap-2"><BookOpen size={14} className="text-[var(--municipal-brand)]" aria-hidden="true" /><div><div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Organizational Memory</div><p className="mt-0.5 text-[9px] text-[var(--municipal-muted)]">Office guides, handover references, process notes and reusable learning context.</p></div></div>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                    {institutionalKnowledge.map((item) => (
                        <article key={item.reference} className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] p-3">
                            <div className="flex items-start justify-between gap-2"><div className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{item.reference}</div><span className="rounded-full border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 py-1 text-[8px] font-bold text-[var(--municipal-muted)]">{item.kind}</span></div>
                            <h3 className="mt-2 text-[11px] font-extrabold text-[var(--municipal-text)]">{item.title}</h3>
                            <div className="mt-1 text-[8px] font-semibold text-[var(--municipal-muted)]">{item.owningOffice}</div>
                            <p className="mt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">{item.continuityContext}</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {item.relatedResourceReferences.map((reference) => {
                                    const resource = knowledgeResources.find((candidate) => candidate.reference === reference);
                                    if (!resource) return null;
                                    return <button key={reference} type="button" onClick={() => onOpen(resource)} className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[8px] font-bold text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200">{reference}</button>;
                                })}
                            </div>
                        </article>
                    ))}
                </div>
            </section>
            <aside className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-3">
                <div className="text-[10px] font-extrabold uppercase tracking-[0.08em] text-[var(--municipal-muted)]">Continuity Shelf</div>
                <p className="mt-1 text-[9px] leading-4 text-[var(--municipal-muted)]">Institutional knowledge here demonstrates how organizational memory could be organized without becoming an HR record system or live publishing portal.</p>
                <div className="mt-3 space-y-2">
                    {['Office guides', 'Handover references', 'Process notes', 'Templates', 'Recorded learning'].map((label) => <div key={label} className="flex items-center gap-2 rounded-lg bg-[var(--municipal-surface-subtle)] px-2.5 py-2 text-[10px] font-semibold text-[var(--municipal-text)]"><CircleDot size={10} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />{label}</div>)}
                </div>
                <div className="mt-3 border-t border-[var(--municipal-border)] pt-2 text-[9px] leading-4 text-[var(--municipal-muted)]">No confidential procedures, employee history or production knowledge publishing is exposed.</div>
            </aside>
        </div>
    );
}

function ResourceDetail({ resource, onClose }: { resource: KnowledgeResource; onClose: () => void }) {
    const [step, setStep] = useState<DetailStep>('Resource');
    const relatedResources = resource.relatedReferences
        .map((reference) => knowledgeResources.find((candidate) => candidate.reference === reference))
        .filter((candidate): candidate is KnowledgeResource => Boolean(candidate));
    const memoryLinks = institutionalKnowledge.filter((item) => item.relatedResourceReferences.includes(resource.reference));

    useEffect(() => {
        setStep('Resource');
    }, [resource.reference]);

    return (
        <DetailDrawer
            open
            onClose={onClose}
            title={`${resource.reference} · ${resource.title}`}
            eyebrow="Knowledge resource reference"
            size="standard"
            footer={<div className="text-[9px] font-semibold text-slate-400">Illustrative reference data · No live publishing, download, certification or employee tracking enabled</div>}
        >
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-1.5" role="tablist" aria-label="Knowledge resource detail steps">
                    {(['Resource', 'Context', 'Related'] as DetailStep[]).map((item, index) => (
                        <button key={item} type="button" role="tab" aria-selected={step === item} onClick={() => setStep(item)} className={'min-h-9 rounded-lg border px-2 text-[9px] font-bold transition ' + (step === item ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100' : 'border-transparent text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}><span className="mr-1 text-[8px] opacity-60">{index + 1}</span>{item}</button>
                    ))}
                </div>

                {step === 'Resource' && (
                    <div className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2"><span className="text-[10px] font-extrabold text-[var(--municipal-brand)]">{resource.reference}</span><TypeBadge type={resource.type} /></div>
                        <dl className="grid gap-2 sm:grid-cols-2">
                            {[
                                ['Title', resource.title],
                                ['Category', resource.category],
                                ['Owning office', resource.owningOffice],
                                ['Topic', resource.topic],
                                ['Updated reference', resource.updatedReference],
                                ['Format', resource.format],
                            ].map(([label, value]) => <div key={label} className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2.5"><dt className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">{label}</dt><dd className="mt-1 text-[10px] font-semibold leading-4 text-[var(--municipal-text)]">{value}</dd></div>)}
                        </dl>
                    </div>
                )}

                {step === 'Context' && (
                    <div className="space-y-3">
                        <div className="rounded-lg border border-[var(--municipal-border)] px-3 py-3"><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">Resource context</div><p className="mt-1 text-[10px] leading-5 text-[var(--municipal-text)]">{resource.summary}</p></div>
                        <div className="rounded-lg border border-dashed border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-3 text-[9px] leading-4 text-[var(--municipal-muted)]">This surface represents presentation/reference metadata only. It does not expose confidential procedures, a production document repository, live LMS behavior or employee learning records.</div>
                    </div>
                )}

                {step === 'Related' && (
                    <div className="space-y-3">
                        <div><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">Related resources</div><div className="mt-1.5 space-y-1.5">{relatedResources.map((related) => <div key={related.reference} className="rounded-lg bg-[var(--municipal-surface-subtle)] px-3 py-2.5"><div className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{related.reference}</div><div className="mt-0.5 text-[10px] font-bold text-[var(--municipal-text)]">{related.title}</div><div className="mt-0.5 text-[8px] text-[var(--municipal-muted)]">{related.category} · {related.format}</div></div>)}</div></div>
                        {memoryLinks.length > 0 && <div className="border-t border-[var(--municipal-border)] pt-3"><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] text-[var(--municipal-muted)]">Institutional knowledge links</div><div className="mt-1.5 space-y-1.5">{memoryLinks.map((item) => <div key={item.reference} className="rounded-lg border border-[var(--municipal-border)] px-3 py-2.5"><div className="text-[9px] font-extrabold text-[var(--municipal-brand)]">{item.reference}</div><div className="mt-0.5 text-[10px] font-bold text-[var(--municipal-text)]">{item.title}</div><div className="mt-0.5 text-[8px] text-[var(--municipal-muted)]">{item.kind}</div></div>)}</div></div>}
                    </div>
                )}
            </div>
        </DetailDrawer>
    );
}

export default function TrainingKnowledgeWorkspace({ onBack }: Props) {
    const [activeTab, setActiveTab] = useState<WorkspaceTab>('Overview');
    const [selectedResource, setSelectedResource] = useState<KnowledgeResource | null>(null);

    const headerSignals = [
        {
            label: 'Resources',
            value: knowledgeResources.length,
            tone: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/35 dark:text-slate-200',
        },
        {
            label: 'SOPs / Manuals',
            value: knowledgeResources.filter((resource) => resource.type === 'SOP' || resource.type === 'Manual').length,
            tone: 'border-blue-200 bg-blue-50/70 text-blue-900 dark:border-blue-900/60 dark:bg-blue-950/20 dark:text-blue-200',
        },
        {
            label: 'Onboarding items',
            value: onboardingPath.length,
            tone: 'border-amber-200 bg-amber-50/70 text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-200',
        },
        {
            label: 'Recently updated',
            value: knowledgeResources.filter((resource) => resource.recentlyUpdated).length,
            tone: 'border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/20 dark:text-emerald-200',
        },
    ];

    return (
        <section className="space-y-2.5" aria-label="Training and Knowledge Management workspace">
            <header className="rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-4 py-3">
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(430px,520px)] lg:items-center">
                    <div className="min-w-0">
                        {onBack && <button type="button" onClick={onBack} className="mb-1 inline-flex min-h-7 items-center gap-1.5 text-[9px] font-bold text-[var(--municipal-muted)] transition hover:text-[var(--municipal-brand)] focus:outline-none focus:ring-2 focus:ring-[var(--municipal-focus)]/30"><ArrowLeft size={12} aria-hidden="true" /> Future Integrations</button>}
                        <div className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--municipal-brand)]">Knowledge & Learning</div>
                        <div className="mt-0.5 flex items-center gap-2"><GraduationCap size={17} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /><h1 className="text-[21px] font-extrabold tracking-tight text-[var(--municipal-text)]">Training / Knowledge Management</h1></div>
                        <p className="mt-0.5 text-[10px] font-bold text-[var(--municipal-text)]">HRMO / Municipal Offices</p>
                        <p className="mt-0.5 text-[9px] font-semibold text-[var(--municipal-muted)]">Shared manuals, SOPs, templates, onboarding and institutional knowledge</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4" aria-label="Knowledge workspace signals">
                        {headerSignals.map((signal) => (
                            <div key={signal.label} className={'min-h-11 rounded-lg border px-2.5 py-2 ' + signal.tone}><div className="text-[8px] font-extrabold uppercase tracking-[0.06em] opacity-75">{signal.label}</div><div className="mt-1 text-[15px] font-extrabold leading-none tabular-nums">{signal.value}</div></div>
                        ))}
                    </div>
                </div>
            </header>

            <nav className="flex gap-1 overflow-x-auto rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] p-1" role="tablist" aria-label="Training and knowledge views">
                {tabs.map((tab) => <button key={tab} type="button" role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)} className={'min-h-9 shrink-0 rounded-lg px-3 text-[10px] font-bold transition ' + (activeTab === tab ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100' : 'text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]')}>{tab}</button>)}
            </nav>

            {activeTab === 'Overview' && <Overview onOpen={setSelectedResource} />}
            {activeTab === 'Knowledge Library' && <KnowledgeLibraryTab onOpen={setSelectedResource} />}
            {activeTab === 'Onboarding' && <OnboardingTab onOpen={setSelectedResource} />}
            {activeTab === 'Institutional Knowledge' && <InstitutionalKnowledgeTab onOpen={setSelectedResource} />}

            <div className="flex items-start gap-2 rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2 text-[9px] font-semibold leading-4 text-[var(--municipal-muted)]"><FileText size={12} className="mt-0.5 shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" /> Presentation/reference only. No live LMS, employee training records, certifications, confidential manuals, active publishing, employee progress tracking or production knowledge portal is enabled.</div>

            {selectedResource && <ResourceDetail resource={selectedResource} onClose={() => setSelectedResource(null)} />}
        </section>
    );
}
