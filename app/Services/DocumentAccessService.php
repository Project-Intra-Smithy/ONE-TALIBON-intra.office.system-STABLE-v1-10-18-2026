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

        // Collect all links without truncation. All recognized source parents
        // must authorize download; one visible sibling cannot overrule a
        // restricted or deleted linked source. The queries are bounded by
        // source family, not by the number of document links.
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
                default:
                    // Unknown source semantics cannot establish safe custody.
                    return false;
            }
        }

        $hasRecognizedParent = false;
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

            $hasRecognizedParent = true;

            // Every present family and every linked parent must grant access.
            // Never fall through from a denied, deleted, or orphaned source.
            if (! $this->allAuthorizedParents(
                $scope, $ids['direct'], $ids['events'], $eventClass, $eventParent,
            )) {
                return false;
            }
        }

        return $hasRecognizedParent;
    }

    /**
     * @param  list<int>  $direct
     * @param  list<int>  $events
     * @param  class-string  $eventClass
     */
    private function allAuthorizedParents(
        Builder $scope,
        array $direct,
        array $events,
        string $eventClass,
        string $eventParent,
    ): bool {
        $parentIds = array_values(array_unique($direct));
        $eventIds = array_values(array_unique($events));

        if ($eventIds !== []) {
            // Missing/orphaned event links deny; a deleted event must not
            // silently remove a parent from the authorization requirement.
            $eventParents = $eventClass::query()
                ->whereIn('id', $eventIds)
                ->pluck($eventParent);
            if ($eventParents->count() !== count($eventIds)
                || $eventParents->contains(null)) {
                return false;
            }

            $parentIds = array_values(array_unique(array_merge(
                $parentIds,
                $eventParents->map(fn ($id): int => (int) $id)->all(),
            )));
        }

        // Distinct prevents duplicate links or joined policy scopes from
        // inflating the number of authorized parents.
        return $parentIds !== []
            && $scope->whereIn('id', $parentIds)->distinct()->count('id') === count($parentIds);
    }
}
