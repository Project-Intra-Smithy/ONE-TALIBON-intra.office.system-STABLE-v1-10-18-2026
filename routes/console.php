<?php

use Illuminate\Support\Facades\Artisan;

Artisan::command('about:portal', function (): void {
    $this->info('Talibon Intra-Office Portal');
});
