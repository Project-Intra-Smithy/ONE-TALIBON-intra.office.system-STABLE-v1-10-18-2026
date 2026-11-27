<?php

declare(strict_types=1);

return [
    /*
    |--------------------------------------------------------------------------
    | Isolated Legacy Custody Broker Storage Root (K3)
    |--------------------------------------------------------------------------
    |
    | Strictly outside config/filesystems.php, storage_path(), public_path(),
    | and all Laravel Storage disks. Fails closed when unset or empty.
    |
    */
    'broker_root' => env('LEGACY_CUSTODY_BROKER_ROOT', null),

    /*
    |--------------------------------------------------------------------------
    | Broker IPC & Close-Ack HMAC Key (>= 32 bytes required)
    |--------------------------------------------------------------------------
    */
    'broker_hmac_key' => env('LEGACY_CUSTODY_BROKER_HMAC_KEY', null),

    /*
    |--------------------------------------------------------------------------
    | Separate-Process Broker Entrypoint
    |--------------------------------------------------------------------------
    */
    'broker_binary' => base_path('bin/legacy-custody-broker'),

    /*
    |--------------------------------------------------------------------------
    | Bounded Upload Limits & Allowed MIME Types
    |--------------------------------------------------------------------------
    */
    'max_upload_bytes' => 15728640, // 15 MiB

    'allowed_mimes' => [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/webp',
    ],

    /*
    |--------------------------------------------------------------------------
    | Stage 4 External Authority Paths (Outside PostgreSQL)
    |--------------------------------------------------------------------------
    */
    'watermark_store_path' => env('LEGACY_CUSTODY_WATERMARK_STORE', null),
    'authority_fence_path' => env('LEGACY_CUSTODY_AUTHORITY_FENCE_PATH', null),
];
