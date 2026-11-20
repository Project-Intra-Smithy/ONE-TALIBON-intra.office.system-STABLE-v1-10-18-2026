<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthenticationAssurance;
use App\Services\MfaRecoveryCodeBroker;
use App\Services\MfaService;
use App\Services\SensitiveInertiaResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;
use Symfony\Component\HttpFoundation\Response;

final class MfaSecurityController extends Controller
{
    public function __construct(
        private readonly AuthenticationAssurance $assurance,
        private readonly MfaService $mfa,
        private readonly MfaRecoveryCodeBroker $recoveryBroker,
        private readonly SensitiveInertiaResponse $sensitiveResponse,
    ) {}

    public function index(Request $request): InertiaResponse
    {
        $user = $request->user();
        $user->refresh();

        return Inertia::render('Auth/MfaSettings', [
            'configured' => $this->assurance->enrollmentExists($user),
            'confirmedAt' => $user->mfa_confirmed_at?->toIso8601String(),
            'recoveryGeneratedAt' => $user->mfa_recovery_codes_generated_at?->toIso8601String(),
        ]);
    }

    public function recovery(Request $request): Response|RedirectResponse
    {
        $sealed = $request->session()->pull('mfa_recovery_codes_sealed');
        $codes = $this->recoveryBroker->open(is_string($sealed) ? $sealed : null);

        if ($codes === []) {
            return redirect()->route('mfa.settings');
        }

        Inertia::flash('mfaRecoveryCodes', $codes);

        return $this->sensitiveResponse->render($request, 'Auth/MfaRecoveryCodes', [
            'continueUrl' => $request->session()->get('url.intended', route('dashboard')),
        ]);
    }

    public function regenerateRecoveryCodes(Request $request): RedirectResponse
    {
        $user = $request->user();
        $codes = $this->mfa->regenerateRecoveryCodes($user, $request);

        return redirect()->route('mfa.recovery.show')->with(
            'mfa_recovery_codes_sealed',
            $this->recoveryBroker->seal($codes),
        );
    }

    public function reset(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->mfa->resetEnrollment($user, $request);
        $user->refresh();
        $this->assurance->clear($request);

        return redirect()->route('mfa.enroll');
    }

    public function disable(Request $request): RedirectResponse
    {
        $user = $request->user();
        $this->mfa->disable($user, $request);
        $user->refresh();
        $this->assurance->clear($request);

        return redirect()->route('mfa.enroll')->with('success', 'MFA was disabled. Re-enrollment is required before municipal access resumes.');
    }
}
