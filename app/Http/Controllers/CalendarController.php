<?php

namespace App\Http\Controllers;

use App\Services\CalendarWorkspaceQueryService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function __invoke(Request $request, CalendarWorkspaceQueryService $calendar): Response
    {
        $requestedView = $request->query('view');
        $requestedDate = $request->query('date');
        $workspace = $calendar->workspace(
            $request->user(),
            is_string($requestedView) ? $requestedView : null,
            is_string($requestedDate) ? $requestedDate : null,
        );

        return Inertia::render('Calendar/Index', $workspace);
    }
}
