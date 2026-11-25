import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Meetings">
            <AuthorityPendingSurface
                title="Meetings"
                description="Dedicated meeting records and minutes tracking are pending official LGU records policy."
                missing="Meeting scheduling ownership, participant roles, action-item tracking, and minutes archiving rules."
                treatment="Use Municipal Calendar to view authorized upcoming sessions and office schedules."
                dependency="Pending Municipality of Talibon records management policy confirmation."
            />
        </AppLayout>
    );
}
