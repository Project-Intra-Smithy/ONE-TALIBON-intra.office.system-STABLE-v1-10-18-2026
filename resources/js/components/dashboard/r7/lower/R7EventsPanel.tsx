import { CalendarDays } from 'lucide-react';

/** Dashboard overview only. Calendar owns authorized event visibility. */
export default function R7EventsPanel() {
    return (
        <section className="r7-lower-card r7-lower-events r7-evidence-card" aria-labelledby="r7-calendar-title">
            <h2 className="r7-lower-title" id="r7-calendar-title">
                <CalendarDays size={18} aria-hidden="true" /> Upcoming events
            </h2>
            <div className="r7-lower-body r7-evidence-body">
                <p className="r7-evidence-empty">No event preview is available here.</p>
                <p className="r7-evidence-hint">Check Calendar for events visible to your account.</p>
            </div>
        </section>
    );
}
