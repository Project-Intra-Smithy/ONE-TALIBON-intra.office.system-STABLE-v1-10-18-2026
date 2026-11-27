<?php

declare(strict_types=1);

namespace Tests\Feature\Planning;

use App\Models\PlatformNotification;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\PlatformNotificationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

final class NotificationRecipientEligibilityTest extends TestCase
{
    use RefreshDatabase;

    private function payload(string $event): array
    {
        return ['event_key' => $event, 'source_domain' => 'system', 'title' => 'Synthetic notification', 'message' => 'Synthetic test message'];
    }

    private function actor(): User
    {
        return User::query()->where('email', 'employee@talibon.demo')->firstOrFail();
    }

    public function test_generic_recipient_is_rechecked_for_current_account_employment_and_office(): void
    {
        $this->seed();
        $service = app(PlatformNotificationService::class);
        $claimed = $this->actor();
        $first = $service->notifyUser($claimed, $this->payload('synthetic-replay'));
        $this->assertNotNull($first);
        $this->assertSame($first->id, $service->notifyUser($claimed, $this->payload('synthetic-replay'))->id);
        $claimed->employee->update(['separation_date' => '2026-11-27']);
        $this->assertNull($service->notifyUser($claimed, $this->payload('synthetic-separated')));
        $claimed->employee->update(['separation_date' => null]);
        User::query()->whereKey($claimed->id)->update(['account_status' => 'suspended']);
        $this->assertNull($service->notifyUser($claimed, $this->payload('synthetic-suspended')));
        User::query()->whereKey($claimed->id)->update(['account_status' => 'active']);
        $claimed->employee->department->update(['is_active' => false]);
        $this->assertNull($service->notifyUser($claimed, $this->payload('synthetic-inactive-office')));
        $this->assertSame(1, PlatformNotification::count());
    }

    public function test_department_delivery_rejects_stale_office_and_stale_employee_binding(): void
    {
        $this->seed();
        $recipient = $this->actor();
        $office = $recipient->employee->department;
        $service = app(PlatformNotificationService::class);
        $office->newQuery()->whereKey($office->id)->update(['is_routable' => false]);
        $this->assertSame(0, $service->notifyDepartment($office, $this->payload('synthetic-closed-office')));
        $otherOffice = User::query()->where('email', 'budget@talibon.demo')->firstOrFail()->employee->department_id;
        $recipient->employee->update(['department_id' => $otherOffice]);
        $this->assertNull($service->notifyUser($recipient, $this->payload('synthetic-stale-office') + ['department_id' => $office->id]));
        $this->assertSame(0, PlatformNotification::count());
    }

    public function test_missing_or_denied_work_request_source_never_creates_a_content_notification(): void
    {
        $this->seed();
        $this->assertNull(app(PlatformNotificationService::class)->notifyUser($this->actor(),
            $this->payload('synthetic-missing-source') + ['source_type' => WorkflowTransaction::class, 'source_id' => 99999999]));
        $this->assertSame(0, PlatformNotification::count());
    }
}
