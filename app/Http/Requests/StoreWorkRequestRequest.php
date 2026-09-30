<?php

namespace App\Http\Requests;

use App\Models\Employee;
use App\Models\WorkflowTransaction;
use App\Services\CoreEvidenceRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreWorkRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('create', WorkflowTransaction::class);
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'transaction_type' => $this->filled('transaction_type')
                ? trim((string) $this->input('transaction_type'))
                : 'internal_request',
            'request_category' => $this->nullableTrimmed('request_category'),
            'request_type' => $this->nullableTrimmed('request_type'),
            'action_required' => $this->nullableTrimmed('action_required'),
            'title' => $this->nullableTrimmed('title'),
            'description' => $this->nullableTrimmed('description'),
            'remarks' => $this->nullableTrimmed('remarks'),
        ]);
    }

    public function rules(): array
    {
        $categories = config('work_requests.categories', []);
        $actions = config('work_requests.actions', []);

        return [
            'transaction_type' => ['required', Rule::in(['internal_request', 'project_endorsement', 'document_review', 'funding_request', 'other'])],
            'request_category' => ['nullable', 'string', Rule::in(array_keys($categories))],
            'request_type' => ['nullable', 'string', 'max:120', 'required_with:request_category'],
            'action_required' => ['nullable', 'string', 'max:80', 'required_with:request_category', Rule::in($actions)],
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'priority' => ['required', Rule::in(['normal', 'high', 'urgent'])],
            'target_department_id' => [
                'required',
                'integer',
                Rule::exists('departments', 'id')->where(
                    fn ($query) => $query->where('is_active', true)->where('is_routable', true),
                ),
            ],
            'assigned_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'due_at' => ['nullable', 'date', 'after_or_equal:today'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            ...CoreEvidenceRules::rules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $category = $this->input('request_category');
            if ($category) {
                $allowedTypes = config("work_requests.categories.{$category}", []);

                if (! in_array($this->input('request_type'), $allowedTypes, true)) {
                    $validator->errors()->add(
                        'request_type',
                        'Select a request type available for the chosen category.',
                    );
                }
            }

            $assignedEmployeeId = $this->integer('assigned_employee_id');
            $targetDepartmentId = $this->integer('target_department_id');

            if ($assignedEmployeeId && $targetDepartmentId && ! Employee::query()
                ->whereKey($assignedEmployeeId)
                ->where('department_id', $targetDepartmentId)
                ->where('employment_status', 'active')
                ->exists()) {
                $validator->errors()->add(
                    'assigned_employee_id',
                    'Select an active employee from the receiving office.',
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'target_department_id.required' => 'Select a receiving office.',
            'priority.in' => 'Select a valid Work Request priority.',
            'due_at.after_or_equal' => 'Target completion cannot be before today.',
        ];
    }

    private function nullableTrimmed(string $key): ?string
    {
        $value = $this->input($key);
        if ($value === null) {
            return null;
        }

        $value = trim((string) $value);

        return $value === '' ? null : $value;
    }
}
