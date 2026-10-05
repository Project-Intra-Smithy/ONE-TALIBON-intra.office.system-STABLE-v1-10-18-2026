import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Project Monitoring">
            <AuthorityPendingSurface
                title="Project Monitoring"
                description="Project monitoring is de-exposed until LGU lifecycle and KPI authority is confirmed."
                missing="Authoritative project lifecycle, responsible process owners, progress rules, reporting fields and official KPI definitions."
                treatment="Static project examples, progress percentages and portfolio summaries are not projected as live municipal authority."
                dependency="PROJ-001, WF-001, WF-002 and KPI-001; any resulting backend/API contract belongs to P06."
            />
        </AppLayout>
    );
}
