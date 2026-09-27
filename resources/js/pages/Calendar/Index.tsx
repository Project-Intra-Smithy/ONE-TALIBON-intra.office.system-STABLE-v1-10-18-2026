import PageFrame from '../../components/PageFrame';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import CalendarWorkspace from '../../components/calendar/CalendarWorkspace';
import type { CalendarEvent, CalendarMeta } from '../../components/calendar/calendarTypes';
import AppLayout from '../../layouts/AppLayout';

export default function Index({ events, calendar }: { events: CalendarEvent[]; calendar: CalendarMeta }) {
    return (
        <AppLayout title="Calendar & Meetings">
            <PageFrame className="max-w-[1700px]" density="compact">
                <header className="min-w-0">
                    <div className="text-[11px] font-semibold text-[var(--municipal-brand)]">ONE TALIBON coordination</div>
                    <h1 className="mt-0.5 text-xl font-bold">Calendar & Meetings</h1>
                    <p className="mt-0.5 text-sm text-[var(--municipal-muted)]">Municipal schedules, office events and your upcoming activities.</p>
                </header>
                <PortalWorkspaceNav current="calendar" destinations={['calendar', 'meetings']} />
                <CalendarWorkspace events={events} calendar={calendar} />
            </PageFrame>
        </AppLayout>
    );
}
