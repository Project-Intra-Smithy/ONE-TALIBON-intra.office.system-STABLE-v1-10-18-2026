<?php

namespace App\Services\CommonReferences;

/**
 * Explicit source namespaces; equal database IDs are not interchangeable.
 */
enum SourceKind: string
{
    case IndividualTask = 'individual_task';
    case WorkRequest = 'work_request';
}
