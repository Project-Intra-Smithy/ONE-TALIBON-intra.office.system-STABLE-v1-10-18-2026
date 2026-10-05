import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Workspace() {
    return (
        <AppLayout title="Department Workspace">
            <AuthorityPendingSurface
                title="Department Workspace"
                description="Department-specific workflow presentation is withheld until each LGU process owner confirms the authoritative workflow contract."
                missing="Department fields and forms, routing, approvals and signatures, SLA timing, reporting, confidentiality rules and exception handling."
                treatment="The shared Tasks & Assignments, Correspondence, Documents, Records and Directory surfaces remain available where existing backend authority already supports them. Department-specific workflow UI is not presented as complete."
                dependency="WF-001 and WF-002 client/LGU validation; resulting backend or API work belongs to P06."
            />
        </AppLayout>
    );
}
