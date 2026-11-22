<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\Reports\TransactionOperationalReportQuery;
use App\Services\TransactionWorkflowService;
use Illuminate\Support\Facades\DB;
use PHPUnit\Framework\Attributes\Group;
use RuntimeException;
use Tests\TestCase;

#[Group('ops009-c01')]
final class OPS009C01SimultaneousCloseTest extends TestCase
{
    public function test_two_real_postgresql_processes_race_and_only_one_closes(): void
    {
        $this->guard();
        $this->seed();
        $origin = User::query()->where('email', 'engineering@talibon.demo')->firstOrFail();
        $head = User::query()->where('email', 'planning@talibon.demo')->firstOrFail();
        $workflow = app(TransactionWorkflowService::class);
        $tx = $workflow->create($origin, [
            'transaction_type' => 'internal_request',
            'title' => 'OPS009 synthetic concurrency test',
            'priority' => 'normal',
            'target_department_id' => $head->employee->department_id,
            'action_required' => 'For Information',
        ]);
        $tx = $workflow->transition($head, $tx, 'mark_review');
        $id = (int) $tx->id;
        $baseline = [
            'events' => DB::table('transaction_events')->where('transaction_id', $id)->count(),
            'audit' => DB::table('audit_logs')->where('entity_id', $id)->where('action', 'transaction.close')->count(),
            'links' => DB::table('document_links')->count(),
            'documents' => DB::table('documents')->count(),
        ];

        $dir = sys_get_temp_dir().'/ops009-c01-'.bin2hex(random_bytes(8));
        if (! mkdir($dir, 0700) && ! is_dir($dir)) {
            throw new RuntimeException('Cannot allocate isolated race barrier directory.');
        }
        $procs = [];
        $overlap = null;
        try {
            $procs['A'] = $this->startWorker('A', $id, (int) $head->id, $dir);
            $this->waitFor($dir.'/A.locked', 18);
            $procs['B'] = $this->startWorker('B', $id, (int) $head->id, $dir);
            $this->waitFor($dir.'/B.ready', 18);
            $a = json_decode((string) file_get_contents($dir.'/A.ready'), true, 512, JSON_THROW_ON_ERROR);
            $b = json_decode((string) file_get_contents($dir.'/B.ready'), true, 512, JSON_THROW_ON_ERROR);
            $this->assertNotSame($a['backend_pid'], $b['backend_pid'], 'Must use distinct real PostgreSQL sessions');
            $this->assertSame('talibon_portal_test', $a['database']);
            $this->assertSame('talibon_portal_test', $b['database']);

            $deadline = microtime(true) + 18;
            while (microtime(true) < $deadline) {
                $row = DB::selectOne(
                    'SELECT state, wait_event_type, wait_event, pg_blocking_pids(pid)::text AS blockers FROM pg_stat_activity WHERE pid = ?',
                    [(int) $b['backend_pid']],
                );
                if ($row !== null && str_contains((string) $row->blockers, (string) $a['backend_pid'])
                    && $row->wait_event_type === 'Lock') {
                    $overlap = [
                        'worker_a_pid' => $a['backend_pid'],
                        'worker_b_pid' => $b['backend_pid'],
                        'worker_a_initial_txid' => $a['transaction_id'],
                        'worker_b_initial_txid' => $b['transaction_id'],
                        'b_wait_event' => $row->wait_event,
                        'b_blocked_by_a' => true,
                    ];
                    break;
                }
                usleep(30000);
            }
        } finally {
            // Releasing A is mandatory even if the lock observation fails.
            file_put_contents($dir.'/A.release', 'release');
            foreach ($procs as $process) {
                $this->waitProcess($process, 18);
            }
        }

        try {
            $this->assertNotNull($overlap, 'No observed B PostgreSQL lock wait blocked by A; NOT a proven race');
            $aResult = json_decode((string) file_get_contents($dir.'/A.result.json'), true, 512, JSON_THROW_ON_ERROR);
            $bResult = json_decode((string) file_get_contents($dir.'/B.result.json'), true, 512, JSON_THROW_ON_ERROR);
            $this->assertTrue($aResult['success'], 'First close must succeed');
            $this->assertFalse($bResult['success'], 'Competing close must be rejected');
            $this->assertContains($bResult['exception'], [
                \Illuminate\Auth\Access\AuthorizationException::class,
                \Illuminate\Validation\ValidationException::class,
            ]);
            $tx->refresh();
            $this->assertSame('closed', $tx->status);
            $this->assertNotNull($tx->completed_at);
            $event = $tx->events()->where('action', 'close')->sole();
            $this->assertSame($head->id, $event->actor_user_id);
            $this->assertSame('for_review', $event->previous_status);
            $this->assertSame('closed', $event->new_status);
            $this->assertSame(1, DB::table('transaction_events')->where('transaction_id', $id)->where('action', 'close')->count());
            $this->assertSame($baseline['events'] + 1, DB::table('transaction_events')->where('transaction_id', $id)->count());
            $this->assertSame(1, DB::table('audit_logs')->where('entity_type', WorkflowTransaction::class)->where('entity_id', $id)->where('action', 'transaction.close')->count());
            $this->assertSame(1, DB::table('platform_notifications')->where('event_key', 'transaction-event-'.$event->id)->where('user_id', $origin->id)->count());
            $notices = DB::table('platform_notifications')->where('event_key', 'transaction-event-'.$event->id)->get();
            $this->assertCount($notices->count(), $notices->pluck('user_id')->unique());
            foreach ($notices as $notice) {
                $this->assertSame('transaction', $notice->source_domain);
                $this->assertSame($id, (int) $notice->source_id);
                $this->assertStringNotContainsString('Synthetic completed under concurrent load', $notice->message);
            }
            $reports = app(TransactionOperationalReportQuery::class);
            $this->assertSame(1, $reports->rows('completed-work', $origin, [], false)->filter(fn (array $r) => $r['reference'] === $tx->reference_no)->count());
            $this->assertSame(0, $reports->rows('transaction-aging', $origin, [], false)->filter(fn (array $r) => $r['reference'] === $tx->reference_no)->count());
            $this->assertSame(0, $reports->rows('overdue-action-required', $origin, [], false)->filter(fn (array $r) => $r['reference'] === $tx->reference_no)->count());
            $this->assertSame($baseline['documents'], DB::table('documents')->count());
            $this->assertSame($baseline['links'], DB::table('document_links')->count());
            $this->assertSame($baseline['audit'] + 1, DB::table('audit_logs')->where('entity_id', $id)->where('action', 'transaction.close')->count());
            $this->assertFalse($head->can('close', $tx));
            fwrite(STDOUT, 'OPS009_C01_EVIDENCE='.json_encode($overlap + [
                'close_events' => 1, 'close_audit' => 1,
                'origin_notice' => 1, 'completed_rows' => 1,
                'winner' => 'A', 'loser_exception' => $bResult['exception'],
            ], JSON_THROW_ON_ERROR)."\n");
        } finally {
            foreach (glob($dir.'/*') ?: [] as $file) {
                unlink($file);
            }
            rmdir($dir);
        }
    }

