import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Announcements">
            <AuthorityPendingSurface
                title="Announcements"
                description="Announcement publishing is not part of the canonical active product surface until LGU publishing authority and audience rules are confirmed."
                missing="Publishing authority, audience rules, lifecycle, acknowledgement requirements and exception handling."
                treatment="Announcement publishing and static municipal-looking announcement records are de-exposed. Official Memoranda remains the authoritative shared issuance surface already in scope."
                dependency="ANN-001 client/LGU authority, followed by any required P06 API or permission contract."
            />
        </AppLayout>
    );
}
