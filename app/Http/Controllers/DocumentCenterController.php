<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Http\Requests\RecordsIndexRequest;
use App\Models\Document;
use App\Services\CommonEvidence\DocumentTraceabilityQuery;
use App\Services\DocumentArchiveQuery;
use App\Services\RecordsSearchQuery;
use Inertia\Inertia;
use Inertia\Response;

final class DocumentCenterController extends Controller
{
    public function __invoke(
        RecordsIndexRequest $request,
        RecordsSearchQuery $records,
        DocumentArchiveQuery $archive,
        DocumentTraceabilityQuery $traceability,
    ): Response {
        $filters = $request->validated();
        $mode = (string) ($filters['mode'] ?? 'records');
        $archiveWorkspace = $mode === 'files'
            ? $archive->workspace($request->user(), $filters)
            : $this->emptyArchiveWorkspace($filters);

        $selectedTraceability = null;
        if ($mode === 'files' && isset($archiveWorkspace['selected']['publicId']) && is_string($archiveWorkspace['selected']['publicId'])) {
            $selectedDocument = Document::query()
                ->where('public_id', $archiveWorkspace['selected']['publicId'])
                ->first();
            if ($selectedDocument !== null) {
                $selectedTraceability = $traceability->forAuthorizedDocument($request->user(), $selectedDocument);
            }
        }

        return Inertia::render('Documents/Index', [
            ...$records->workspace($request->user(), $filters),
            'mode' => $mode,
            'archive' => $archiveWorkspace,
            'selectedTraceability' => $selectedTraceability,
        ]);
    }

    /** @param array<string, mixed> $filters */
    private function emptyArchiveWorkspace(array $filters): array
    {
        return [
            'records' => [
                'data' => [],
                'total' => 0,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => 20,
                'from' => null,
                'to' => null,
            ],
            'selected' => null,
            'counts' => [
                'all' => 0,
                'my_sent' => 0,
                'my_received' => 0,
                'my_uploads' => 0,
            ],
            'filters' => [
                'archive_scope' => (string) ($filters['archive_scope'] ?? 'all'),
                'archive_search' => (string) ($filters['archive_search'] ?? ''),
                'document_type' => (string) ($filters['document_type'] ?? ''),
                'classification' => (string) ($filters['classification'] ?? ''),
                'archive_office_id' => isset($filters['archive_office_id']) ? (int) $filters['archive_office_id'] : null,
                'archive_year' => (string) ($filters['archive_year'] ?? ''),
                'document' => isset($filters['document']) ? (string) $filters['document'] : null,
            ],
            'filterOptions' => [
                'documentTypes' => [],
                'classifications' => [],
                'years' => [],
                'offices' => [],
            ],
        ];
    }
}
