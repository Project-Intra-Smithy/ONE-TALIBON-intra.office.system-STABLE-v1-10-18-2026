import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import { useMemo, useState } from 'react';
import { Search, UsersRound } from 'lucide-react';
import AppLayout from '../../layouts/AppLayout';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import MeetingRegister from '../../components/meetings/MeetingRegister';
import { municipalMeetings } from '../../data/municipal/meetings';

export default function Index() {
    const [query, setQuery] = useState('');
    const [status, setStatus] = useState('');
    const meetings = useMemo(() => {
        const value = query.trim().toLowerCase();
        return municipalMeetings.filter((meeting) => (!value || [meeting.title, meeting.organizingOffice, meeting.venue, ...meeting.participants, ...meeting.agenda, ...meeting.relatedDocuments].join(' ').toLowerCase().includes(value)) && (!status || meeting.status === status));
    }, [query, status]);
    const scheduled = meetings.filter((meeting) => meeting.status === 'Scheduled').length;
    const offices = new Set(meetings.map((meeting) => meeting.organizingOffice)).size;

    return <AppLayout title="Meetings"><PageFrame density="compact"><PageHeader eyebrow="Work coordination" title="Meetings" description="Prototype meeting references remain separate from the live calendar event model." icon={UsersRound} aside={<div className="text-right text-xs text-[var(--municipal-muted)]"><strong className="text-[var(--municipal-text)]">{meetings.length}</strong> visible · {scheduled} scheduled · {offices} offices</div>} /><PortalWorkspaceNav current="meetings" destinations={['calendar', 'meetings']} /><section className="municipal-panel grid gap-2 p-3 sm:grid-cols-[1fr_220px]"><label className="relative min-w-0"><span className="sr-only">Search meetings</span><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--municipal-muted)]" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search meeting, office, venue, agenda, or document" className="min-h-11 w-full rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] pl-9 pr-3 text-sm outline-none focus:border-[var(--municipal-focus)] focus:ring-2 focus:ring-[var(--municipal-focus)]/20" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="min-h-11 rounded-md border border-[var(--municipal-border)] bg-[var(--municipal-surface)] px-3 text-sm" aria-label="Meeting status"><option value="">All statuses</option><option>Scheduled</option><option>Completed</option><option>Rescheduled</option></select></section><MeetingRegister meetings={meetings} /></PageFrame></AppLayout>;
}
