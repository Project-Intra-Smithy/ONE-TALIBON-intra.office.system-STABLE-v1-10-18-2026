<?php

namespace App\Services\CommonSearch;

use App\Models\CorrespondenceRecord;
use App\Models\TravelOrder;
use App\Models\User;
use App\Services\CorrespondenceAccessDecider;
use App\Services\TravelOrderAccess;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Internal, route-free P4 draft for two established P0 record families.
 *
 * A source-scoped query is evaluated before union, pagination, counts and
 * projection. No Task/Work Request, shared search endpoint or global index.
 * Every detail URL is a navigation hint; the destination authorizes again.
 */
final readonly class AuthorizedSourceSearch
{
    private CorrespondenceAccessDecider $correspondenceAccess;

    private TravelOrderAccess $travelOrderAccess;

    public function __construct(
        CorrespondenceAccessDecider $correspondenceAccess,
        TravelOrderAccess $travelOrderAccess,
    ) {
        $this->correspondenceAccess = $correspondenceAccess;
        $this->travelOrderAccess = $travelOrderAccess;
    }

    /**
     * @return array{data:list<array<string, string|null>>, meta:array{page:int,per_page:int,total:int,last_page:int,has_more:bool}}
     */
    public function search(
        User $claimedActor,
        string $query,
        int $page = 1,
        int $perPage = 20,
        ?string $source = null,
    ): array {
        $actor = $this->currentActor($claimedActor);

        if ($page < 1 || $page > 10000 || $perPage < 1 || $perPage > 50) {
            throw new InvalidArgumentException('Common Search pagination is outside allowed bounds.');
        }

        $kind = $source === null ? null : AcceptedP0Source::tryFrom($source);
        if ($source !== null && $kind === null) {
            throw new InvalidArgumentException('Source is not in the accepted P0 registry.');
        }

        $term = Str::lower(trim($query));
        if (Str::length($term) > 120) {
            throw new InvalidArgumentException('Common Search term exceeds 120 characters.');
        }

        // An empty search does not enumerate municipal records or totals.
        if ($term === '') {
            return $this->response([], $page, $perPage, 0, 0);
        }

        $sources = [];
        if ($kind === null || $kind === AcceptedP0Source::Correspondence) {
            $sources[] = $this->correspondence($actor, $term);
        }
        if ($kind === null || $kind === AcceptedP0Source::TravelOrder) {
            $sources[] = $this->travelOrders($actor, $term);
        }

        $union = array_shift($sources);
        foreach ($sources as $next) {
            $union->unionAll($next);
        }

        // Native SQL pagination: no hydrate-all filtering, N+1 detail loads or
        // totals from records that failed their original source read scope.
        $paginator = DB::query()
            ->fromSub($union->toBase(), 'authorized_search')
            ->orderByDesc('changed_at')
            ->orderBy('source_kind')
            ->orderByDesc('source_id')
            ->paginate($perPage, ['*'], 'page', $page);

        $items = collect($paginator->items())->map(function (object $row): array {
            $kind = AcceptedP0Source::from((string) $row->source_kind);
            $publicId = (string) $row->public_id;

            return [
                'key' => $kind->value.':'.$publicId,
                'source' => $kind->value,
                'title' => (string) $row->title,
                'reference' => $row->reference !== null ? (string) $row->reference : null,
                'url' => $kind === AcceptedP0Source::Correspondence
                    ? route('correspondence.workspace.show', ['correspondence' => $publicId], false)
                    : route('travel-orders.show', ['travelOrder' => $publicId], false),
                'updated_at' => $row->changed_at === null
                    ? null
                    : CarbonImmutable::parse($row->changed_at)->toIso8601String(),
            ];
        })->all();

        return $this->response(
            array_values($items), $page, $perPage, $paginator->total(), $paginator->lastPage(),
        );
    }

    private function currentActor(User $claimed): User
    {
        // Only an authenticated, fresh municipal employee may consume this
        // internal search. No model-relation cache or caller-supplied role grant.
        if ($claimed->getKey() === null || (int) Auth::id() !== (int) $claimed->getKey()) {
            throw new AuthorizationException('Common Search requires the current session actor.');
        }

        $actor = User::query()->with('employee.department')->find($claimed->getKey());
        if ($actor === null || $actor->is_active === false
            || $actor->employee === null || $actor->employee->employment_status !== 'active'
            || $actor->employee->department === null || $actor->employee->department->is_active === false) {
            throw new AuthorizationException('Common Search municipal access is revoked.');
        }

        return $actor;
    }

    private function correspondence(User $actor, string $term): Builder
    {
        $scope = $this->correspondenceAccess
            ->scopeVisibleTo(CorrespondenceRecord::query(), $actor);

        $this->literalMatch($scope, $term, ['subject', 'municipal_reference_no', 'external_reference_no']);

        return $scope->selectRaw(
            '\'correspondence\' AS source_kind, id AS source_id, CAST(public_id AS TEXT) AS public_id, '
            .'subject AS title, COALESCE(municipal_reference_no, external_reference_no) AS reference, updated_at AS changed_at'
        );
    }

    private function travelOrders(User $actor, string $term): Builder
    {
        $scope = $this->travelOrderAccess
            ->scopeVisibleTo(TravelOrder::query(), $actor);

        $this->literalMatch($scope, $term, ['purpose', 'reference_number']);

        return $scope->selectRaw(
            '\'travel_order\' AS source_kind, id AS source_id, CAST(public_id AS TEXT) AS public_id, '
            .'purpose AS title, reference_number AS reference, updated_at AS changed_at'
        );
    }

    /** @param list<string> $columns Fixed server-owned names, never user input. */
    private function literalMatch(Builder $query, string $term, array $columns): void
    {
        $query->where(function (Builder $match) use ($columns, $term): void {
            foreach ($columns as $column) {
                // PostgreSQL POSITION treats %, _, backslashes and quotes as
                // literal text. All user bytes are parameters, not SQL syntax.
                $match->orWhereRaw(
                    sprintf('POSITION(? IN LOWER(COALESCE(%s, \'\'))) > 0', $column),
                    [$term],
                );
            }
        });
    }

    /** @param list<array<string, string|null>> $data */
    private function response(array $data, int $page, int $perPage, int $total, int $lastPage): array
    {
        return [
            'data' => $data,
            'meta' => [
                'page' => $page,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
                'has_more' => $page < $lastPage,
            ],
        ];
    }
}
