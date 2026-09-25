<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

final class Bh1RuntimePerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_representative_authenticated_request_paths_emit_runtime_metrics(): void
    {
        $this->seed();

        $user = User::query()
            ->where('email', 'engineering@talibon.demo')
            ->firstOrFail();

        $this->actingAs($user);

        $this->measure('dashboard.first_html', '/dashboard', false);

        foreach ([
            'dashboard.inertia' => '/dashboard',
            'my_work.inertia' => '/transactions?view=all',
            'correspondence.inertia' => '/correspondence',
            'records.inertia' => '/records',
            'calendar.month.inertia' => '/calendar?view=month&date=2026-09-25',
            'calendar.week.inertia' => '/calendar?view=week&date=2026-09-25',
            'calendar.day.inertia' => '/calendar?view=day&date=2026-09-25',
            'messages.inertia' => '/messages',
        ] as $label => $url) {
            $this->measure($label, $url, true);
        }

        $this->measureJson('notifications.feed', '/notifications/feed');
    }

    private function measure(string $label, string $url, bool $inertia): void
    {
        $headers = $inertia
            ? [
                'X-Inertia' => 'true',
                'X-Requested-With' => 'XMLHttpRequest',
                'Accept' => 'text/html, application/xhtml+xml',
            ]
            : [];

        $this->capture($label, function () use ($url, $headers): TestResponse {
            return $this->withHeaders($headers)->get($url);
        });
    }

    private function measureJson(string $label, string $url): void
    {
        $this->capture($label, fn (): TestResponse => $this->getJson($url));
    }

    /** @param callable(): TestResponse $request */
    private function capture(string $label, callable $request): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $startedAt = hrtime(true);
        $response = $request();
        $elapsedMs = (hrtime(true) - $startedAt) / 1_000_000;

        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        DB::flushQueryLog();

        $response->assertOk();

        $queryTimeMs = array_reduce(
            $queries,
            fn (float $total, array $query): float => $total + (float) ($query['time'] ?? 0),
            0.0,
        );

        fwrite(STDOUT, 'BH1_METRIC '.json_encode([
            'label' => $label,
            'elapsed_ms' => round($elapsedMs, 2),
            'query_count' => count($queries),
            'query_time_ms' => round($queryTimeMs, 2),
            'payload_bytes' => strlen($response->getContent()),
            'status' => $response->getStatusCode(),
        ], JSON_THROW_ON_ERROR).PHP_EOL);
    }
}
