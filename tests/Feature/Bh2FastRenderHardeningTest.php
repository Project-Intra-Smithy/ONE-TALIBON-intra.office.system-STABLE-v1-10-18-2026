<?php

namespace Tests\Feature;

use App\Models\User;
use App\Services\AuthenticationAssurance;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Testing\TestResponse;
use Inertia\Inertia;
use Tests\TestCase;

final class Bh2FastRenderHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_document_center_records_mode_does_not_resolve_attached_file_archive(): void
    {
        $this->engineeringUser();

        DB::flushQueryLog();
        DB::enableQueryLog();

        $response = $this->inertiaGet('/documents?mode=records');

        $queries = DB::getQueryLog();
        DB::disableQueryLog();
        DB::flushQueryLog();

        $response->assertOk();

        $archiveQueries = array_values(array_filter(
            $queries,
            static function (array $query): bool {
                $sql = strtolower((string) ($query['query'] ?? ''));

                return str_contains($sql, ' from "documents"')
                    || str_contains($sql, ' from documents')
                    || str_contains($sql, ' from "document_links"')
                    || str_contains($sql, ' from document_links');
            },
        ));

        $this->assertSame(
            [],
            $archiveQueries,
            'Records-mode Document Center must not execute attached-file archive queries.',
        );
    }

    public function test_representative_fast_render_paths_smoke_and_emit_metrics(): void
    {
        $this->engineeringUser();

        foreach ([
            'dashboard' => '/dashboard',
            'my_work' => '/transactions?view=overview',
            'correspondence' => '/correspondence',
            'documents.records' => '/documents?mode=records',
            'portal_search' => '/portal-search',
            'memoranda' => '/memoranda',
            'calendar' => '/calendar?view=month&date=2026-09-27',
            'meetings' => '/meetings',
            'messages' => '/messages',
        ] as $label => $url) {
            $this->measure($label, $url);
        }
    }

    private function engineeringUser(): User
    {
        $this->seed();

        $user = User::query()
            ->where('email', 'engineering@talibon.demo')
            ->firstOrFail();

        $this->assure($user);
        $this->actingAs($user);

        return $user;
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

    private function inertiaGet(string $url): TestResponse
    {
        return $this->withHeaders([
            'X-Inertia' => 'true',
            'X-Inertia-Version' => (string) Inertia::getVersion(),
            'X-Requested-With' => 'XMLHttpRequest',
            'Accept' => 'text/html, application/xhtml+xml',
        ])->get($url);
    }

    private function measure(string $label, string $url): void
    {
        DB::flushQueryLog();
        DB::enableQueryLog();

        $startedAt = hrtime(true);
        $response = $this->inertiaGet($url);
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

        fwrite(STDOUT, 'BH2_METRIC '.json_encode([
            'label' => $label,
            'elapsed_ms' => round($elapsedMs, 2),
            'query_count' => count($queries),
            'query_time_ms' => round($queryTimeMs, 2),
            'payload_bytes' => strlen($response->getContent()),
            'status' => $response->getStatusCode(),
        ], JSON_THROW_ON_ERROR).PHP_EOL);
    }
}