    private function guard(): void
    {
        $this->assertSame('testing', app()->environment());
        $this->assertSame('1', getenv('OPS009_DISPOSABLE_CI'));
        $this->assertSame('talibon_portal_test', DB::connection()->getDatabaseName());
        $this->assertSame('postgres', DB::selectOne('SELECT session_user AS name')->name);
        $this->assertSame('16', substr((string) DB::selectOne("SELECT current_setting('server_version_num') AS v")->v, 0, 2));
    }

    private function startWorker(string $mode, int $txId, int $userId, string $dir): mixed
    {
        $command = [PHP_BINARY, base_path('tests/Manual/ops009-c01-worker.php'), $mode, (string) $txId, (string) $userId, $dir];
        $process = proc_open($command, [
            0 => ['pipe', 'r'], 1 => ['file', $dir.'/'.$mode.'.stdout', 'w'],
            2 => ['file', $dir.'/'.$mode.'.stderr', 'w'],
        ], $pipes, base_path(), null, ['bypass_shell' => true]);
        if (! is_resource($process)) {
            throw new RuntimeException('Unable to start second real PHP/PostgreSQL worker');
        }
        fclose($pipes[0]);
        return $process;
    }

    private function waitFor(string $path, int $seconds): void
    {
        $until = microtime(true) + $seconds;
        while (! file_exists($path) && microtime(true) < $until) {
            usleep(30000);
        }
        $this->assertFileExists($path, 'Timed out waiting for barrier '.$path);
    }

    private function waitProcess(mixed $process, int $seconds): void
    {
        $until = microtime(true) + $seconds;
        while (microtime(true) < $until) {
            $status = proc_get_status($process);
            if (! $status['running']) {
                proc_close($process);
                return;
            }
            usleep(50000);
        }
        proc_terminate($process, 9);
        proc_close($process);
        throw new RuntimeException('Race worker timed out; aborted');
    }
}
