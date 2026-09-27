import { CalendarDays } from 'lucide-react';
import PageFrame from '../../components/PageFrame';
import PageHeader from '../../components/PageHeader';
import PortalWorkspaceNav from '../../components/portal/PortalWorkspaceNav';
import CalendarWorkspace from '../../components/calendar/CalendarWorkspace';
import type { CalendarEvent, CalendarMeta } from '../../components/calendar/calendarTypes';
import AppLayout from '../../layouts/AppLayout';

export default function Index({ events, calendar }: { events: CalendarEvent[]; calendar: CalendarMeta }) {
    return (
        <AppLayout title="Calendar & Meetings">
            <PageFrame className="max-w-[1700px]" density="compact">
                <PageHeader
                    eyebrow="ONE TALIBON coordination"
                    title="Calendar & Meetings"
                    description="Municipal schedules, office events and upcoming activities."
                    icon={CalendarDays}
                />
                <PortalWorkspaceNav current="calendar" destinations={['calendar', 'meetings']} />
                <CalendarWorkspace events={events} calendar={calendar} />
            </PageFrame>
        </AppLayout>
    );
}
