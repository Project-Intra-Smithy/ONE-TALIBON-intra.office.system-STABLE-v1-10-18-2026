<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AuthenticationAssurance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Inertia\Inertia;
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

        $this->assure($user);
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

    private function assure(User $user): void
    {
        $assurance = app(AuthenticationAssurance::class);
        if (! $assurance->requiresMfa($user)) {
            return;
        }

        $user->forceFill([
            'mfa_secret' => 'JBSWY3DPEHPK3PXP',
            'mfa_confirmed_at' => now(),
            'mfa_version' => max(1, (int) $user->mfa_version),
        ])->save();
        $user->refresh();

        $this->withSession([
            AuthenticationAssurance::SESSION_USER_KEY => $user->id,
            AuthenticationAssurance::SESSION_VERSION_KEY => $user->mfa_version,
            AuthenticationAssurance::SESSION_VERIFIED_AT_KEY => now()->getTimestamp(),
        ]);
    }

    private function measure(string $label, string $url, bool $inertia): void
    {
        $headers = $inertia
            ? [
                'X-Inertia' => 'true',
                'X-Inertia-Version' => (string) Inertia::getVersion(),
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

        if ($label === 'records.inertia') {
            $this->assertLessThanOrEqual(
                18,
                count($queries),
                'B1 requires records.inertia to execute 18 queries or fewer.',
            );
        }

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
