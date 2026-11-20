<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

final class StaffActivationInvitation extends Model
{
    protected $fillable = [
        'employee_id', 'user_id', 'department_id', 'created_by_user_id',
        'username', 'contact_email', 'role', 'code_digest', 'expires_at',
        'consumed_at', 'revoked_at', 'revocation_reason',
    ];

    protected $hidden = ['code_digest'];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'disclosed_at' => 'datetime',
            'consumed_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class);
    }

    public function issuer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }
}
