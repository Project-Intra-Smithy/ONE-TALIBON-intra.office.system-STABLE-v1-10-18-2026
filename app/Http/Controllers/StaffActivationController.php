<?php

namespace App\Http\Controllers;

use App\Models\StaffActivationInvitation;
use App\Models\User;
use App\Services\ActivationCredentialBroker;
use App\Services\StaffActivationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Inertia\Inertia;
use Inertia\Response;

final class StaffActivationController extends Controller
{
    public function store(Request $request, StaffActivationService $service, ActivationCredentialBroker $broker): RedirectResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'integer', 'exists:employees,id'],
            'username' => ['required', 'string', 'min:3', 'max:64', 'regex:/\A[a-zA-Z][a-zA-Z0-9._-]*\z/'],
            'contact_email' => ['nullable', 'email:rfc', 'max:255'],
            'role' => ['required', Rule::in(StaffActivationService::INVITABLE_ROLES)],
        ]);
        $issued = $service->issue($request, $request->user(), $data);

        return redirect()->route('admin.index')
            ->with('activationCredential', $broker->seal($request, $issued))
            ->header('Cache-Control', 'no-store, private');
    }

    public function revoke(Request $request, StaffActivationInvitation $invitation, StaffActivationService $service): RedirectResponse
    {
        $service->revoke($request, $request->user(), $invitation, (string) $request->input('reason', 'administrator revoked'));
        return back()->with('success', 'Pending activation revoked.');
    }

    public function suspend(Request $request, User $user, StaffActivationService $service): RedirectResponse
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:4', 'max:160']]);
        $service->suspend($request, $request->user(), $user, $data['reason']);
        return back()->with('success', 'Account suspended and existing sessions invalidated.');
    }

    public function reactivate(Request $request, User $user, StaffActivationService $service): RedirectResponse
    {
        $service->reactivate($request, $request->user(), $user);
        return back()->with('success', 'Account reactivated.');
    }

    public function recover(Request $request, User $user, StaffActivationService $service, ActivationCredentialBroker $broker): RedirectResponse
    {
        $issued = $service->recover($request, $request->user(), $user);
        return redirect()->route('admin.index')
            ->with('activationCredential', $broker->seal($request, $issued))
            ->header('Cache-Control', 'no-store, private');
    }

    public function show(): Response
    {
        return Inertia::render('Auth/ActivateAccount');
    }

    public function redeem(Request $request, StaffActivationService $service): RedirectResponse
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:64'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols(), 'max:128'],
        ]);
        $user = $service->redeem($data['code'], $data['password']);
        Auth::guard('web')->login($user);
        $request->session()->regenerate();
        $request->session()->put('auth_session_version', (int) $user->session_version);

        return redirect()->route(app(\App\Services\AuthenticationAssurance::class)->requiredRoute($user));
    }
}
