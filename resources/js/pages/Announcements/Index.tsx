import { router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Bell,
    CheckCircle2,
    FileText,
    Search,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import {
    municipalAnnouncements,
    type AnnouncementPriority,
    type MunicipalAnnouncement,
} from '../../data/municipal/announcements';

const priorityTone: Record<AnnouncementPriority, string> = {
    Urgent: 'border-[#edc9cd] bg-[#fff0f1] text-[#b23b45]',
    Important: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]',
    Routine: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]',
};

const cardTone = {
    all: 'border-[#cae2d8] bg-[#edf7f3] text-[#1f6b50]',
    urgent: 'border-[#edc9cd] bg-[#fff0f1] text-[#b23b45]',
    important: 'border-[#f0dfb4] bg-[#fff8e8] text-[#9a6a08]',
    routine: 'border-[#d9dfdc] bg-[#f5f7f6] text-[#53635b]',
};

const dateContext = (value: string) => {
    const date = new Date(value + 'T00:00:00+08:00');
    const exact = date.toLocaleDateString('en-PH', {
        timeZone: 'Asia/Manila',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());
    const days = Math.round((Date.parse(value + 'T00:00:00Z') - Date.parse(today + 'T00:00:00Z')) / 86400000);

    if (days === 0) return { relative: 'Today', exact };
    if (days === 1) return { relative: 'Tomorrow', exact };
    if (days === -1) return { relative: 'Yesterday', exact };
    if (days > 1 && days <= 7) return { relative: 'In ' + days + ' days', exact };
    if (days < -1 && days >= -7) return { relative: Math.abs(days) + ' days ago', exact };
    return { relative: exact, exact };
};

const priorityForView = (view: string): AnnouncementPriority | '' => {
    if (view === 'urgent') return 'Urgent';
    if (view === 'important') return 'Important';
    if (view === 'routine') return 'Routine';
    return '';
};

const labelForView = (view: string) => {
    if (view === 'urgent') return 'Urgent';
    if (view === 'important') return 'Important';
    if (view === 'routine') return 'Routine';
    return 'All Notices';
};

function NoticeRow({
    item,
    onOpen,
    preview = false,
}: {
    item: MunicipalAnnouncement;
    onOpen: (item: MunicipalAnnouncement) => void;
    preview?: boolean;
}) {
    const date = dateContext(item.date);

    return (
        <button
            type="button"
            onClick={() => onOpen(item)}
            className={`grid w-full min-w-0 gap-2 px-3 text-left transition hover:bg-[var(--municipal-hover)] ${preview ? 'py-2 lg:grid-cols-[minmax(0,1fr)_88px_104px]' : 'py-2.5 lg:grid-cols-[minmax(0,1.6fr)_minmax(180px,.9fr)_130px_110px]'} lg:items-center`}
        >
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{item.id}</span>
                    <span className="truncate text-[9px] text-[var(--municipal-muted)]">{item.issuingOffice}</span>
                </div>
                <div className="mt-0.5 truncate text-[11px] font-semibold leading-4 text-[var(--municipal-text)]">{item.title}</div>
                <div className="mt-0.5 truncate text-[9px] text-[var(--municipal-muted)]">Audience: {item.audience}</div>
            </div>

            {!preview ? (
                <div className="min-w-0">
                    <div className="truncate text-[10px] text-[var(--municipal-text)]">{item.summary}</div>
                    <div className="mt-0.5 flex items-center gap-1 text-[9px] text-[var(--municipal-muted)]">
                        <FileText size={10} aria-hidden="true" />
                        <span className="truncate">{item.relatedDocument}</span>
                    </div>
                </div>
            ) : null}

            <div className="min-w-0">
                <div className="text-[10px] font-semibold text-[var(--municipal-text)]">{date.relative}</div>
                {date.relative !== date.exact ? <div className="text-[9px] text-[var(--municipal-muted)]">{date.exact}</div> : null}
            </div>

            <div className="flex items-center justify-between gap-2 lg:justify-end">
                <span className={'whitespace-nowrap rounded-full border px-2 py-1 text-[9px] font-bold uppercase leading-none ' + priorityTone[item.priority]}>{item.priority}</span>
                <ArrowRight size={12} className="shrink-0 text-[var(--municipal-brand)]" aria-hidden="true" />
            </div>
        </button>
    );
}

function NoticeModal({
    item,
    onClose,
}: {
    item: MunicipalAnnouncement;
    onClose: () => void;
}) {
    const date = dateContext(item.date);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4" role="presentation" onMouseDown={onClose}>
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="announcement-title"
                className="w-full max-w-3xl overflow-hidden rounded-xl border border-[var(--municipal-border)] bg-[var(--municipal-surface)] shadow-2xl"
                onMouseDown={(event) => event.stopPropagation()}
            >
                <header className="flex items-start justify-between gap-4 border-b border-[var(--municipal-border)] px-4 py-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">{item.id}</span>
                            <span className={'rounded-full border px-2 py-1 text-[9px] font-bold uppercase ' + priorityTone[item.priority]}>{item.priority}</span>
                        </div>
                        <h2 id="announcement-title" className="mt-1 text-lg font-bold text-[var(--municipal-text)]">{item.title}</h2>
                        <p className="mt-0.5 text-[10px] text-[var(--municipal-muted)]">{item.issuingOffice} · Audience: {item.audience}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Close announcement" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[var(--municipal-border)] text-[var(--municipal-muted)] hover:bg-[var(--municipal-hover)]">
                        <X size={15} />
                    </button>
                </header>

                <div className="space-y-4 px-4 py-4">
                    <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Notice date</div>
                            <div className="mt-0.5 text-[11px] font-semibold text-[var(--municipal-text)]">{date.exact}</div>
                        </div>
                        <div className="rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                            <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Audience</div>
                            <div className="mt-0.5 text-[11px] font-semibold text-[var(--municipal-text)]">{item.audience}</div>
                        </div>
                    </div>

                    <div>
                        <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Notice</div>
                        <p className="mt-1 text-[12px] leading-5 text-[var(--municipal-text)]">{item.summary}</p>
                    </div>

                    <div className="rounded-md border border-[#cfe6d5] bg-[#eef8f1] px-3 py-2 text-[#17633f]">
                        <div className="flex items-center gap-2">
                            <FileText size={14} aria-hidden="true" />
                            <div>
                                <div className="text-[9px] font-bold uppercase tracking-wide opacity-80">Related reference</div>
                                <div className="text-[11px] font-semibold">{item.relatedDocument}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

export default function Index() {
    const { url } = usePage();
    const params = useMemo(() => new URLSearchParams(url.split('?')[1] || ''), [url]);
    const rawView = params.get('view') || 'overview';
    const view = ['overview', 'all', 'urgent', 'important', 'routine'].includes(rawView) ? rawView : 'overview';

    const [q, setQ] = useState(params.get('q') || '');
    const [priority, setPriority] = useState<AnnouncementPriority | ''>(priorityForView(view));
    const [selected, setSelected] = useState<MunicipalAnnouncement | null>(null);

    useEffect(() => {
        setQ(params.get('q') || '');
        setPriority(priorityForView(view));
    }, [params, view]);

    const sorted = useMemo(
        () => [...municipalAnnouncements].sort((a, b) => b.date.localeCompare(a.date) || a.title.localeCompare(b.title)),
        [],
    );

    const counts = useMemo(() => ({
        all: municipalAnnouncements.length,
        urgent: municipalAnnouncements.filter((item) => item.priority === 'Urgent').length,
        important: municipalAnnouncements.filter((item) => item.priority === 'Important').length,
        routine: municipalAnnouncements.filter((item) => item.priority === 'Routine').length,
    }), []);

    const filtered = useMemo(() => {
        const needle = q.trim().toLowerCase();
        return sorted.filter((announcement) =>
            (!priority || announcement.priority === priority)
            && (!needle || [
                announcement.id,
                announcement.title,
                announcement.issuingOffice,
                announcement.audience,
                announcement.summary,
                announcement.relatedDocument,
            ].join(' ').toLowerCase().includes(needle))
        );
    }, [priority, q, sorted]);

    const urgent = useMemo(() => sorted.filter((item) => item.priority === 'Urgent').slice(0, 4), [sorted]);
    const recent = useMemo(() => sorted.slice(0, 6), [sorted]);

    const openView = (nextView: string) => router.get('/announcements', { view: nextView }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });

    const applySearch = () => router.get('/announcements', {
        view: view === 'overview' ? 'all' : view,
        q: q || undefined,
    }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });

    return (
        <AppLayout title="Announcements">
            <PageFrame width="standard" density="compact">
                <PageHeader
                    eyebrow="General municipal notices"
                    title="Announcements"
                    description="Municipal and office notices for operational awareness. Formal issuances remain under Official Memoranda."
                    icon={Bell}
                />

                <section role="note" aria-label="Announcements reference data notice" className="rounded-lg border border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                    <div className="text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-brand)]">Reference data</div>
                    <p className="mt-0.5 text-[10px] leading-4 text-[var(--municipal-muted)]">Prototype announcement records for interface evaluation. Not live municipal announcements.</p>
                </section>

                {view === 'overview' ? (
                    <div className="space-y-2.5">
                        <section aria-labelledby="announcement-glance">
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <h2 id="announcement-glance" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                                <span className="text-[9px] text-[var(--municipal-muted)]">{counts.all} municipal notices</span>
                            </div>

                            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
                                <button type="button" onClick={() => openView('all')} className={'min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px ' + cardTone.all}>
                                    <div className="flex items-start justify-between gap-2"><Bell size={16} /><strong className="text-lg leading-none">{counts.all}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">All Notices</div>
                                    <div className="text-[9px] opacity-80">Browse the full notice register</div>
                                </button>
                                <button type="button" onClick={() => openView('urgent')} className={'min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px ' + cardTone.urgent}>
                                    <div className="flex items-start justify-between gap-2"><AlertTriangle size={16} /><strong className="text-lg leading-none">{counts.urgent}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Urgent</div>
                                    <div className="text-[9px] opacity-80">Time-sensitive operational notices</div>
                                </button>
                                <button type="button" onClick={() => openView('important')} className={'min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px ' + cardTone.important}>
                                    <div className="flex items-start justify-between gap-2"><FileText size={16} /><strong className="text-lg leading-none">{counts.important}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Important</div>
                                    <div className="text-[9px] opacity-80">Current coordination priorities</div>
                                </button>
                                <button type="button" onClick={() => openView('routine')} className={'min-h-[76px] rounded-lg border p-2.5 text-left transition hover:-translate-y-px ' + cardTone.routine}>
                                    <div className="flex items-start justify-between gap-2"><CheckCircle2 size={16} /><strong className="text-lg leading-none">{counts.routine}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Routine</div>
                                    <div className="text-[9px] opacity-80">General operational information</div>
                                </button>
                            </div>
                        </section>

                        <section className="grid min-w-0 gap-2 lg:grid-cols-[.9fr_1.1fr]" aria-label="Announcement overview">
                            <div className="municipal-panel min-w-0 overflow-hidden">
                                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                    <div>
                                        <h2 className="text-xs font-bold text-[var(--municipal-text)]">Urgent / Time-sensitive</h2>
                                        <p className="text-[9px] text-[var(--municipal-muted)]">Notices requiring prompt awareness</p>
                                    </div>
                                    <button type="button" onClick={() => openView('urgent')} className="text-[10px] font-bold text-[var(--municipal-brand)]">View all</button>
                                </header>
                                <div className="divide-y divide-[var(--municipal-border)]">
                                    {urgent.map((item) => <NoticeRow key={item.id} item={item} onOpen={setSelected} preview />)}
                                    {!urgent.length ? <div className="px-3 py-4 text-[10px] text-[var(--municipal-muted)]">No urgent notices.</div> : null}
                                </div>
                            </div>

                            <div className="municipal-panel min-w-0 overflow-hidden">
                                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                    <div>
                                        <h2 className="text-xs font-bold text-[var(--municipal-text)]">Recent Announcements</h2>
                                        <p className="text-[9px] text-[var(--municipal-muted)]">Newest notices across the municipality</p>
                                    </div>
                                    <button type="button" onClick={() => openView('all')} className="text-[10px] font-bold text-[var(--municipal-brand)]">Browse all</button>
                                </header>
                                <div className="divide-y divide-[var(--municipal-border)]">
                                    {recent.map((item) => <NoticeRow key={item.id} item={item} onOpen={setSelected} preview />)}
                                </div>
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <nav className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5" aria-label="Announcements navigation">
                            <button type="button" onClick={() => openView('overview')} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">
                                ← Overview
                            </button>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]">/</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Announcements</span>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]">/</span>
                            <span className="text-[11px] font-semibold text-[var(--municipal-text)]">{labelForView(view)}</span>
                            <span className="ml-auto text-[10px] text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{filtered.length}</strong> notice{filtered.length === 1 ? '' : 's'}</span>
                        </nav>

                        <section className="municipal-panel p-2.5">
                            <div className="grid gap-2 sm:grid-cols-[1fr_180px_auto] sm:items-end">
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search announcements</span>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" />
                                        <input
                                            value={q}
                                            onChange={(event) => setQ(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    applySearch();
                                                }
                                            }}
                                            placeholder="Notice, office, audience or reference..."
                                            className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Priority</span>
                                    <select
                                        value={priority}
                                        onChange={(event) => setPriority(event.target.value as AnnouncementPriority | '')}
                                        className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs"
                                    >
                                        <option value="">All priorities</option>
                                        <option value="Urgent">Urgent</option>
                                        <option value="Important">Important</option>
                                        <option value="Routine">Routine</option>
                                    </select>
                                </label>

                                <button type="button" onClick={applySearch} className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-4 text-xs font-bold text-white">Search</button>
                            </div>
                        </section>

                        <section className="municipal-panel overflow-hidden" aria-label="Announcement register">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">{labelForView(view)}</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">General municipal and office notices for operational awareness</p>
                                </div>
                                <span className="text-[10px] text-[var(--municipal-muted)]">{filtered.length} shown</span>
                            </header>

                            <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(180px,.9fr)_130px_110px] gap-2 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] lg:grid">
                                <div>Notice</div><div>Summary / reference</div><div>Date</div><div>Priority</div>
                            </div>

                            <div className="divide-y divide-[var(--municipal-border)]">
                                {filtered.map((item) => <NoticeRow key={item.id} item={item} onOpen={setSelected} />)}
                                {!filtered.length ? (
                                    <div className="px-5 py-8 text-center">
                                        <Bell className="mx-auto text-[var(--municipal-muted)]" size={24} aria-hidden="true" />
                                        <div className="mt-2 text-xs font-bold text-[var(--municipal-text)]">No announcements match this view.</div>
                                        <div className="mt-1 text-[10px] text-[var(--municipal-muted)]">Change the search or priority filter.</div>
                                    </div>
                                ) : null}
                            </div>
                        </section>
                    </div>
                )}

                {selected ? <NoticeModal item={selected} onClose={() => setSelected(null)} /> : null}
            </PageFrame>
        </AppLayout>
    );
}
