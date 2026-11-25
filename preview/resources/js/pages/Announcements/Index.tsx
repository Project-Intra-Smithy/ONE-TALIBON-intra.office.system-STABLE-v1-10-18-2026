import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Announcements">
            <AuthorityPendingSurface
                title="Announcements"
                description="Municipal announcements are pending official publishing guidelines and office audience rules."
                missing="Publishing authority, target audience rules, posting lifecycle, and acknowledgement requirements."
                treatment="Official Memoranda remains the authorized municipal issuance channel for office-wide notices."
                dependency="Pending Municipality of Talibon executive approval and publishing policy."
            />
        </AppLayout>
    );
}
