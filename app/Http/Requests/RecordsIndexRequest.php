<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

final class RecordsIndexRequest extends FormRequest
{
    public const RECORD_TYPES = [
        'all',
        'correspondence',
        'transaction',
        'travel_order',
    ];

    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'view' => ['nullable', Rule::in(['overview', 'register'])],
            'mode' => ['nullable', Rule::in(['files', 'records'])],
            'archive_scope' => ['nullable', Rule::in(['all', 'my_sent', 'my_received', 'my_uploads'])],
            'archive_search' => ['nullable', 'string', 'max:160'],
            'document_type' => ['nullable', 'string', 'max:80'],
            'classification' => ['nullable', 'string', 'max:80'],
            'archive_office_id' => ['nullable', 'integer', 'exists:departments,id'],
            'archive_year' => ['nullable', 'digits:4'],
            'document' => ['nullable', 'uuid'],
            'search' => ['nullable', 'string', 'max:160'],
            'record_type' => ['nullable', Rule::in(self::RECORD_TYPES)],
            'state' => ['nullable', 'string', 'max:80'],
            'office_id' => ['nullable', 'integer', 'exists:departments,id'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'page' => ['nullable', 'integer', 'min:1'],
        ];
    }
}
