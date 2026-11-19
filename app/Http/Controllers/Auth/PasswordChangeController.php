<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AccountSessionEligibility;
use App\Services\AuditLogger;
use App\Services\AuthenticationAssurance;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

final class PasswordChangeController extends Controller
{
    public function __invoke(Request $request, AuditLogger $audit, AccountSessionEligibility $eligibility, AuthenticationAssurance $assurance): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols(), 'max:128'],
        ]);
        $claimed = $request->user();
        $epoch = DB::transaction(function () use ($request, $claimed, $data, $audit, $eligibility, $assurance): int {
            $locked = $eligibility->lock($claimed);
            $eligibility->requireSession($request, $locked);
            if (! $assurance->isSatisfiedAgainst($request, $locked)) {
                throw new AuthorizationException('Account access denied.');
            }
            if (! Hash::check($data['current_password'], $locked->password)) {
                throw ValidationException::withMessages(['current_password' => 'The current password is incorrect.']);
            }
            $locked->forceFill([
                'password' => $data['password'],
                'session_version' => (int) $locked->session_version + 1,
                'remember_token' => null,
            ])->save();
            $audit->record($locked, 'identity.password.changed', 'Account password changed by the authenticated user.', 'allowed', $locked::class, $locked->id);

            return (int) $locked->session_version;
        }, 3);

        // Bind only the epoch committed by this operation, never a later read.
        $request->session()->regenerate();
        $request->session()->put(AccountSessionEligibility::EPOCH, $epoch);

        return back()->with('success', 'Password changed. Other sessions have been invalidated.');
    }
}
