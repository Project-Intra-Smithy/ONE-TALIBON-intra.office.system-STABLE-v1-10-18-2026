<?php

namespace App\Services\CommonReferences;

/**
 * Missing and denied references deliberately share Unavailable.
 */
enum ReferenceStatus: string
{
    case Available = 'available';
    case Unavailable = 'unavailable';
    case Unsupported = 'unsupported';
    case Invalid = 'invalid';
}
