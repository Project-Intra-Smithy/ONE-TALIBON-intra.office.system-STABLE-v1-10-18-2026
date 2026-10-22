import type { DocumentFilters } from './documentCenterPresentation';

type FileSearch = {
    archive_scope: string;
    archive_search: string;
    document_type: string;
    classification: string;
    archive_office_id?: number | null;
    archive_year: string;
};
type FileDraft = { search: string; documentType: string; classification: string; officeId: string; year: string };

function validDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(value + 'T00:00:00.000Z');
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function recordDateError(filters: DocumentFilters): string | null {
    if (filters.date_from && !validDate(filters.date_from)) return 'Enter a valid start date.';
    if (filters.date_to && !validDate(filters.date_to)) return 'Enter a valid end date.';
    if (filters.date_from && filters.date_to && filters.date_from > filters.date_to) {
        return 'The start date must not be after the end date.';
    }
    return null;
}

export function recordFiltersQuery(filters: DocumentFilters): Record<string, string | number> {
    const parameters: Record<string, string | number> = {
        mode: 'records',
        record_type: filters.record_type || 'all',
    };
    if (filters.search.trim()) parameters.search = filters.search.trim();
    if (filters.state) parameters.state = filters.state;
    if (typeof filters.office_id === 'number' && filters.office_id > 0) parameters.office_id = filters.office_id;
    if (filters.date_from) parameters.date_from = filters.date_from;
    if (filters.date_to) parameters.date_to = filters.date_to;
    return parameters;
}

/** Retain the server-generated page/filters, but never navigate to a foreign origin. */
export function recordPaginationHref(href: string): string {
    try {
        const parsed = new URL(href, 'https://document-center.local');
        if (parsed.pathname !== '/documents') return '/documents?mode=records';
        parsed.searchParams.set('mode', 'records');
        parsed.searchParams.delete('document');
        return '/documents?' + parsed.searchParams.toString();
    } catch {
        return '/documents?mode=records';
    }
}

export function fileCatalogQuery(
    applied: FileSearch,
    draft: FileDraft,
    page = 1,
    selectedDocument?: string | null,
): Record<string, string | number> {
    const params: Record<string, string | number> = {
        mode: 'files',
        archive_scope: applied.archive_scope || 'all',
        page: Math.max(1, Math.floor(page)),
    };
    if (draft.search.trim()) params.archive_search = draft.search.trim();
    if (draft.documentType) params.document_type = draft.documentType;
    if (draft.classification) params.classification = draft.classification;
    if (draft.officeId) params.archive_office_id = draft.officeId;
    if (draft.year) params.archive_year = draft.year;
    if (selectedDocument) params.document = selectedDocument;
    return params;
}

export function safeInternalHref(href?: string | null): string | null {
    if (!href || !href.startsWith('/') || href.startsWith('//') || /[\s\\\u0000-\u001f]/.test(href)) return null;
    return href;
}

export function safeDownloadHref(href?: string | null): string | null {
    const safe = safeInternalHref(href);
    if (!safe || !/^\/documents\/[^/?#]+\/download(?:\?[^#]*)?$/.test(safe)) return null;
    return safe;
}

export function fileSizeLabel(bytes?: number | null): string {
    if (bytes === null || bytes === undefined || !Number.isFinite(bytes) || bytes < 0) return 'Not supplied';
    if (bytes < 1024) return String(bytes) + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
