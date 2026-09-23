<?php

namespace App\Http\Requests\PrototypeMessaging;

use App\Prototype\Messaging\PrototypeMessagingChannels;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class StorePrototypeMessageRequest extends FormRequest
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
            'channel' => ['required', 'string', Rule::in(PrototypeMessagingChannels::all())],
            'body' => ['required', 'string', 'max:2000'],
        ];
    }
}
