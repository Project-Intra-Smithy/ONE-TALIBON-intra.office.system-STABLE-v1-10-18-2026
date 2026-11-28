<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Services\Planning\PlanningSuiteInitializer;
use Illuminate\Database\Seeder;

/**
 * Explicit opt-in disposable/local-only demo seeder for Local Development Planning samples.
 * Never invoked from DatabaseSeeder or HTTP read routes.
 */
final class PlanningReferenceSampleSeeder extends Seeder
{
    public function run(): void
    {
        app(PlanningSuiteInitializer::class)->seedReferenceSamples(explicitOptIn: true);
    }
}
