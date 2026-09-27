<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\Memorandum;
use App\Models\MemoRecipient;
use App\Services\MemorandumAuthority;
use App\Services\MemorandumService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class MemorandumController extends Controller
{
    private const VIEWS = ['overview', 'for_me', 'needs_acknowledgement', 'unread', 'acknowledged', 'office_issuances', 'municipality_wide'];
    public function index(Request $request, MemorandumAuthority $authorityService): Response
    {
        $user = $request->user()->loadMissing('employee.department');
        $authority = $authorityService->describe($user);
        $view = (string) $request->query('view', 'overview');
        $view = in_array($view, self::VIEWS, true) ? $view : 'overview';
        $departmentId = (int) ($authority['issuingOffice']['id'] ?? 0);

        $base = Memorandum::query()
            ->with([
                'issuer:id,name',
                'issuingDepartment:id,code,name,short_name',
                'recipients' => fn ($query) => $query
                    ->where('user_id', $user->id)
                    ->select(['id', 'memorandum_id', 'user_id', 'delivered_at', 'viewed_at', 'acknowledged_at']),
            ])
            ->withCount('recipients')
            ->where('status', 'published');

        if (! $user->isRole('system_admin')) {
            $base->where(function (Builder $visible) use ($user, $authority, $departmentId): void {
                $visible->whereHas('recipients', fn (Builder $recipients) => $recipients->where('user_id', $user->id));

                if ($authority['canPublish'] && $departmentId > 0) {
                    $visible->orWhere('issued_by_department_id', $departmentId);
                }
            });
        }

        $scopes = [
            'for_me' => fn (Builder $query): Builder => $query->whereHas('recipients', fn (Builder $recipients) => $recipients->where('user_id', $user->id)),
            'needs_acknowledgement' => fn (Builder $query): Builder => $query
                ->where('requires_acknowledgement', true)
                ->whereHas('recipients', fn (Builder $recipients) => $recipients->where('user_id', $user->id)->whereNull('acknowledged_at')),
            'unread' => fn (Builder $query): Builder => $query
                ->whereHas('recipients', fn (Builder $recipients) => $recipients->where('user_id', $user->id)->whereNull('viewed_at')),
            'acknowledged' => fn (Builder $query): Builder => $query
                ->whereHas('recipients', fn (Builder $recipients) => $recipients->where('user_id', $user->id)->whereNotNull('acknowledged_at')),
            'office_issuances' => fn (Builder $query): Builder => $authority['canPublish'] && $departmentId > 0
                ? $query->where('issued_by_department_id', $departmentId)
                : $query->whereRaw('1 = 0'),
            'municipality_wide' => fn (Builder $query): Builder => $authority['municipalityWide'] && $departmentId > 0
                ? $query->where('issued_by_department_id', $departmentId)->where('audience_type', 'all')
                : $query->whereRaw('1 = 0'),
        ];

        $overview = ['counts' => []];
        foreach ($scopes as $key => $scope) {
            $overview['counts'][$key] = $scope(clone $base)->count();
        }

        $query = clone $base;
        if ($view !== 'overview' && isset($scopes[$view])) {
            $scopes[$view]($query);
        }

        $memoranda = $query
            ->latest('published_at')
            ->limit($view === 'overview' ? 6 : 100)
            ->get();

        return Inertia::render('Memoranda/Index', [
            'memoranda' => $memoranda,
            'authority' => $authority,
            'overview' => $overview,
            'view' => $view,
        ]);
    }

    public function create(Request $request, MemorandumAuthority $authorityService): Response
    {
        $user = $request->user()->loadMissing('employee.department');
        $authority = $authorityService->describe($user);
        abort_unless($authority['canPublish'], 403);

        $departmentId = (int) $authority['issuingOffice']['id'];

        $departments = Department::query()
            ->where('is_active', true)
            ->when($authority['scope'] === 'department', fn (Builder $query) => $query->whereKey($departmentId))
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'short_name']);

        $employees = Employee::query()
            ->with('user:id,name,email')
            ->whereNotNull('user_id')
            ->where('employment_status', 'active')
            ->when($authority['scope'] === 'department', fn (Builder $query) => $query->where('department_id', $departmentId))
            ->orderBy('employee_number')
            ->get(['id', 'user_id', 'employee_number', 'department_id', 'position_title']);

        $sequence = Memorandum::query()
            ->where('issued_by_department_id', $departmentId)
            ->whereYear('published_at', now()->year)
            ->count() + 1;

        return Inertia::render('Memoranda/Create', [
            'authority' => $authority,
            'departments' => $departments,
            'employees' => $employees,
            'suggestedMemoNumber' => sprintf('%s-%d-%03d', $authority['memoPrefix'], now()->year, $sequence),
        ]);
    }

    public function store(Request $request, MemorandumService $service, MemorandumAuthority $authorityService): RedirectResponse
    {
        $authority = $authorityService->describe($request->user());
        abort_unless($authority['canPublish'], 403);

        $data = $request->validate([
            'memo_number' => ['required', 'string', 'max:80', 'unique:memoranda,memo_number'],
            'title' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string', 'max:20000'],
            'audience_type' => ['required', Rule::in(['all', 'departments', 'employees'])],
            'audience_ids' => ['array'],
            'audience_ids.*' => ['integer'],
            'requires_acknowledgement' => ['boolean'],
            'classification' => ['required', Rule::in(['internal', 'public', 'confidential'])],
            'expires_at' => ['nullable', 'date', 'after:now'],
        ]);

        if ($data['audience_type'] !== 'all' && empty($data['audience_ids'])) {
            return back()
                ->withErrors(['audience_ids' => 'Select at least one authorized department or employee.'])
                ->withInput();
        }

        $memo = $service->publish($request->user(), $data);

        return redirect()
            ->route('memoranda.show', $memo)
            ->with('success', 'Memorandum published and delivered to the authorized audience.');
    }

    public function show(Request $request, Memorandum $memorandum, MemorandumAuthority $authorityService): Response
    {
        $user = $request->user()->loadMissing('employee.department');
        $recipient = MemoRecipient::query()
            ->where('memorandum_id', $memorandum->id)
            ->where('user_id', $user->id)
            ->first();

        $canInspectIssuance = $authorityService->canInspectIssuance(
            $user,
            (int) $memorandum->issued_by_department_id,
        );

        abort_unless($canInspectIssuance || $recipient !== null, 403);

        if ($recipient && ! $recipient->viewed_at) {
            $recipient->update(['viewed_at' => now()]);
        }

        $memorandum->load(['issuer:id,name', 'issuingDepartment:id,code,name,short_name']);

        $delivered = $canInspectIssuance ? $memorandum->recipients()->count() : 0;
        $viewed = $canInspectIssuance ? $memorandum->recipients()->whereNotNull('viewed_at')->count() : 0;
        $acknowledged = $canInspectIssuance ? $memorandum->recipients()->whereNotNull('acknowledged_at')->count() : 0;

        return Inertia::render('Memoranda/Show', [
            'memorandum' => $memorandum,
            'recipient' => $recipient?->fresh(),
            'canInspectIssuance' => $canInspectIssuance,
            'statistics' => $canInspectIssuance ? [
                'delivered' => $delivered,
                'viewed' => $viewed,
                'acknowledged' => $acknowledged,
                'pending' => $memorandum->requires_acknowledgement ? max(0, $delivered - $acknowledged) : 0,
            ] : null,
        ]);
    }

    public function acknowledge(Request $request, Memorandum $memorandum, MemorandumService $service): RedirectResponse
    {
        $service->acknowledge($request->user(), $memorandum);

        return back()->with('success', 'Memorandum acknowledged.');
    }

}
