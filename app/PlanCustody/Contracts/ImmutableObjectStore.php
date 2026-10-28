<?php

namespace App\PlanCustody\Contracts;

interface ImmutableObjectStore
{
    /** @param resource $stream */
    public function putIfAbsent(string $locator, $stream): void;

    /** @return resource */
    public function openForVerification(string $locator);

    /** Only permitted before the generation ledger transaction commits. */
    public function deleteUncommitted(string $locator): void;

    public function exists(string $locator): bool;
}
