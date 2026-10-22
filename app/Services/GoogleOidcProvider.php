<?php

namespace App\Services;

use Illuminate\Http\RedirectResponse;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as GoogleUser;

/**
 * Stateful Laravel Socialite Google adapter.
 * Never call stateless(); it disables Socialite's OAuth state validation.
 */
final class GoogleOidcProvider
{
    public function redirect(): RedirectResponse
    {
        return Socialite::driver('google')
            ->scopes(['openid', 'email', 'profile'])
            ->enablePKCE()
            ->redirect();
    }

    public function user(): GoogleUser
    {
        return Socialite::driver('google')->enablePKCE()->user();
    }
}
