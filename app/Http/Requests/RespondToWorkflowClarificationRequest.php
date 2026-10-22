<?php

namespace App\Http\Requests;

use App\Services\CoreEvidenceRules;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Unmounted candidate payload for a future municipally authorized response.
 * No controller may use this to enable writes until policy and event linkage
 * are implemented; authorize() intentionally fails closed.
 */
final class RespondToWorkflowClarificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return false;
    }

    protected function prepareForValidation(): void
    {
        $text = $this->input('response_text');
        $version = $this->input('document_version');

        $this->merge([
            'response_text' => is_string($text) ? trim($text) : $text,
            'document_version' => is_string($version) ? trim($version) : $version,
        ]);
    }

    public function rules(): array
    {
        return [
            'request_event_id' => ['required', 'integer', 'min:1'],
            'expected_event_id' => ['required', 'integer', 'min:1'],
            'response_text' => ['required', 'string', 'max:2000'],
            'document_version' => ['nullable', 'string', 'max:128'],
            ...CoreEvidenceRules::rules(),
        ];
    }
}
