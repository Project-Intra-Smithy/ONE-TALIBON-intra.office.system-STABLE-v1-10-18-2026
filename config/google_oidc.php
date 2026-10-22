<?php

return [
    // Off until Composer lock, approved linking, HTTPS callback and review pass.
    'enabled' => (bool) env('GOOGLE_OIDC_ENABLED', false),
    'flow_ttl_seconds' => 300,
    'link_mfa_max_age_seconds' => 600,
    'rate_limit_attempts' => 10,
    'rate_limit_decay_seconds' => 60,
];
