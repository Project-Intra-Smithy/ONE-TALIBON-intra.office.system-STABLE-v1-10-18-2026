import type { PortalDestinationKey } from '../../navigation/portalNavigation';
import type { StatusTone } from '../portal/StatusBadge';
export type DocumentOffice = { id?: number; code: string; name: string; shortName?: string | null };
export type DocumentRow = { recordType: string; reference?: string | null; title: string; source: string; originOffice?: DocumentOffice | null; currentOffice?: DocumentOffice | null; assignedEmployee?: { name: string; position?: string | null } | null; state: string; classification?: string | null; recordDate?: string | null; updatedAt?: string | null; detailUrl: string };
export type DocumentFilters = { sort?: 'newest' | 'oldest'; search: string; record_type: string; state: string; office_id?: number | null; date_from: string; date_to: string };
export type DocumentCenterProps = { records: { data: DocumentRow[]; total: number; current_page: number; last_page: number; prev_page_url?: string | null; next_page_url?: string | null }; filters: DocumentFilters; filterOptions: { recordTypes: { value: string; label: string }[]; states: { value: string; label: string }[]; offices: DocumentOffice[] } };
export const collectionLabels: Record<string, string> = { all: 'All records', correspondence: 'Correspondence', transaction: 'Inter-office transactions', travel_order: 'Approved travel orders' };
export const relatedWorkspaceKeys: PortalDestinationKey[] = ['memoranda', 'legislative', 'developmentPlans', 'meetings', 'projectMonitoring', 'records'];
export const additionalCategories = ['Contracts / MOAs / MOUs', 'Certifications', 'Permits and Clearances', 'Reports', 'Technical Documents', 'Archived Records'];
export const displayLabel = (value: string) => value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
export const recordFamily = (value: string) => collectionLabels[value] || displayLabel(value);
export const recordDateLabel = (type: string) => type === 'correspondence' ? 'Received date' : type === 'transaction' ? 'Received / created date' : type === 'travel_order' ? 'Issued date' : 'Record date';
export const recordContextLabel = (type: string) => type === 'correspondence' ? 'Sender / source' : type === 'transaction' ? 'Transaction type' : type === 'travel_order' ? 'Destination context' : 'Source context';
export function formatRecordDate(value?: string | null): string {
    if (!value) return '';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}
export function recordStatusTone(record: DocumentRow): StatusTone {
    const tones: Record<string, Record<string, StatusTone>> = {
        correspondence: { received: 'info', registered: 'info', classified: 'info', routed: 'info', in_action: 'info' },
        transaction: { completed: 'success', approved: 'success', pending: 'warning', in_progress: 'info', disapproved: 'danger' },
        travel_order: { approved: 'success', completed: 'success', cancelled: 'neutral' },
    };
    return tones[record.recordType]?.[record.state] || 'neutral';
}
