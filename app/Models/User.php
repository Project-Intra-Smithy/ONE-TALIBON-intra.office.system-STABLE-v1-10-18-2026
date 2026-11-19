<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    // Mirror the PostgreSQL defaults for newly created, not-yet-refreshed models.
    // Account suspension still sets an explicit non-active status and is enforced
    // by RequireActiveAccount together with the session-version check.
    protected $attributes = [
        'account_status' => 'active',
        'session_version' => 1,
    ];

    protected $fillable = [
        'name',
        'username',
        'email',
        'password',
        'role',
        'is_active',
        'account_status',
        'session_version',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'mfa_secret',
        'mfa_recovery_codes',
        'mfa_recovery_codes_generated_at',
        'mfa_version',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'mfa_secret' => 'encrypted',
            'mfa_confirmed_at' => 'datetime',
            'mfa_recovery_codes' => 'array',
            'mfa_recovery_codes_generated_at' => 'datetime',
            'mfa_version' => 'integer',
            'last_seen_at' => 'datetime',
            'session_version' => 'integer',
            'suspended_at' => 'datetime',
        ];
    }

    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function isRole(string ...$roles): bool
    {
        return in_array($this->role, $roles, true);
    }
}
