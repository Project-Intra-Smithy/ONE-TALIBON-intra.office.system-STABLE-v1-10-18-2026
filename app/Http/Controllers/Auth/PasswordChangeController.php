<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

final class PasswordChangeController extends Controller
{
    public function __invoke(Request $request, AuditLogger $audit): RedirectResponse
    {
        $data = $request->validate([
            'current_password' => ['required', 'string'],
            'password' => ['required', 'confirmed', Password::min(12)->mixedCase()->numbers()->symbols(), 'max:128'],
        ]);
        $user = $request->user();
        if (! Hash::check($data['current_password'], $user->password)) {
            throw ValidationException::withMessages(['current_password' => 'The current password is incorrect.']);
        }
        $user->forceFill([
            'password' => $data['password'],
            'session_version' => ((int) $user->session_version) + 1,
            'remember_token' => null,
        ])->save();
        $request->session()->put('auth_session_version', (int) $user->session_version);
        $audit->record($user, 'identity.password.changed', 'Account password changed by the authenticated user.', 'allowed', $user::class, $user->id);

        return back()->with('success', 'Password changed. Other sessions have been invalidated.');
    }
}
