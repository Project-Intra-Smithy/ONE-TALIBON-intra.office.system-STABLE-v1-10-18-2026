<?php

namespace App\Domain\Workflow;

use App\Models\TransactionEvent;
use App\Models\WorkflowTransaction;
use Illuminate\Validation\ValidationException;

/**
 * Slot 03 candidate: technical invariants only. No municipal authority or SLA
 * is inferred. The shared workflow engine must call these checks under its
 * transaction row lock before enabling a mutation.
 */
final class ClarificationContract
{
    public const RESPONSE_ACTION = 'information_supplied';

    public function assertRequest(
        WorkflowTransaction $transaction,
        string $action,
        ?string $reason,
        int $expectedEventId,
        ?TransactionEvent $latestEvent,
    ): void {
        if (! in_array($action, ['request_information', 'return_origin'], true)) {
            $this->reject('action', 'Unsupported clarification action.');
        }

        if ($transaction->isTerminal() || ! in_array($transaction->status, ['submitted', 'for_review'], true)) {
            $this->reject('action', 'Clarification or return is not valid in the current state.');
        }

        if ((int) $transaction->current_department_id === (int) $transaction->origin_department_id) {
            $this->reject('action', 'An office cannot return or request information from itself.');
        }

        if (trim((string) $reason) === '') {
            $this->reject('remarks', 'Specify the missing information or correction required.');
        }

        if (mb_strlen((string) $reason) > 2000) {
            $this->reject('remarks', 'The clarification reason exceeds 2000 characters.');
        }

        $this->assertFreshEvent($expectedEventId, $latestEvent);
    }

    public function assertResponse(
        WorkflowTransaction $transaction,
        TransactionEvent $requestEvent,
        ?TransactionEvent $latestEvent,
        int $expectedEventId,
        ?string $responseText,
        ?string $evidenceDocumentVersion = null,
        bool $hasEvidence = false,
    ): void {
        if ($transaction->status !== 'information_requested'
            || (int) $transaction->current_department_id !== (int) $transaction->origin_department_id) {
            $this->reject('action', 'There is no information request awaiting an origin-office response.');
        }

        if ($requestEvent->action !== 'request_information'
            || (int) $requestEvent->transaction_id !== (int) $transaction->id
            || (int) $requestEvent->to_department_id !== (int) $transaction->origin_department_id
            || (int) $requestEvent->from_department_id === (int) $transaction->origin_department_id) {
            $this->reject('request_event_id', 'The referenced request is not a valid pending origin-office request.');
        }

        $this->assertFreshEvent($expectedEventId, $latestEvent);

        if ((int) $requestEvent->id !== $expectedEventId) {
            $this->reject('request_event_id', 'The request was superseded or already answered.');
        }

        if (trim((string) $responseText) === '') {
            $this->reject('response_text', 'Provide a substantive response to the requested information.');
        }

        if (mb_strlen((string) $responseText) > 2000) {
            $this->reject('response_text', 'The response exceeds 2000 characters.');
        }

        if ($hasEvidence && trim((string) $evidenceDocumentVersion) === '') {
            $this->reject('document_version', 'Identify the version of supplied documentary evidence.');
        }
    }

    private function assertFreshEvent(int $expectedEventId, ?TransactionEvent $latestEvent): void
    {
        if ($expectedEventId < 0 || $expectedEventId !== (int) ($latestEvent?->id ?? 0)) {
            $this->reject('expected_event_id', 'Workflow history changed. Reload before taking action.');
        }
    }

    private function reject(string $field, string $message): never
    {
        throw ValidationException::withMessages([$field => $message]);
    }
}
