<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class WorkflowTransaction extends Model
{
    use HasFactory;

    protected $table = 'transactions';

    protected $fillable = [
        'reference_no',
        'transaction_type',
        'request_category',
        'request_type',
        'action_required',
        'title',
        'description',
        'priority',
        'origin_department_id',
        'current_department_id',
        'created_by_user_id',
        'assigned_to_user_id',
        'assigned_employee_id',
        'status',
        'received_at',
        'due_at',
        'completed_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'received_at' => 'datetime',
            'due_at' => 'datetime',
            'completed_at' => 'datetime',
            'closed_at' => 'datetime',
        ];
    }

    public function scopeForOffice(Builder $query, int $departmentId): Builder
    {
        return $query->where('current_department_id', $departmentId);
    }

    public function scopePending(Builder $query): Builder
    {
        return $query->whereNotIn('status', $this->terminalStatuses());
    }

    public function scopeCompleted(Builder $query): Builder
    {
        return $query->whereIn('status', $this->terminalStatuses());
    }

    public function scopeAssignedTo(Builder $query, int $employeeId): Builder
    {
        return $query->where('assigned_employee_id', $employeeId);
    }

    public function isTerminal(): bool
    {
        return in_array($this->status, $this->terminalStatuses(), true);
    }

    public function isAssigned(): bool
    {
        return $this->assigned_employee_id !== null;
    }

    public function originDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'origin_department_id');
    }

    public function currentDepartment(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'current_department_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to_user_id');
    }

    public function assignedEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'assigned_employee_id');
    }

    /** @return array<int, string> */
    private function terminalStatuses(): array
    {
        return array_values(config('workflow.default.terminal_statuses', [
            'approved',
            'disapproved',
            'closed',
        ]));
    }

    public function events(): HasMany
    {
        return $this->hasMany(TransactionEvent::class, 'transaction_id')->orderBy('created_at');
    }
}
