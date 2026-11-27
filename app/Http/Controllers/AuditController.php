<?php

namespace App\Http\Controllers;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\AuditLog;
use App\Models\Department;
use App\Models\Document;
use App\Models\TransactionEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CommonEvidence\AuthorizedArchiveSql;
use App\Services\TransactionVisibilityQuery;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\QueryException;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AuditController extends Controller
{
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()->isRole('system_admin', 'mayor_approver'), 403);

        $filters = $request->validate([
            'outcome' => ['nullable', Rule::in(['allowed', 'denied'])],
            'action' => ['nullable', 'string', 'max:100'],
            'department_id' => ['nullable', 'integer', 'exists:departments,id'],
        ]);

        $query = AuditLog::query()
            ->with([
                'actor:id,name',
                'actorDepartment:id,name,short_name',
            ]);

        if (! empty($filters['outcome'])) {
            $query->where('outcome', $filters['outcome']);
        }
        if (! empty($filters['action'])) {
            $query->where('action', 'like', '%'.$filters['action'].'%');
        }
        if (! empty($filters['department_id'])) {
            $query->where('actor_department_id', $filters['department_id']);
        }

        $events = $query->latest('created_at')->limit(250)->get();
        $references = $this->sourceReferences($request->user(), $events);

        return Inertia::render('Audit/Index', [
            'events' => $events->map(fn (AuditLog $event): array => [
                'id' => $event->id,
                'action' => $event->action,
                'outcome' => $event->outcome,
                'summary' => $event->summary,
                'created_at' => $event->created_at?->toISOString(),
                'source_reference' => $references[$event->entity_type][$event->entity_id] ?? null,
                'actor' => $event->actor ? ['name' => $event->actor->name] : null,
                'actor_department' => $event->actorDepartment ? [
                    'id' => $event->actorDepartment->id,
                    'name' => $event->actorDepartment->name,
                    'short_name' => $event->actorDepartment->short_name,
                ] : null,
            ]),
            'summary' => [
                'events24h' => AuditLog::query()->where('created_at', '>=', now()->subDay())->count(),
                'denied24h' => AuditLog::query()->where('outcome', 'denied')->where('created_at', '>=', now()->subDay())->count(),
                'events7d' => AuditLog::query()->where('created_at', '>=', now()->subDays(7))->count(),
                'distinctActors7d' => AuditLog::query()->whereNotNull('actor_user_id')->where('created_at', '>=', now()->subDays(7))->distinct('actor_user_id')->count('actor_user_id'),
            ],
            'filters' => [
                'outcome' => $filters['outcome'] ?? '',
                'action' => $filters['action'] ?? '',
                'department_id' => $filters['department_id'] ?? '',
            ],
            'departments' => Department::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'short_name']),
        ]);
    }

    /** Only the bounded audit page supplies IDs; source data never changes forensic filters or counts. */
    private function sourceReferences(User $actor, Collection $events): array
    {
        $transactionTypes = array_unique([WorkflowTransaction::class, (new WorkflowTransaction)->getMorphClass()]);
        $documentTypes = array_unique(['document', Document::class, (new Document)->getMorphClass()]);
        $ids = fn (array $types): array => $events
            ->whereIn('entity_type', $types)->pluck('entity_id')
            ->filter(fn ($id): bool => preg_match('/^[1-9][0-9]*$/D', (string) $id) === 1)
            ->unique()->values()->all();
        $transactionIds = $ids($transactionTypes);
        $documentIds = $ids($documentTypes);
        if ($transactionIds === [] && $documentIds === []) {
            return [];
        }

        try {
            $verified = VerifiedMunicipalActor::forProtectedSource($actor);
            $officeId = (int) $verified->user()->employee->department_id;
            // VIEW_ALL alone is insufficient for D0, including every document parent.
            $scope = app(TransactionVisibilityQuery::class)->scopeVisibleToVerifiedActor($verified)
                ->where(fn (Builder $query) => $query->where('origin_department_id', $officeId)
                    ->orWhere('current_department_id', $officeId));
            $transactions = (clone $scope)->whereIn('id', $transactionIds)->get(['id', 'reference_no']);
        } catch (AuthorizationException|QueryException) {
            return [];
        }

        $references = [];
        foreach ($transactions as $transaction) {
            foreach ($transactionTypes as $type) {
                $references[$type][$transaction->id] = [
                    'kind' => 'transaction',
                    'reference' => $transaction->reference_no,
                    'href' => route('transactions.show', ['transaction' => $transaction->id], false),
                ];
            }
        }

        if ($documentIds === []) {
            return $references;
        }
        try {
            $eligible = app(AuthorizedArchiveSql::class)->visibleDocumentPreviewEligibility($actor, $documentIds);
            $eligibleIds = array_keys(array_filter($eligible));
            if ($eligibleIds === [] || ! Schema::hasColumns('documents', ['custody_mode', 'custody_operation_id'])) {
                return $references;
            }
            $eventTypes = array_unique([TransactionEvent::class, (new TransactionEvent)->getMorphClass()]);
            $parentIds = (clone $scope)->select('id');
            $eventIds = TransactionEvent::query()->whereIn('transaction_id', clone $parentIds)->select('id');
            $documents = Document::query()->whereIn('id', $eligibleIds)
                // Other parent families and registry targets stay held in conservative D0.
                ->where(fn (Builder $query) => $query->whereNull('custody_mode')->orWhere('custody_mode', 'LEGACY_PATH'))
                ->whereNull('custody_operation_id')
                ->whereDoesntHave('links', fn (Builder $links) => $links->whereNot(
                    fn (Builder $allowed) => $allowed
                        ->where(fn (Builder $direct) => $direct->whereIn('linkable_type', $transactionTypes)
                            ->whereIn('linkable_id', clone $parentIds))
                        ->orWhere(fn (Builder $event) => $event->whereIn('linkable_type', $eventTypes)
                            ->whereIn('linkable_id', $eventIds)),
                ))->get(['id', 'public_id']);
            foreach ($documents as $document) {
                foreach ($documentTypes as $type) {
                    $references[$type][$document->id] = [
                        'kind' => 'document',
                        'reference' => $document->public_id,
                        'href' => route('documents.preview', ['document' => $document->public_id], false),
                    ];
                }
            }
        } catch (AuthorizationException|QueryException) {
            // Missing/partial archive schema cannot fall back to raw document metadata.
        }

        return $references;
    }
}
