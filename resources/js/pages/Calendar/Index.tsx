import { CalendarDays } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import CalendarWorkspace from '../../components/calendar/CalendarWorkspace';
import type { CalendarEvent, CalendarMeta } from '../../components/calendar/calendarTypes';
import AppLayout from '../../layouts/AppLayout';

export default function Index({ events, calendar }: { events: CalendarEvent[]; calendar: CalendarMeta }) {
    return (
        <AppLayout title="Calendar & Meetings">
            <PageFrame className="max-w-[1700px]" density="compact">
                <header className="mb-2 flex min-w-0 flex-wrap items-end justify-between gap-2">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--municipal-brand)]">
                            <CalendarDays size={13} aria-hidden="true" />
                            <span>ONE TALIBON coordination</span>
                        </div>
                        <h1 className="mt-0.5 text-xl font-bold leading-tight text-[var(--municipal-text)]">Calendar &amp; Meetings</h1>
                        <p className="mt-0.5 text-[11px] leading-4 text-[var(--municipal-muted)]">Municipal schedules, office events and upcoming activities.</p>
                    </div>
                </header>

                <PortalWorkspaceNav current="calendar" destinations={['calendar', 'meetings']} />
                <CalendarWorkspace events={events} calendar={calendar} />
            </PageFrame>
        </AppLayout>
    );
}
