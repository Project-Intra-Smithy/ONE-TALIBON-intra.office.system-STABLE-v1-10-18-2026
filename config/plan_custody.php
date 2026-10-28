<?php

return [
    // Synthetic quarantine only. This disk must never be routed or symlinked.
    'disk' => env('PLAN_CUSTODY_DISK', 'plan_custody'),
    'max_bytes' => (int) env('PLAN_CUSTODY_MAX_BYTES', 50 * 1024 * 1024),
    'max_scan_age_seconds' => (int) env('PLAN_CUSTODY_MAX_SCAN_AGE_SECONDS', 3600),
    'future_clock_skew_seconds' => (int) env('PLAN_CUSTODY_FUTURE_CLOCK_SKEW_SECONDS', 60),
];
