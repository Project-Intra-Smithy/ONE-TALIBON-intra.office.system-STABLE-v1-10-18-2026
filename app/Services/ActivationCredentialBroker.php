<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Crypt;
use Throwable;

final class ActivationCredentialBroker
{
    private const SESSION_KEY = 'activationCredential';
    private const DISCLOSURE_SECONDS = 120;

    public function __construct(private readonly StaffActivationService $activation) {}

    /** Seal only the newly issued credential; never store plaintext in session. */
    public function seal(Request $request, array $issued): string
    {
        $session = $request->session();
        return Crypt::encryptString(json_encode([
            'actor' => (int) $request->user()->getKey(),
            'session' => hash('sha256', $session->getId()),
            'epoch' => $session->get(AccountSessionEligibility::EPOCH),
            'mfa' => $session->get(AuthenticationAssurance::SESSION_VERSION_KEY),
            'invitation' => (int) $issued['invitation']->id,
            'code' => $issued['code'],
            'until' => min(now()->getTimestamp() + self::DISCLOSURE_SECONDS, $issued['invitation']->expires_at->getTimestamp()),
        ], JSON_THROW_ON_ERROR));
    }

    public function take(Request $request, User $actor): ?array
    {
        $session = $request->session();
        $sealed = $session->pull(self::SESSION_KEY);

        // Partial/background fetches must never carry a private credential.
        // Discard rather than risk replay from an old plaintext/session payload.
        if (! is_string($sealed)
            || $request->headers->has('X-Inertia-Partial-Component')
            || $request->headers->has('X-Inertia-Partial-Data')
            || $request->headers->has('X-Inertia-Partial-Except')
            || $request->headers->has('X-Inertia-Prefetch')
            || str_contains(strtolower((string) $request->header('Purpose')), 'prefetch')
            || str_contains(strtolower((string) $request->header('Sec-Purpose')), 'prefetch')) {
            return null;
        }

        try {
            $payload = json_decode(Crypt::decryptString($sealed), true, flags: JSON_THROW_ON_ERROR);
        } catch (Throwable) {
            return null;
        }

        if (! is_array($payload)
            || ($payload['actor'] ?? null) !== (int) $actor->id
            || ! is_string($payload['session'] ?? null)
            || ! hash_equals($payload['session'], hash('sha256', $session->getId()))
            || ! is_int($payload['epoch'] ?? null)
            || $payload['epoch'] !== $session->get(AccountSessionEligibility::EPOCH)
            || ! is_int($payload['mfa'] ?? null)
            || $payload['mfa'] !== $session->get(AuthenticationAssurance::SESSION_VERSION_KEY)
            || ! is_int($payload['until'] ?? null)
            || $payload['until'] <= now()->getTimestamp()
            || ! is_int($payload['invitation'] ?? null)
            || ! is_string($payload['code'] ?? null)) {
            return null;
        }

        // A database claim protects even if two requests read the same session.
        return $this->activation->claimDisclosure($request, $actor, $payload['invitation'], $payload['code']);
    }
}
