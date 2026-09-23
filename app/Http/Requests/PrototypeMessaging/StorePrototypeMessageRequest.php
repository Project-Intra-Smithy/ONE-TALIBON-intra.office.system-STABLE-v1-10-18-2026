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
        if (is_string($this->input('body'))) {
            $this->merge(['body' => trim($this->input('body'))]);
        }
    }

    public function rules(): array
    {
        return [
            'channel' => ['required', 'string', Rule::in(PrototypeMessagingChannels::all())],
            'body' => ['required', 'string', 'max:2000'],
        ];
    }
}
