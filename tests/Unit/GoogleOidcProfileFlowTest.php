<?php

namespace Tests\Unit;

use App\Domain\Identity\GoogleOidcProfile;
use App\Services\GoogleOidcFlow;
use DomainException;
use Illuminate\Http\Request;
use Laravel\Socialite\Two\User as GoogleUser;
use RuntimeException;
use Tests\TestCase;

final class GoogleOidcProfileFlowTest extends TestCase
{
    public function test_verified_google_subject_and_email_are_accepted(): void
    {
        $identity = $this->providerUser('subject-001', 'STAFF@example.test', true);
        $profile = GoogleOidcProfile::fromSocialite($identity);

        $this->assertSame('subject-001', $profile->subject);
        $this->assertSame('staff@example.test', $profile->verifiedEmail);
    }

    public function test_missing_email_verified_claim_is_denied(): void
    {
        $this->expectException(DomainException::class);
        GoogleOidcProfile::fromSocialite($this->providerUser('subject-001', 'staff@example.test', null));
    }

    public function test_false_email_verified_claim_is_denied(): void
    {
        $this->expectException(DomainException::class);
        GoogleOidcProfile::fromSocialite($this->providerUser('subject-001', 'staff@example.test', false));
    }

    public function test_missing_subject_is_denied(): void
    {
        $this->expectException(DomainException::class);
        GoogleOidcProfile::fromSocialite($this->providerUser(null, 'staff@example.test', true));
    }

    public function test_email_only_never_constructs_a_verified_profile(): void
    {
        $this->expectException(DomainException::class);
        new GoogleOidcProfile('', 'staff@example.test');
    }

    public function test_callback_flow_marker_is_single_use(): void
    {
        $flow = new GoogleOidcFlow();
        $request = $this->requestWithSession();
        $flow->begin($request, 'signin');

        $this->assertSame(['purpose' => 'signin', 'user_id' => null], $flow->consume($request));

        $this->expectException(RuntimeException::class);
        $flow->consume($request);
    }

    public function test_missing_stateful_flow_is_denied(): void
    {
        $this->expectException(RuntimeException::class);
        (new GoogleOidcFlow())->consume($this->requestWithSession());
    }

    public function test_expired_flow_is_denied(): void
    {
        $request = $this->requestWithSession();
        $flow = new GoogleOidcFlow();
        $flow->begin($request, 'signin');
        $state = $request->session()->get('auth.google_oidc.flow');
        $state['issued_at'] = now()->getTimestamp() - 301;
        $request->session()->put('auth.google_oidc.flow', $state);

        $this->expectException(RuntimeException::class);
        $flow->consume($request);
    }

    private function providerUser(?string $subject, string $email, ?bool $verified): GoogleUser
    {
        $claims = ['sub' => $subject, 'email' => $email];
        if ($verified !== null) {
            $claims['email_verified'] = $verified;
        }

        return (new GoogleUser())->setRaw($claims)->map(['id' => $subject, 'email' => $email]);
    }

    private function requestWithSession(): Request
    {
        $request = Request::create('/synthetic/google', 'GET');
        $session = app('session')->driver();
        $session->start();
        $session->forget('auth.google_oidc.flow');
        $request->setLaravelSession($session);

        return $request;
    }
}
