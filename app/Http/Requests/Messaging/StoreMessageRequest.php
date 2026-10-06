<?php

namespace App\Http\Requests\Messaging;

use App\Messaging\MessagingChannels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StoreMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $body = $this->input('body');
        if (! is_string($body)) {
            return;
        }

        $trimmed = preg_replace('/^\s+|\s+$/u', '', $body);
        $this->merge(['body' => $trimmed ?? trim($body)]);
    }

    public function rules(): array
    {
        return [
            'channel' => ['required', 'string', Rule::in(MessagingChannels::all())],
            'body' => ['required', 'string', 'max:2000'],
        ];
    }
}
