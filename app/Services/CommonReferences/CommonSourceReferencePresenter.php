<?php

namespace App\Services\CommonReferences;

use InvalidArgumentException;

/**
 * Pure JSON-ready projection of already-authorized source resolutions.
 *
 * This presenter does not resolve sources, validate actors or grant access.
 * Callers must supply results from CommonSourceReferenceResolver; destination
 * routes must perform their own authorization again when navigated.
 */
final class CommonSourceReferencePresenter
{
    private const MAX_BULK_PRESENTATIONS = 50;

    /**
     * Missing and denied entries retain the resolver's indistinguishable
     * unavailable status. Their source kind, identity, title and URL remain
     * absent, including when the underlying record exists but is inaccessible.
     *
     * @return array{
     *     status: string,
     *     sourceKind: ?string,
     *     target: ?array{
     *         reference: string,
     *         id: int,
     *         title: string,
     *         url: string,
     *         destinationType: string
     *     }
     * }
     */
    public function present(ReferenceResolution $resolution): array
    {
        // Never serialize a target for invalid, unsupported or unavailable.
        // In the existing immutable resolution API, an available result
        // always includes a target; the null guard also fails closed.
        $target = $resolution->status === ReferenceStatus::Available
            ? $resolution->target
            : null;

        return [
            'status' => $resolution->status->value,
            'sourceKind' => $target?->kind->value,
            'target' => $target === null ? null : [
                'reference' => $target->reference(),
                'id' => $target->id,
                'title' => $target->title,
                'url' => $target->url,
                'destinationType' => $target->destinationType,
            ],
        ];
    }

    /**
     * Preserve the order, multiplicity and status of the existing bulk result.
     * This adapter cannot extend the upstream 50-reference batch contract.
     *
     * @param list<ReferenceResolution> $resolutions
     * @return list<array{
     *     status: string,
     *     sourceKind: ?string,
     *     target: ?array{
     *         reference: string,
     *         id: int,
     *         title: string,
     *         url: string,
     *         destinationType: string
     *     }
     * }>
     */
    public function presentMany(array $resolutions): array
    {
        if (count($resolutions) > self::MAX_BULK_PRESENTATIONS) {
            throw new InvalidArgumentException('A source-reference batch may contain at most 50 entries.');
        }

        $presented = [];

        foreach ($resolutions as $resolution) {
            $presented[] = $this->present($resolution);
        }

        return $presented;
    }
}
