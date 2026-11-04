<?php

namespace App\Services;

use App\Domain\Identity\VerifiedMunicipalActor;
use App\Models\CorrespondenceEvent;
use App\Models\CorrespondenceRecord;
use App\Models\Document;
use App\Models\DocumentLink;
use App\Models\TransactionEvent;
use App\Models\TravelOrder;
use App\Models\TravelOrderEvent;
use App\Models\User;
use App\Models\WorkflowTransaction;
use App\Services\CommonEvidence\CorrespondenceEvidenceScope;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\Relation;

final class DocumentAccessService
{
    public function __construct(
        private readonly CorrespondenceEvidenceScope $correspondenceScope,
        private readonly TravelOrderAccess $travelOrderAccess,
        private readonly TransactionVisibilityQuery $transactionVisibility,
    ) {}

    public function canDownload(User $actor, Document $document): bool
    {
        // Fresh proof for this download only; never reuse archive-page authority.
        try {
            $verified = VerifiedMunicipalActor::forProtectedSource($actor);
        } catch (AuthorizationException) {
            return false;
        }

        if (PlanDocumentOriginGuard::isProtected($document)) {
            return false;
        }

        if ($document->storage_disk !== (string) config('documents.disk', 'documents')
            || ! $document->storage_path) {
            return false;
        }

        // Collect all parent IDs in a single query. Never truncate by link
        // position. Each family performs at most one scoped existence query,
        // not a query per document link.
        $families = [
            'correspondence' => ['direct' => [], 'events' => []],
            'travel_order' => ['direct' => [], 'events' => []],
            'transaction' => ['direct' => [], 'events' => []],
        ];
        $links = DocumentLink::query()->where('document_id', $document->getKey())
            ->get(['linkable_type', 'linkable_id']);

        foreach ($links as $link) {
            $model = Relation::getMorphedModel($link->linkable_type) ?? $link->linkable_type;
            $id = (int) $link->linkable_id;
            switch ($model) {
                case CorrespondenceRecord::class:
                    $families['correspondence']['direct'][] = $id;
                    break;
                case CorrespondenceEvent::class:
                    $families['correspondence']['events'][] = $id;
                    break;
                case TravelOrder::class:
                    $families['travel_order']['direct'][] = $id;
                    break;
                case TravelOrderEvent::class:
                    $families['travel_order']['events'][] = $id;
                    break;
                case WorkflowTransaction::class:
                    $families['transaction']['direct'][] = $id;
                    break;
                case TransactionEvent::class:
                    $families['transaction']['events'][] = $id;
                    break;
            }
        }

        foreach (['correspondence', 'travel_order', 'transaction'] as $family) {
            $ids = $families[$family];
            if ($ids['direct'] === [] && $ids['events'] === []) {
                continue;
            }

            $scope = match ($family) {
                'correspondence' => $this->correspondenceScope->visibleToVerifiedActor($verified),
                'travel_order' => $this->travelOrderAccess
                    ->scopeVisibleToVerifiedActor(TravelOrder::query(), $verified),
                'transaction' => $this->transactionVisibility->scopeVisibleToVerifiedActor($verified),
            };
            [$eventClass, $eventParent] = match ($family) {
                'correspondence' => [CorrespondenceEvent::class, 'correspondence_record_id'],
                'travel_order' => [TravelOrderEvent::class, 'travel_order_id'],
                'transaction' => [TransactionEvent::class, 'transaction_id'],
            };

            // A family with any link controls precedence, including orphan
            // links. A denied family cannot fall through to a lower family.
            return $this->anyAuthorizedParent(
                $scope, $ids['direct'], $ids['events'], $eventClass, $eventParent,
            );
        }

        return false;
    }

    /**
     * @param list<int> $direct
     * @param list<int> $events
     * @param class-string $eventClass
     */
    private function anyAuthorizedParent(
        Builder $scope,
        array $direct,
        array $events,
        string $eventClass,
        string $eventParent,
    ): bool {
        return $scope->where(function (Builder $parents) use ($direct, $events, $eventClass, $eventParent): void {
            if ($direct !== []) {
                $parents->whereIn('id', array_values(array_unique($direct)));
            }

            if ($events !== []) {
                $eventParents = $eventClass::query()
                    ->whereIn('id', array_values(array_unique($events)))
                    ->select($eventParent);
                if ($direct !== []) {
                    $parents->orWhereIn('id', $eventParents);
                } else {
                    $parents->whereIn('id', $eventParents);
                }
            }
        })->exists();
    }
}
