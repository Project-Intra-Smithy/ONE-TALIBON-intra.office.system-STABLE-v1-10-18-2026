import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Project Monitoring">
            <AuthorityPendingSurface
                title="Project Monitoring"
                description="Live project progress monitoring is pending official LGU reporting standards and indicator approval."
                missing="Approved project stages, responsible office owners, progress verification rules, and official reporting indicators."
                treatment="Refer to the Programs, Projects and Activities (PPA) register for official municipal planning entries."
                dependency="Pending Municipality of Talibon MPDO and Engineering reporting policy confirmation."
            />
        </AppLayout>
    );
}
