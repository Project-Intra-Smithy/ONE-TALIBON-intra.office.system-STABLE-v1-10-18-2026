<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\AuthenticationAssurance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class AccountSecurityController extends Controller
{
    public function __invoke(Request $request, AuthenticationAssurance $assurance): Response
    {
        return Inertia::render('Auth/AccountSecurity', [
            'requiresMfa' => $assurance->requiresMfa($request->user()),
        ]);
    }
}
