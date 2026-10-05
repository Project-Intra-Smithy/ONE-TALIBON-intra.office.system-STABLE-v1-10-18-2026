import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function OperationsIndex() {
    return (
        <AppLayout title="Operational Tracking">
            <AuthorityPendingSurface
                title="Project & Procurement Tracking"
                description="Project Monitoring and Procurement lifecycle presentation is withheld from the canonical product until LGU process authority is established."
                missing="Validated procurement and project lifecycles, process owners, routing, approvals/signatures, SLA timing, confidentiality rules and official KPI definitions."
                treatment="Existing backend records are retained for technical continuity but are not projected as an approved municipal lifecycle, dashboard or KPI surface."
                dependency="PROC-001, PROJ-001, WF-001, WF-002 and KPI-001; any required backend/API changes belong to P06."
            />
        </AppLayout>
    );
}
