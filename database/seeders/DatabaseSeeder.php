<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            $this->command?->warn('Development fixture seeding is disabled outside local and testing environments.');

            return;
        }

        $this->call([
            MunicipalityStructureSeeder::class,
            WorkforceDemoSeeder::class,
            PrototypeMessagingDemoSeeder::class,
            MunicipalMeetingCalendarSeeder::class,
            WorkflowDemoSeeder::class,
            MemorandumDemoSeeder::class,
            LegislativeDemoSeeder::class,
            HrisDemoSeeder::class,
            OperationsMonitoringDemoSeeder::class,
            PayrollDemoSeeder::class,
            HrisDevelopmentDemoSeeder::class,
        ]);
    }
}
