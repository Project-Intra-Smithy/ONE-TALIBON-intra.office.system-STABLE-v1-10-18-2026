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
        $workspace = $calendar->workspace(
            $request->user(),
            $request->query('view'),
            $request->query('date'),
        );

        return Inertia::render('Calendar/Index', $workspace);
    }
}
