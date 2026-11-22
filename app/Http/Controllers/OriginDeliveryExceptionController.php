<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\AuditLogger;
use Illuminate\Database\QueryException;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Office-head-only operational exception queue. The original exception and
 * subsequent follow-up actions are append-only records, never edited in place.
 * It is a synthetic software role contract, not an LGU appointment.
 */
final class OriginDeliveryExceptionController
{
    public function __construct(private readonly AuditLogger $audit) {}

    public function index(Request $request): Response
    {
        $officeId = $this->originHeadOfficeId($request);
        $this->assertLedgerInstalled();

        $user = $request->user();
        $rows = DB::table('ops009_origin_delivery_exceptions as gap')
            ->join('transactions as tx', 'tx.id', '=', 'gap.transaction_id')
            ->where('gap.origin_department_id', $officeId)
            ->orderByDesc('gap.id')
            ->limit(100)
            ->get([
                'gap.id', 'gap.transaction_id', 'gap.transaction_event_id',
                'gap.reason', 'gap.created_at', 'tx.reference_no',
            ]);

        $visible = $rows->filter(static function (object $row) use ($user): bool {
            $source = WorkflowTransaction::query()->find((int) $row->transaction_id);

            return $source !== null && $user->can('view', $source);
        });
        $actions = DB::table('ops009_origin_delivery_exception_actions')
            ->whereIn('exception_id', $visible->pluck('id')->all())
            ->get(['exception_id', 'action', 'created_at'])
            ->groupBy('exception_id');

        return Inertia::render('Transactions/DeliveryExceptions', [
            'exceptions' => $visible->values()->map(static function (object $row) use ($actions): array {
                $events = $actions->get($row->id, collect());

                return [
                    'id' => (int) $row->id,
                    'transactionId' => (int) $row->transaction_id,
                    'eventId' => (int) $row->transaction_event_id,
                    'reference' => (string) $row->reference_no,
                    'reason' => (string) $row->reason,
                    'createdAt' => (string) $row->created_at,
                    'acknowledged' => $events->contains('action', 'acknowledge'),
                    'resolved' => $events->contains('action', 'resolve'),
                ];
            })->all(),
        ]);
    }

    public function act(Request $request, int $exception): RedirectResponse
    {
        $officeId = $this->originHeadOfficeId($request);
        $this->assertLedgerInstalled();

        $validated = $request->validate([
            'action' => ['required', Rule::in(['acknowledge', 'resolve'])],
            'note' => ['required', 'string', 'min:1', 'max:2000'],
        ]);

        $user = $request->user();
        $gap = DB::table('ops009_origin_delivery_exceptions')
            ->where('id', $exception)
            ->where('origin_department_id', $officeId)
            ->first(['id', 'transaction_id']);
        abort_if($gap === null, 404);

        $source = WorkflowTransaction::query()->findOrFail((int) $gap->transaction_id);
        abort_unless($user->can('view', $source), 403);

        try {
            DB::transaction(function () use ($exception, $officeId, $validated, $user): void {
                // Unique(exception_id,action) and the insert trigger enforce
                // idempotency, role eligibility and acknowledgment-before-resolve.
                DB::table('ops009_origin_delivery_exception_actions')->insert([
                    'exception_id' => $exception,
                    'actor_user_id' => (int) $user->id,
                    'actor_department_id' => $officeId,
                    'action' => $validated['action'],
                    'note' => trim($validated['note']),
                ]);

                $this->audit->record(
                    $user,
                    'ops009.delivery_gap.'.$validated['action'],
                    'Recorded office-head follow-up for origin delivery exception #'.$exception.'.',
                    'allowed',
                    'ops009_origin_delivery_exception',
                    $exception,
                );
            });
        } catch (QueryException $error) {
            throw ValidationException::withMessages([
                'action' => 'The exception action was rejected or already recorded.',
            ]);
        }

        return back()->with('success', 'Exception follow-up recorded in the audit trail.');
    }

    private function assertLedgerInstalled(): void
    {
        // The approved R2 disposable migration is not installed on legacy PR55
        // persistent Devtest. The route remains absent there by default.
        abort_unless(
            Schema::hasTable('ops009_origin_delivery_exceptions')
                && Schema::hasTable('ops009_origin_delivery_exception_actions'),
            404,
        );
    }

    private function originHeadOfficeId(Request $request): int
    {
        $actor = $request->user();
        abort_if(! $actor instanceof User, 403);

        // Re-evaluate account, role, employment and office directly on every
        // call, not from a cached session, UI card or provisional office seed.
        $head = DB::table('users as usr')
            ->join('employees as emp', 'emp.user_id', '=', 'usr.id')
            ->join('departments as dep', 'dep.id', '=', 'emp.department_id')
            ->where('usr.id', (int) $actor->id)
            ->where('usr.role', 'department_head')
            ->where('usr.is_active', true)
            ->where('usr.account_status', 'active')
            ->whereNull('usr.suspended_at')
            ->where('emp.employment_status', 'active')
            ->whereNull('emp.separation_date')
            ->where('dep.is_active', true)
            ->where('dep.is_routable', true)
            ->select('emp.department_id')
            ->first();

        abort_unless($head !== null, 403);

        return (int) $head->department_id;
    }
}
