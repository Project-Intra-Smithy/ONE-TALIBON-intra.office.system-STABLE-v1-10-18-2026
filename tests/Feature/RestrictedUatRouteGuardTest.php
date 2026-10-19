<?php

namespace Tests\Feature;

use App\Http\Middleware\DenyUnapprovedMessaging;
use App\Http\Middleware\DenyUnverifiedCorrespondenceMutations;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class RestrictedUatRouteGuardTest extends TestCase
{
    public function test_all_three_message_routes_and_eight_correspondence_writes_are_guarded(): void
    {
        foreach (['messages.index', 'messages.feed.index', 'messages.feed.store'] as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route);
            $this->assertContains(DenyUnapprovedMessaging::class, $route->gatherMiddleware());
        }

        foreach ([
            'correspondence.workspace.register', 'correspondence.workspace.classify',
            'correspondence.workspace.route', 'correspondence.workspace.act',
            'correspondence.register', 'correspondence.classify',
            'correspondence.route', 'correspondence.act',
        ] as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route);
            $this->assertContains(DenyUnverifiedCorrespondenceMutations::class, $route->gatherMiddleware());
        }

        foreach (['tasks.store','tasks.start','tasks.complete','transactions.store','transactions.transition'] as $name) {
            $route = Route::getRoutes()->getByName($name);
            $this->assertNotNull($route);
            $this->assertNotContains(DenyUnapprovedMessaging::class, $route->gatherMiddleware());
            $this->assertNotContains(DenyUnverifiedCorrespondenceMutations::class, $route->gatherMiddleware());
        }
    }

    public function test_restricted_correspondence_denies_before_downstream_mutation_and_only_literal_false_opts_out(): void
    {
        $guard = app(DenyUnverifiedCorrespondenceMutations::class);
        $request = Request::create('/correspondence/synthetic/register', 'POST');

        foreach ([true, null, 'false', 1] as $restrictedValue) {
            config()->set('messaging_release.restricted_uat', $restrictedValue);
            $nextCalled = false;

            try {
                $guard->handle($request, function () use (&$nextCalled) {
                    $nextCalled = true;

                    return response()->noContent();
                });
                $this->fail('Restricted UAT did not deny correspondence mutation.');
            } catch (HttpException $exception) {
                $this->assertSame(403, $exception->getStatusCode());
            }

            $this->assertFalse($nextCalled, 'A restricted request reached the mutation handler.');
        }

        // Explicit non-UAT integration opt-in is strict boolean false only.
        config()->set('messaging_release.restricted_uat', false);
        $nextCalled = false;
        $response = $guard->handle($request, function () use (&$nextCalled) {
            $nextCalled = true;

            return response()->noContent();
        });

        $this->assertTrue($nextCalled);
        $this->assertSame(204, $response->getStatusCode());
        config()->set('messaging_release.restricted_uat', true);
    }

}
