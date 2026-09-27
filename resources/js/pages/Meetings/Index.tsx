import { router, usePage } from '@inertiajs/react';
import {
    CalendarCheck2,
    CalendarClock,
    CalendarDays,
    CheckCircle2,
    RefreshCw,
    Search,
    UsersRound,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import MeetingDetailModal from '../../components/meetings/MeetingDetailModal';
import MeetingRegister from '../../components/meetings/MeetingRegister';
import { municipalMeetings, type MeetingStatus, type MunicipalMeeting } from '../../data/municipal/meetings';

const todayKey = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' }).format(new Date());

const viewLabel = (view: string) => {
    if (view === 'today') return 'Today';
    if (view === 'upcoming') return 'Upcoming';
    if (view === 'scheduled') return 'Scheduled';
    if (view === 'completed') return 'Completed';
    if (view === 'rescheduled') return 'Rescheduled';
    return 'All Meetings';
};

export default function Index() {
    const { url } = usePage();
    const params = useMemo(() => new URLSearchParams(url.split('?')[1] || ''), [url]);
    const rawView = params.get('view') || 'overview';
    const view = ['overview', 'all', 'today', 'upcoming', 'scheduled', 'completed', 'rescheduled'].includes(rawView) ? rawView : 'overview';

    const [query, setQuery] = useState(params.get('q') || '');
    const [status, setStatus] = useState<MeetingStatus | ''>('');
    const [selected, setSelected] = useState<MunicipalMeeting | null>(null);

    const today = todayKey();
    const sorted = useMemo(() => [...municipalMeetings].sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time)), []);

    const counts = useMemo(() => ({
        today: municipalMeetings.filter((meeting) => meeting.date === today).length,
        upcoming: municipalMeetings.filter((meeting) => meeting.date > today && meeting.status !== 'Completed').length,
        scheduled: municipalMeetings.filter((meeting) => meeting.status === 'Scheduled').length,
        completed: municipalMeetings.filter((meeting) => meeting.status === 'Completed').length,
        rescheduled: municipalMeetings.filter((meeting) => meeting.status === 'Rescheduled').length,
    }), [today]);

    const nextMeetings = useMemo(
        () => sorted.filter((meeting) => meeting.date >= today && meeting.status !== 'Completed').slice(0, 5),
        [sorted, today],
    );

    const recentlyCompleted = useMemo(
        () => [...municipalMeetings]
            .filter((meeting) => meeting.status === 'Completed')
            .sort((a, b) => b.date.localeCompare(a.date) || b.time.localeCompare(a.time))
            .slice(0, 5),
        [],
    );

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();

        return sorted.filter((meeting) => {
            if (view === 'today' && meeting.date !== today) return false;
            if (view === 'upcoming' && !(meeting.date > today && meeting.status !== 'Completed')) return false;
            if (view === 'scheduled' && meeting.status !== 'Scheduled') return false;
            if (view === 'completed' && meeting.status !== 'Completed') return false;
            if (view === 'rescheduled' && meeting.status !== 'Rescheduled') return false;
            if (status && meeting.status !== status) return false;

            return !needle || [
                meeting.id,
                meeting.title,
                meeting.organizingOffice,
                meeting.venue,
                ...meeting.participants,
                ...meeting.agenda,
                ...meeting.relatedDocuments,
            ].join(' ').toLowerCase().includes(needle);
        });
    }, [query, sorted, status, today, view]);

    const openView = (nextView: string) => {
        setQuery('');
        setStatus('');
        router.get('/meetings', { view: nextView }, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    const applySearch = () => router.get('/meetings', {
        view: view === 'overview' ? 'all' : view,
        q: query || undefined,
    }, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
    });

    return (
        <AppLayout title="Meetings">
            <PageFrame density="compact">
                <PageHeader
                    eyebrow="Work coordination"
                    title="Meetings"
                    description="Meeting schedules, participants, agendas and related working references."
                    icon={UsersRound}
                />
                <PortalWorkspaceNav current="meetings" destinations={['calendar', 'meetings']} />

                {view === 'overview' ? (
                    <div className="space-y-2.5">
                        <section aria-labelledby="meetings-glance">
                            <div className="mb-1 flex items-center justify-between gap-3">
                                <h2 id="meetings-glance" className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">At a glance</h2>
                                <span className="text-[9px] text-[var(--municipal-muted)]">{municipalMeetings.length} meeting records</span>
                            </div>

                            <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-5">
                                <button type="button" onClick={() => openView('today')} className="min-h-[76px] rounded-lg border border-[#cae2d8] bg-[#edf7f3] p-2.5 text-left text-[#1f6b50] transition hover:-translate-y-px">
                                    <div className="flex items-start justify-between gap-2"><CalendarDays size={16} /><strong className="text-lg leading-none">{counts.today}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Today</div>
                                    <div className="text-[9px] opacity-80">Meetings scheduled for today</div>
                                </button>
                                <button type="button" onClick={() => openView('upcoming')} className="min-h-[76px] rounded-lg border border-[#cfe0f6] bg-[#eef5ff] p-2.5 text-left text-[#265fa8] transition hover:-translate-y-px">
                                    <div className="flex items-start justify-between gap-2"><CalendarClock size={16} /><strong className="text-lg leading-none">{counts.upcoming}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Upcoming</div>
                                    <div className="text-[9px] opacity-80">Future coordination meetings</div>
                                </button>
                                <button type="button" onClick={() => openView('scheduled')} className="min-h-[76px] rounded-lg border border-[#ddd2f3] bg-[#f5f0ff] p-2.5 text-left text-[#7150a8] transition hover:-translate-y-px">
                                    <div className="flex items-start justify-between gap-2"><CalendarCheck2 size={16} /><strong className="text-lg leading-none">{counts.scheduled}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Scheduled</div>
                                    <div className="text-[9px] opacity-80">Records marked scheduled</div>
                                </button>
                                <button type="button" onClick={() => openView('completed')} className="min-h-[76px] rounded-lg border border-[#cfe6d5] bg-[#eef8f1] p-2.5 text-left text-[#17633f] transition hover:-translate-y-px">
                                    <div className="flex items-start justify-between gap-2"><CheckCircle2 size={16} /><strong className="text-lg leading-none">{counts.completed}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Completed</div>
                                    <div className="text-[9px] opacity-80">Completed meeting records</div>
                                </button>
                                <button type="button" onClick={() => openView('rescheduled')} className="min-h-[76px] rounded-lg border border-[#f0dfb4] bg-[#fff8e8] p-2.5 text-left text-[#9a6a08] transition hover:-translate-y-px">
                                    <div className="flex items-start justify-between gap-2"><RefreshCw size={16} /><strong className="text-lg leading-none">{counts.rescheduled}</strong></div>
                                    <div className="mt-1.5 text-[11px] font-bold">Rescheduled</div>
                                    <div className="text-[9px] opacity-80">Meetings moved from prior dates</div>
                                </button>
                            </div>
                        </section>

                        <section className="grid min-w-0 items-start gap-2 lg:grid-cols-[1.15fr_.85fr]" aria-label="Meeting overview">
                            <div className="municipal-panel min-w-0 overflow-hidden">
                                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-[var(--municipal-text)]">Next Meetings</h2>
                                        <p className="truncate text-[9px] text-[var(--municipal-muted)]">Upcoming coordination meetings from today forward</p>
                                    </div>
                                    <button type="button" onClick={() => openView('upcoming')} className="shrink-0 text-[10px] font-bold text-[var(--municipal-brand)]">Browse all</button>
                                </header>
                                <MeetingRegister meetings={nextMeetings} onOpen={setSelected} compact preview />
                            </div>

                            <div className="municipal-panel min-w-0 overflow-hidden">
                                <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                    <div className="min-w-0">
                                        <h2 className="text-xs font-bold text-[var(--municipal-text)]">Recently Completed</h2>
                                        <p className="truncate text-[9px] text-[var(--municipal-muted)]">Latest meetings marked completed</p>
                                    </div>
                                    <button type="button" onClick={() => openView('completed')} className="shrink-0 text-[10px] font-bold text-[var(--municipal-brand)]">View all</button>
                                </header>
                                <MeetingRegister meetings={recentlyCompleted} onOpen={setSelected} compact preview />
                            </div>
                        </section>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        <nav className="municipal-panel flex min-w-0 flex-wrap items-center gap-2 px-2.5 py-1.5" aria-label="Meetings navigation">
                            <button type="button" onClick={() => openView('overview')} className="inline-flex min-h-9 items-center gap-1 rounded-md px-2 text-[11px] font-bold text-[var(--municipal-brand)] hover:bg-[var(--municipal-hover)]">← Overview</button>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]">/</span>
                            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Meetings</span>
                            <span className="text-[10px] text-[var(--municipal-border-strong)]">/</span>
                            <span className="text-[11px] font-semibold text-[var(--municipal-text)]">{viewLabel(view)}</span>
                            <span className="ml-auto text-[10px] text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{filtered.length}</strong> shown</span>
                        </nav>

                        <section className="municipal-panel p-2.5">
                            <div className="grid gap-2 sm:grid-cols-[1fr_190px_auto] sm:items-end">
                                <label className="block min-w-0">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Search meetings</span>
                                    <div className="relative">
                                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" aria-hidden="true" />
                                        <input
                                            value={query}
                                            onChange={(event) => setQuery(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    applySearch();
                                                }
                                            }}
                                            placeholder="Meeting, office, venue, agenda or document..."
                                            className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-xs text-[var(--municipal-text)] outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20"
                                        />
                                    </div>
                                </label>

                                <label className="block">
                                    <span className="mb-1 block text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)]">Status</span>
                                    <select value={status} onChange={(event) => setStatus(event.target.value as MeetingStatus | '')} className="min-h-10 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-2 text-xs">
                                        <option value="">All statuses</option>
                                        <option value="Scheduled">Scheduled</option>
                                        <option value="Completed">Completed</option>
                                        <option value="Rescheduled">Rescheduled</option>
                                    </select>
                                </label>

                                <button type="button" onClick={applySearch} className="min-h-10 rounded-md bg-[var(--municipal-brand-deep)] px-4 text-xs font-bold text-white">Search</button>
                            </div>
                        </section>

                        <section className="municipal-panel overflow-hidden" aria-label="Meeting register">
                            <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--municipal-border)] bg-[var(--municipal-surface-subtle)] px-3 py-2">
                                <div>
                                    <h2 className="text-xs font-bold text-[var(--municipal-text)]">{viewLabel(view)}</h2>
                                    <p className="text-[9px] text-[var(--municipal-muted)]">Meeting references with schedule, office, venue and status</p>
                                </div>
                                <button type="button" onClick={() => openView('all')} className="text-[10px] font-bold text-[var(--municipal-brand)]">All meetings</button>
                            </header>
                            <div className="hidden grid-cols-[110px_minmax(0,1.4fr)_minmax(150px,.7fr)_minmax(150px,.8fr)_110px_28px] gap-2 border-b border-[var(--municipal-border)] px-3 py-2 text-[9px] font-bold uppercase tracking-wide text-[var(--municipal-muted)] lg:grid">
                                <div>Reference / date</div><div>Meeting / office</div><div>Time</div><div>Venue</div><div>Status</div><div></div>
                            </div>
                            <MeetingRegister meetings={filtered} onOpen={setSelected} compact />
                        </section>
                    </div>
                )}

                {selected ? <MeetingDetailModal meeting={selected} onClose={() => setSelected(null)} /> : null}
            </PageFrame>
        </AppLayout>
    );
}
