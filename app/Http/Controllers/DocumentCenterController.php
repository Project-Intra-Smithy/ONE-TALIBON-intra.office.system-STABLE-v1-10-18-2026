<?php

namespace App\Http\Controllers;

use App\Http\Requests\RecordsIndexRequest;
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
    ): Response {
        $filters = $request->validated();

        return Inertia::render('Documents/Index', [
            ...$records->workspace($request->user(), $filters),
            'mode' => (string) ($filters['mode'] ?? 'records'),
            'archive' => $archive->workspace($request->user(), $filters),
        ]);
    }
}
