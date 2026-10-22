<?php

namespace App\Domain\Identity;

use DomainException;
use Laravel\Socialite\Two\User as GoogleUser;

/**
 * Only UserInfo fetched by Socialite's stateful Google OAuth code flow.
 * No access/ID/refresh tokens or Google-supplied roles are stored here.
 */
final readonly class GoogleOidcProfile
{
    public function __construct(
        public string $subject,
        public string $verifiedEmail,
    ) {
        if ($subject === '' || strlen($subject) > 255 ||
            preg_match('/\A[^\x00-\x20\x7f]+\z/D', $subject) !== 1 ||
            strlen($verifiedEmail) > 254 ||
            filter_var($verifiedEmail, FILTER_VALIDATE_EMAIL) === false) {
            throw new DomainException('Google identity could not be verified.');
        }
    }

    public static function fromSocialite(GoogleUser $identity): self
    {
        $raw = $identity->getRaw();

        // Do not treat a mere Google email string as an attestation.
        if (! is_array($raw) || ($raw['email_verified'] ?? null) !== true) {
            throw new DomainException('Google identity could not be verified.');
        }

        $subject = $raw['sub'] ?? null;
        $email = $raw['email'] ?? null;
        if (! is_string($subject) || ! is_string($email) ||
            (string) $identity->getId() !== $subject ||
            (string) $identity->getEmail() !== $email) {
            throw new DomainException('Google identity could not be verified.');
        }

        return new self($subject, strtolower($email));
    }
}
