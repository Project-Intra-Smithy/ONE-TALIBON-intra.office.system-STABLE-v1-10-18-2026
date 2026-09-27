<?php

namespace App\Http\Controllers;

use App\Services\DocumentArchiveQuery;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class PortalSearchController extends Controller
{
    public function __invoke(Request $request, DocumentArchiveQuery $archive): Response
    {
        return Inertia::render('Search/Index', [
            'archiveActivity' => $archive->activity($request->user()),
        ]);
    }
}
