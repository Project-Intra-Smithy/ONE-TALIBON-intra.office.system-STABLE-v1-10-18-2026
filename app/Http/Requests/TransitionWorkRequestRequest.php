<?php

namespace App\Http\Requests;

use App\Domain\Workflow\WorkflowDefinitionResolver;
use App\Models\Employee;
use App\Models\WorkflowTransaction;
use App\Services\CoreEvidenceRules;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class TransitionWorkRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        $transaction = $this->route('transaction');
        $user = $this->user();

        if (! $transaction instanceof WorkflowTransaction || ! $user) {
            return false;
        }

        $action = (string) $this->input('action');

        return match ($action) {
            'assign' => $user->can('assign', $transaction),
            'approve', 'disapprove' => $user->can('mayorDecision', $transaction),
            'request_information' => $user->can('mayorDecision', $transaction)
                || $user->can('transition', $transaction),
            default => $user->can('transition', $transaction),
        };
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'action' => $this->nullableTrimmed('action'),
            'remarks' => $this->nullableTrimmed('remarks'),
        ]);
    }

    public function rules(): array
    {
        $transaction = $this->route('transaction');
        $definition = app(WorkflowDefinitionResolver::class)->resolve(
            $transaction instanceof WorkflowTransaction ? $transaction : null,
        );

        return [
            'action' => ['required', Rule::in($definition->actions())],
            'target_department_id' => [
                'nullable',
                'integer',
                Rule::exists('departments', 'id')->where(
                    fn ($query) => $query->where('is_active', true)->where('is_routable', true),
                ),
            ],
            'assigned_employee_id' => ['nullable', 'integer', 'exists:employees,id'],
            'remarks' => ['nullable', 'string', 'max:2000'],
            ...CoreEvidenceRules::rules(),
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty() || $this->input('action') !== 'assign') {
                return;
            }

            $transaction = $this->route('transaction');
            if (! $transaction instanceof WorkflowTransaction) {
                return;
            }

            $assignedEmployeeId = $this->integer('assigned_employee_id');
            if (! $assignedEmployeeId) {
                return;
            }

            if (! Employee::query()
                ->whereKey($assignedEmployeeId)
                ->where('department_id', $transaction->current_department_id)
                ->where('employment_status', 'active')
                ->exists()) {
                $validator->errors()->add(
                    'assigned_employee_id',
                    'Choose an active employee from the current office.',
                );
            }
        });
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
