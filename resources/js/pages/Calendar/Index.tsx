import CalendarWorkspace from '../../components/calendar/CalendarWorkspace';
import type { CalendarEvent, CalendarMeta } from '../../components/calendar/calendarTypes';
import AppLayout from '../../layouts/AppLayout';

export default function Index({ events, calendar }: { events: CalendarEvent[]; calendar: CalendarMeta }) {
    return (
        <AppLayout title="Calendar">
            <CalendarWorkspace events={events} calendar={calendar} />
        </AppLayout>
    );
}
