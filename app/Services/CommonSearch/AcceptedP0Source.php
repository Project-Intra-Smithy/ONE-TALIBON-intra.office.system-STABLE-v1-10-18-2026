<?php

namespace App\Services\CommonSearch;

/**
 * Closed P0 source allowlist. P1 Task, Work Request and P3 draft records are
 * deliberately absent until their own consumed-source contracts are accepted.
 */
enum AcceptedP0Source: string
{
    case Correspondence = 'correspondence';
    case TravelOrder = 'travel_order';
}
