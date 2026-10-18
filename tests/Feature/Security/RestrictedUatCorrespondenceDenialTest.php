<?php

namespace Tests\Feature\Security;

use App\Domain\Correspondence\CorrespondenceLifecycleState;
use App\Http\Middleware\DenyUnverifiedCorrespondenceMutations;
use App\Models\CorrespondenceRecord;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Str;
use Tests\TestCase;

final class RestrictedUatCorrespondenceDenialTest extends TestCase
{
    use RefreshDatabase;

    public function test_all_eight_real_correspondence_post_endpoints_deny_without_side_effects(): void
    {
        config()->set('messaging_release.restricted_uat', true);
        $department = Department::query()->create([
            'code' => 'R17-COR-'.Str::upper(Str::random(5)),
            'name' => 'R17 Synthetic Correspondence Office',
            'short_name' => 'R17-COR',
            'is_active' => true,
        ]);
        $user = User::query()->create([
            'name' => 'Synthetic R17 Correspondence Tester',
            'email' => Str::lower(Str::random(12)).'@example.test',
            'password' => 'prototype-test-password',
            'role' => 'department_staff',
            'is_active' => true,
        ]);
        Employee::query()->create([
            'employee_number' => 'R17-'.Str::upper(Str::random(8)),
            'full_name' => $user->name,
            'work_email' => $user->email,
            'user_id' => $user->id,
            'department_id' => $department->id,
            'position_title' => 'Synthetic QA',
            'employment_status' => 'active',
        ]);
        $record = CorrespondenceRecord::query()->create([
            'public_id' => (string) Str::uuid(),
            'external_reference_no' => 'R17-'.Str::upper(Str::random(18)),
            'source' => 'email',
            'channel' => 'official_email',
            'sender_name' => 'R17 Synthetic Sender',
            'subject' => 'R17 synthetic protected subject',
            'summary' => 'Synthetic correspondence, not municipal data',
            'received_at' => now(),
            'receiving_department_id' => $department->id,
            'lifecycle_state' => CorrespondenceLifecycleState::Received->value,
        ]);
        $this->actingAs($user->fresh('employee.department'));

        $initial = [
            'events' => DB::table('correspondence_events')->count(),
            'outbox' => DB::table('outbox_messages')->count(),
            'state' => $record->fresh()->lifecycle_state,
        ];

        foreach (['register', 'classify', 'route', 'act'] as $action) {
            foreach ([false, true] as $workspace) {
                $name = $workspace ? "correspondence.workspace.{$action}" : "correspondence.{$action}";
                $route = Route::getRoutes()->getByName($name);
                $this->assertNotNull($route, $name);
                $this->assertContains(DenyUnverifiedCorrespondenceMutations::class, $route->gatherMiddleware(), $name);
                $url = route($name, ['correspondence' => $record->public_id]);
                $response = $this->postJson($url, ['classification' => 'internal', 'target_department_id' => $department->id]);
                $response->assertForbidden();
                $this->assertStringNotContainsString($record->subject, $response->getContent());
            }
        }

        $this->assertSame($initial['state'], $record->fresh()->lifecycle_state);
        $this->assertSame($initial['events'], DB::table('correspondence_events')->count());
        $this->assertSame($initial['outbox'], DB::table('outbox_messages')->count());
    }

    public function test_missing_or_unexpected_restricted_config_never_opens_mutations(): void
    {
        $middleware = app(DenyUnverifiedCorrespondenceMutations::class);
        foreach ([null, 'false', 0, true, 'open'] as $value) {
            config()->set('messaging_release.restricted_uat', $value);
            $called = false;
            try {
                $middleware->handle(\Illuminate\Http\Request::create('/correspondence/id/act', 'POST'),
                    function () use (&$called) {
                        $called = true;

                        return response('unsafe');
                    });
                $this->fail('Correspondence unexpectedly passed restriction gate');
            } catch (\Symfony\Component\HttpKernel\Exception\HttpException $exception) {
                $this->assertSame(403, $exception->getStatusCode());
                $this->assertFalse($called);
            }
        }
    }

    public function test_explicit_false_non_uat_mode_delegates_without_bypassing_domain_authorization(): void
    {
        config()->set('messaging_release.restricted_uat', false);
        $called = false;
        $response = app(DenyUnverifiedCorrespondenceMutations::class)->handle(
            \Illuminate\Http\Request::create('/correspondence/synthetic/act', 'POST'),
            function () use (&$called) {
                $called = true;

                return response('', 204);
            }
        );

        $this->assertTrue($called);
        $this->assertSame(204, $response->getStatusCode());
    }

}
