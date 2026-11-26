<?php

declare(strict_types=1);

namespace App\Services;

use App\Domain\Custody\Exceptions\CustodyViolationException;
use App\Domain\Integration\IntegrationRequestAttributes;
use App\Models\AuditLog;
use App\Models\IntegrationClient;
use App\Models\User;
use Carbon\CarbonInterface;
use Illuminate\Database\ConnectionInterface;
use Illuminate\Support\Str;

class AuditLogger
{
    public function record(
        ?User $actor,
        string $action,
        string $summary,
        string $outcome = 'allowed',
        ?string $entityType = null,
        ?int $entityId = null,
        ?IntegrationClient $integrationClient = null,
    ): AuditLog {
        return AuditLog::query()->create([
            'actor_user_id' => $actor?->id,
            'integration_client_id' => $integrationClient?->id,
            'actor_department_id' => $actor?->employee?->department_id,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'outcome' => $outcome,
            'summary' => $summary,
            'ip_address' => request()?->ip(),
            'user_agent' => request()?->userAgent(),
            'correlation_id' => $this->correlationId(),
            'created_at' => now(),
        ]);
    }

    public function recordOnConnection(
        ConnectionInterface $connection,
        int $actorUserId,
        int $actorDepartmentId,
        string $action,
        string $summary,
        string $correlationId,
        string $entityType,
        int $entityId,
        string $outcome = 'allowed',
        ?string $custodyOperationId = null,
        ?string $ipAddress = null,
        ?string $userAgent = null,
        ?CarbonInterface $createdAt = null,
    ): int {
        if ($actorUserId <= 0 || $actorDepartmentId <= 0 || $entityId <= 0) {
            throw new CustodyViolationException('Connection-pinned audit entries require positive actor, office, and entity IDs.');
        }

        if (! Str::isUuid($correlationId)) {
            throw new CustodyViolationException('Connection-pinned audit entries require a valid UUID correlation_id.');
        }

        if ($custodyOperationId !== null && ! Str::isUuid($custodyOperationId)) {
            throw new CustodyViolationException('Marked custody audit entries require a valid UUID custody_operation_id.');
        }

        return (int) $connection->table('audit_logs')->insertGetId([
            'actor_user_id' => $actorUserId,
            'integration_client_id' => null,
            'actor_department_id' => $actorDepartmentId,
            'action' => $action,
            'entity_type' => $entityType,
            'entity_id' => $entityId,
            'outcome' => $outcome,
            'summary' => $summary,
            'ip_address' => $ipAddress ?? request()?->ip(),
            'user_agent' => $userAgent ?? request()?->userAgent(),
            'correlation_id' => $correlationId,
            'created_at' => ($createdAt ?? now())->format('Y-m-d H:i:sP'),
            'custody_operation_id' => $custodyOperationId,
        ]);
    }

    public function recordAnonymous(
        string $action,
        string $summary,
        string $outcome = 'denied',
        ?string $entityType = null,
    ): AuditLog {
        return $this->record(null, $action, $summary, $outcome, $entityType);
    }

    public function recordIntegration(
        ?IntegrationClient $client,
        string $action,
        string $summary,
        string $outcome = 'allowed',
        ?string $entityType = null,
        ?int $entityId = null,
    ): AuditLog {
        return $this->record(
            null,
            $action,
            $summary,
            $outcome,
            $entityType,
            $entityId,
            $client,
        );
    }

    private function correlationId(): string
    {
        $current = request()?->attributes->get(IntegrationRequestAttributes::CORRELATION_ID);

        return is_string($current) && Str::isUuid($current)
            ? $current
            : (string) Str::uuid();
    }
}
