<?php

// Optional providers. No secret or provider is required for password login.
return [
    'google' => [
        'client_id' => env('GOOGLE_OIDC_CLIENT_ID'),
        'client_secret' => env('GOOGLE_OIDC_CLIENT_SECRET'),
        'redirect' => env('GOOGLE_OIDC_REDIRECT_URI'),
    ],
];
