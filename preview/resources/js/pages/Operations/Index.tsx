import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function OperationsIndex() {
    return (
        <AppLayout title="Operational Tracking">
            <AuthorityPendingSurface
                title="Project & Procurement Tracking"
                description="Live project and procurement tracking is awaiting formal LGU process and reporting approval."
                missing="Approved procurement and project workflows, responsible offices, signing authorities, timelines, and official performance indicators."
                treatment="Use Work Requests and the Municipal PPA Register for currently active coordination and planning records."
                dependency="Pending Municipality of Talibon executive and BAC/Engineering process sign-off."
            />
        </AppLayout>
    );
}
