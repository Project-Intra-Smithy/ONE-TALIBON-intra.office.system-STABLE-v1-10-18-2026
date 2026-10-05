import AuthorityPendingSurface from '../../components/product/AuthorityPendingSurface';
import AppLayout from '../../layouts/AppLayout';

export default function Index() {
    return (
        <AppLayout title="Meetings">
            <AuthorityPendingSurface
                title="Meetings"
                description="The meeting workflow is not an authoritative active product surface until the LGU confirms lifecycle ownership and records policy."
                missing="Meeting lifecycle, owner, participant authority, action-item ownership, minutes rules and records linkage."
                treatment="Static meeting records and workflow-looking summaries are de-exposed. Calendar remains available for accepted authorized calendar event data."
                dependency="MEET-001 client/LGU authority, followed by any required P06 data and API contract."
            />
        </AppLayout>
    );
}
