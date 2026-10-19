<?php

namespace Tests\Feature;

use App\Http\Middleware\DenyUnapprovedMessaging;
use App\Http\Middleware\DenyUnverifiedCorrespondenceMutations;
use Illuminate\Support\Facades\Route;
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
}
