<?php

namespace Tests\Feature;

use App\Models\Department;
use App\Services\OfficeDirectoryCatalog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OfficeDirectoryCatalogTest extends TestCase
{
    use RefreshDatabase;

    public function test_display_catalog_has_exactly_40_cards_14_groups_without_fake_routing(): void
    {
        $data = app(OfficeDirectoryCatalog::class)->workspace();
        $this->assertCount(40, $data['directoryEntries']);
        $this->assertCount(14, $data['directoryGroups']);
        $this->assertSame(40, count(array_unique(array_column($data['directoryEntries'], 'key'))));
        $this->assertSame('FOCAL-001', $data['directoryEntries'][0]['key']);
        $this->assertSame('FOCAL-040', $data['directoryEntries'][39]['key']);
        foreach ($data['directoryEntries'] as $row) {
            $this->assertNull($row['recordsHref']);
            $this->assertFalse($row['routable']);
            $this->assertNull($row['backingDepartmentCode']);
        }
        $this->assertSame(0, Department::query()->count());
        $counts = array_count_values(array_column($data['directoryEntries'], 'group'));
        $this->assertSame([
            'Planning'=>1, 'Executive'=>2, 'Legislative'=>2,
            'Infrastructure'=>2, 'Finance'=>4, 'Administration'=>4,
            'Social'=>9, 'Economic'=>8, 'Environment'=>2,
            'Education'=>1, 'Transport'=>1, 'National Agency'=>1,
            'Community'=>1, 'Community Partners'=>2,
        ], $counts);
    }
}
