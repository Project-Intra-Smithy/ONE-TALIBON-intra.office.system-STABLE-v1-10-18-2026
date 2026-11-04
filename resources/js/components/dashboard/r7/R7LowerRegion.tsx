import type { DashboardExperience } from '../types';
import R7EventsPanel from './lower/R7EventsPanel';
import R7TaskPanel from './lower/R7TaskPanel';
import R7DocumentsPanel from './lower/R7DocumentsPanel';
import R7QuickLinksPanel from './lower/R7QuickLinksPanel';

/** Mounted Reference A lower band; each leaf owns its own card and heading. */
export default function R7LowerRegion({ actions }: { actions: DashboardExperience['quickActions'] }) {
    return <section className="r7-lower" aria-label="Personal workspace and shortcuts">
        <div className="r7-lower-grid">
            <R7EventsPanel />
            <R7TaskPanel />
            <R7DocumentsPanel />
            <R7QuickLinksPanel actions={actions} />
        </div>
    </section>;
}
