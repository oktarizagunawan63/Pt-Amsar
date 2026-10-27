<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\SalesFunnel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** Marking a deal WON hands the new project to the Site Manager the salesperson picks. */
class FunnelWonSiteManagerTest extends TestCase
{
    use RefreshDatabase;

    private User $sales;
    private User $engineer;
    private User $siteManagerA;
    private User $siteManagerB;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sales = $this->user('sales', 'sales');
        $this->engineer = $this->user('engineer', 'engineer');
        $this->siteManagerA = $this->user('site_manager', 'sm_a');
        $this->siteManagerB = $this->user('site_manager', 'sm_b');
    }

    private function user(string $role, string $key, bool $active = true): User
    {
        return User::create([
            'name' => "QA {$key}", 'email' => "qa_{$key}@test.local", 'password' => Hash::make('secret123'),
            'role' => $role, 'is_active' => $active, 'status' => 'approved',
        ]);
    }

    private function funnel(): SalesFunnel
    {
        Sanctum::actingAs($this->sales);
        $this->postJson('/api/funnels', [
            'customer_name' => 'Budi', 'customer_company' => 'RS QA', 'channel' => 'rsud',
            'city' => 'Bandung', 'segment' => 'sot', 'qty' => 1, 'unit' => 'unit',
            'estimated_value' => 250000000, 'deal_stage' => 'negosiasi',
            'target_close_date' => now()->addWeek()->toDateString(), 'win_probability' => 'high',
        ])->assertStatus(201);

        return SalesFunnel::where('customer_company', 'RS QA')->latest('id')->firstOrFail();
    }

    private function markWon(SalesFunnel $funnel, array $extra = [])
    {
        Sanctum::actingAs($this->sales);
        return $this->postJson("/api/funnels/{$funnel->id}/mark-won", array_merge([
            'won_reason_category' => 'relasi', 'won_date' => now()->toDateString(),
        ], $extra));
    }

    public function test_the_project_goes_to_the_chosen_site_manager(): void
    {
        $funnel = $this->funnel();

        $this->markWon($funnel, ['site_manager_id' => $this->siteManagerB->id])->assertOk();

        $project = Project::where('name', 'like', '[FUNNEL] RS QA%')->firstOrFail();
        $this->assertSame($this->siteManagerB->id, (int) $project->site_manager_id);
        $this->assertSame($this->siteManagerB->id, (int) $project->project_manager_id);
    }

    public function test_a_site_manager_must_be_chosen_when_there_are_several(): void
    {
        $funnel = $this->funnel();

        $this->markWon($funnel)->assertStatus(422)->assertJsonValidationErrors('site_manager_id');

        $this->assertSame('open', $funnel->fresh()->status);
        $this->assertSame(0, Project::count());
    }

    public function test_the_only_active_site_manager_is_used_when_none_is_chosen(): void
    {
        $this->siteManagerB->update(['is_active' => false]);
        $funnel = $this->funnel();

        $this->markWon($funnel)->assertOk();

        $this->assertSame($this->siteManagerA->id, (int) Project::firstOrFail()->site_manager_id);
    }

    public function test_only_an_active_site_manager_can_be_chosen(): void
    {
        $funnel = $this->funnel();
        $this->siteManagerB->update(['is_active' => false]);

        $this->markWon($funnel, ['site_manager_id' => $this->engineer->id])->assertStatus(422);
        $this->markWon($funnel, ['site_manager_id' => $this->siteManagerB->id])->assertStatus(422);
        $this->assertSame(0, Project::count());
    }

    public function test_sales_can_list_the_active_site_managers(): void
    {
        $this->siteManagerB->update(['is_active' => false]);
        Sanctum::actingAs($this->sales);

        $this->getJson('/api/funnels/site-managers')
            ->assertOk()
            ->assertJsonPath('data', [['id' => $this->siteManagerA->id, 'name' => 'QA sm_a']]);
    }
}
