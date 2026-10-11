<?php

namespace App\Services\CommonWork;

/** Projection identities, not interchangeable domain models. */
enum CommonWorkSource: string
{
    case IndividualTask = 'individual_task';
    case WorkRequest = 'work_request';
}
