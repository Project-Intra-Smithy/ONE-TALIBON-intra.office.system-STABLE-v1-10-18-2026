import { CalendarDays, FileText, LayoutGrid, ListTodo } from 'lucide-react';
import PersonalTaskWorkspace from '../../tasks/PersonalTaskWorkspace';
import PersonalTaskMutationPanel from '../../tasks/PersonalTaskMutationPanel';
import QuickActions from '../QuickActions';
import type { DashboardExperience } from '../types';

/** Reference A's lower modules, with the real Task workspace allocated readable width. */
export default function R7LowerRegion({ actions }: { actions: DashboardExperience['quickActions'] }) {
    return <section className="r7-lower" aria-label="Personal workspace and shortcuts">
        <div className="r7-lower-grid">
            <section className="r7-lower-card r7-lower-events" aria-labelledby="r7-calendar-title">
                <h2 className="r7-lower-title" id="r7-calendar-title">
                    <CalendarDays size={18} aria-hidden="true" /> Upcoming events
                </h2>
                <div className="r7-lower-body">
                    <p>No authorized event preview is currently provided to this dashboard.</p>
                    <p className="r7-supporting">Use the Calendar workspace for events visible to your account.</p>
                </div>
            </section>

            <section className="r7-lower-card r7-lower-tasks" id="personal-tasks" tabIndex={-1} aria-labelledby="r7-tasks-title">
                <h2 className="r7-lower-title" id="r7-tasks-title">
                    <ListTodo size={18} aria-hidden="true" /> My tasks
                </h2>
                <p className="r7-task-intro">
                    Review, create, and update your individual Tasks here. Work Requests use their separate authorized workspace.
                </p>
                <div className="r7-embedded-task">
                    <div className="r7-task-reading"><PersonalTaskWorkspace /></div>
                    <div className="r7-task-writing"><PersonalTaskMutationPanel /></div>
                </div>
            </section>

            <section className="r7-lower-card r7-lower-documents" aria-labelledby="r7-documents-title">
                <h2 className="r7-lower-title" id="r7-documents-title">
                    <FileText size={18} aria-hidden="true" /> Recent documents
                </h2>
                <div className="r7-lower-body">
                    <p>No authorized document preview is currently provided to this dashboard.</p>
                    <p className="r7-supporting">Document visibility remains controlled by Records permissions.</p>
                </div>
            </section>

            <section className="r7-lower-card r7-lower-links" aria-labelledby="r7-links-title">
                <h2 className="r7-lower-title" id="r7-links-title">
                    <LayoutGrid size={18} aria-hidden="true" /> Quick links
                </h2>
                <QuickActions actions={actions} />
                <p className="r7-links-note">Only destinations available to your account appear here.</p>
            </section>
        </div>
    </section>;
}
