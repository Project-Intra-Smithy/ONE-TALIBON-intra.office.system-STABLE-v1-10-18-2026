<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\Employee;
use App\Models\StaffActivationInvitation;
use App\Services\AuthenticationAssurance;
use App\Services\StaffActivationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

final class StaffActivationController extends Controller
{
    public function __construct(
        private readonly StaffActivationService $activations,
        private readonly AuthenticationAssurance $assurance,
    ) {
    }

    public function index(Request $request): Response
    {
        $this->activations->authorizeAdministrator($request->user());

        $employees = Employee::query()
            ->with('department:id,code,name,is_active')
            ->where('employment_status', 'active')->whereNull('separation_date')
            ->whereNotNull('work_email')->whereNotNull('full_name')
            ->whereHas('department', fn ($query) => $query->where('is_active', true))
            ->where(function ($query): void {
                $query->whereNull('user_id')
                    ->orWhereHas('user', fn ($users) => $users->where('is_active', false));
            })->orderBy('full_name')->limit(300)
            ->get(['id', 'user_id', 'employee_number', 'full_name', 'work_email', 'department_id'])
            ->map(fn (Employee $employee) => [
                'id' => $employee->id,
                'name' => $employee->full_name,
                'number' => $employee->employee_number,
                'office' => $employee->department?->name,
                'departmentId' => $employee->department_id,
            ])->all();

        $invitations = StaffActivationInvitation::query()
            ->with('employee:id,full_name,employee_number')
            ->latest('id')->limit(30)->get()
            ->map(fn (StaffActivationInvitation $invitation) => [
                'id' => $invitation->id,
                'employee' => $invitation->employee?->full_name,
                'expiresAt' => $invitation->expires_at->toIso8601String(),
                'status' => $invitation->consumed_at ? 'consumed'
                    : ($invitation->revoked_at ? 'revoked'
                        : ($invitation->expires_at->isPast() ? 'expired' : 'pending')),
            ])->all();

        return Inertia::render('Admin/Invitations', [
            'employees' => $employees,
            'roles' => StaffActivationService::INVITABLE_ROLES,
            'invitations' => $invitations,
            // Only revealed during the successful administrator redirect.
            'oneTimeLink' => $request->session()->get('staff_activation_link'),
        ])->toResponse($request)->header('Cache-Control', 'private, no-store')
            ->header('Referrer-Policy', 'no-referrer');
    }

    public function store(Request $request): RedirectResponse
    {
        $this->activations->authorizeAdministrator($request->user());

        $values = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'department_id' => ['required', 'integer', 'exists:departments,id'],
            'role' => ['required', Rule::in(StaffActivationService::INVITABLE_ROLES)],
        ]);

        // Never derive a bearer-token destination from an untrusted Host header.
        $baseUrl = rtrim((string) config('app.url'), '/');
        $scheme = parse_url($baseUrl, PHP_URL_SCHEME);
        if (! filter_var($baseUrl, FILTER_VALIDATE_URL) || ! in_array($scheme, ['http', 'https'], true)
            || (app()->environment('production') && $scheme !== 'https')) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'invitation' => 'The configured activation origin is not ready for secure invitation delivery.',
            ]);
        }

        $issued = $this->activations->issue(
            $request->user(), (int) $values['employee_id'],
            (int) $values['department_id'], $values['role'],
        );

        $link = $baseUrl.route('staff.activation.show', ['token' => $issued['token']], false);
        return redirect()->route('admin.invitations.index')
            ->with('staff_activation_link', $link);
    }

    public function revoke(Request $request, int $invitation): RedirectResponse
    {
        $this->activations->revoke($request->user(), $invitation);
        return redirect()->route('admin.invitations.index');
    }

    public function show(Request $request, string $token): Response
    {
        return Inertia::render('Auth/ActivateAccount', [
            'token' => $token,
            'status' => $this->activations->status($token),
        ])->toResponse($request)->header('Cache-Control', 'private, no-store')
            ->header('Referrer-Policy', 'no-referrer');
    }

    public function claim(Request $request, string $token): RedirectResponse
    {
        $data = $request->validate([
            'employee_number' => ['required', 'string', 'max:64'],
            'password' => ['required', 'confirmed', Password::min(16)->letters()->numbers(), 'max:128'],
        ]);

        $user = $this->activations->redeem($token, $data['employee_number'], $data['password']);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $this->assurance->clear($request);

        return redirect()->route(
            $this->assurance->requiresMfa($user)
                ? $this->assurance->requiredRoute($user)
                : 'dashboard'
        );
    }
}
