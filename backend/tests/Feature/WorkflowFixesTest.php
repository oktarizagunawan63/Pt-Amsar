<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\Material;
use App\Models\PlanVisit;
use App\Models\Project;
use App\Models\ProjectAssignment;
use App\Models\RealisasiVisit;
use App\Models\SalesFunnel;
use App\Models\User;
use App\Models\WorkLocation;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * Regression tests for the workflow/authorization fixes.
 * Runs against amsar_dashboard_test, built from database/schema/mysql-schema.sql
 * by RefreshDatabase (needs the mysql client on PATH); every test rolled back.
 */
class WorkflowFixesTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $salesManager;
    private User $sales;
    private User $siteManager;
    private User $engineer;

    protected function setUp(): void
    {
        parent::setUp();

        foreach (['admin' => 'administrator', 'salesManager' => 'sales_manager', 'sales' => 'sales', 'siteManager' => 'site_manager', 'engineer' => 'engineer'] as $prop => $role) {
            $this->$prop = User::create([
                'name' => "QA {$role}",
                'email' => "qa_{$role}@test.local",
                'password' => Hash::make('secret123'),
                'role' => $role,
                'is_active' => true,
                'status' => 'approved',
            ]);
        }
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function as(User $user): static
    {
        Sanctum::actingAs($user);
        return $this;
    }

    private function approvedCustomer(): Customer
    {
        return Customer::create([
            'name' => 'QA Customer', 'company' => 'QA Co', 'address' => 'Jl. Test',
            'created_by' => $this->salesManager->id, 'approval_status' => 'approved',
        ]);
    }

    private function project(User $owner, array $extra = []): Project
    {
        return Project::create(array_merge([
            'name' => 'QA Project', 'location' => 'Jakarta', 'status' => 'on_track',
            'start_date' => now()->toDateString(), 'end_date' => now()->addMonths(6)->toDateString(),
            'rab' => 1000, 'rab_realisasi' => 0, 'progress' => 0,
            'project_manager_id' => $owner->id, 'site_manager_id' => $owner->id, 'created_by' => $owner->id,
            'assigned_engineers' => [],
        ], $extra));
    }

    // ---------- Users / auth ----------

    public function test_public_register_cannot_create_admin_and_new_accounts_wait_for_approval(): void
    {
        $this->postJson('/api/auth/register', [
            'name' => 'Evil', 'email' => 'evil@test.local', 'password' => 'secret123', 'role' => 'administrator',
        ])->assertStatus(422);

        $this->postJson('/api/auth/register', [
            'name' => 'New Sales', 'email' => 'newsales@test.local', 'password' => 'secret123', 'role' => 'sales',
        ])->assertStatus(201);

        $user = User::where('email', 'newsales@test.local')->first();
        $this->assertFalse((bool) $user->is_active);
        $this->assertSame('pending', $user->status);
    }

    public function test_non_admin_cannot_escalate_or_create_users(): void
    {
        $this->as($this->sales)->putJson("/api/users/{$this->sales->id}", ['role' => 'administrator'])->assertStatus(403);
        $this->assertSame('sales', $this->sales->fresh()->role);

        $this->as($this->sales)->postJson('/api/users', [
            'name' => 'X', 'email' => 'x@test.local', 'password' => 'secret123', 'role' => 'administrator',
        ])->assertStatus(403);

        $this->as($this->siteManager)->deleteJson("/api/users/{$this->salesManager->id}")->assertStatus(403);
    }

    public function test_admin_only_and_manager_only_routes_are_guarded(): void
    {
        $this->as($this->sales)->getJson('/api/activity-logs')->assertStatus(403);
        $this->as($this->engineer)->getJson('/api/funnels')->assertStatus(403);
        $this->as($this->sales)->postJson('/api/sales-manager/unplanned-visits/1/approve')->assertStatus(403);
    }

    // ---------- Customer -> plan visit -> realisasi ----------

    public function test_visit_flow_requires_approved_customer_and_due_date_for_missed(): void
    {
        $this->as($this->sales)->postJson('/api/customers', ['name' => 'Pending Cust', 'address' => 'Jl. A'])
            ->assertStatus(201);
        $customer = Customer::where('name', 'Pending Cust')->first();
        $this->assertSame('pending', $customer->approval_status);

        $plan = ['customer_id' => $customer->id, 'lokasi' => 'Lokasi', 'tujuan' => 'Presentasi produk'];

        $this->as($this->sales)->postJson('/api/plan-visits', $plan + ['tanggal_visit' => now()->addDay()->toDateString()])
            ->assertStatus(422);

        $this->as($this->salesManager)->postJson("/api/customers/{$customer->id}/approve")->assertOk();

        $this->as($this->sales)->postJson('/api/plan-visits', $plan + ['tanggal_visit' => now()->addDay()->toDateString()])
            ->assertStatus(201);
        $future = PlanVisit::where('customer_id', $customer->id)->latest('id')->first();
        $this->assertSame($this->sales->id, (int) $future->assigned_to);

        $this->as($this->sales)->postJson("/api/realisasi-visits/{$future->id}/mark-missed")->assertStatus(422);

        $this->as($this->sales)->postJson('/api/plan-visits', $plan + ['tanggal_visit' => now()->toDateString()])
            ->assertStatus(201);
        $today = PlanVisit::where('customer_id', $customer->id)->latest('id')->first();

        $this->as($this->sales)->postJson('/api/realisasi-visits', ['plan_visit_id' => $today->id, 'status' => 'done'])
            ->assertStatus(201);
        $this->assertDatabaseHas('realisasi_visits', ['plan_visit_id' => $today->id, 'status' => 'done', 'visited_by' => $this->sales->id]);
    }

    public function test_unplanned_visit_requires_customer_and_reads_do_not_delete_rows(): void
    {
        $this->as($this->sales)->postJson('/api/realisasi-visits/unplanned', [
            'customer_name' => 'Walk In', 'customer_company' => 'Walk In Co', 'customer_phone' => '0812345678901',
            'visit_date' => now()->toDateString(), 'visit_time' => now()->toDateTimeString(),
            'visit_purpose' => 'Perkenalan produk baru', 'meeting_notes' => 'Customer tertarik demo',
            'visit_outcome' => 'follow_up', 'latitude' => -6.2, 'longitude' => 106.8, 'photos' => ['x'],
        ])->assertStatus(422)->assertJsonValidationErrorFor('customer_id');

        // Legacy row without a customer used to be wiped by any GET on the visit lists.
        $legacy = RealisasiVisit::create([
            'type' => 'unplanned', 'status' => 'done', 'approval_status' => 'pending',
            'visit_date' => now()->toDateString(), 'visited_by' => $this->sales->id,
        ]);

        $this->as($this->admin)->getJson('/api/realisasi-visits')->assertOk();
        $this->as($this->admin)->getJson('/api/realisasi-visits/pending-unplanned')->assertOk();

        $this->assertDatabaseHas('realisasi_visits', ['id' => $legacy->id]);
    }

    // ---------- Funnel ----------

    private function createFunnel(): SalesFunnel
    {
        $this->as($this->sales)->postJson('/api/funnels', [
            'customer_name' => 'QA Buyer', 'customer_company' => 'QA Hospital', 'channel' => 'rsud',
            'city' => 'Bandung', 'segment' => 'sot', 'qty' => 2, 'unit' => 'unit',
            'estimated_value' => 250000000, 'deal_stage' => 'negosiasi',
            'target_close_date' => now()->addWeek()->toDateString(), 'win_probability' => 'high',
        ])->assertStatus(201);

        return SalesFunnel::where('customer_company', 'QA Hospital')->latest('id')->first();
    }

    public function test_mark_won_creates_project_with_rab_and_sane_deadline(): void
    {
        $funnel = $this->createFunnel();

        $this->as($this->sales)->postJson("/api/funnels/{$funnel->id}/mark-won", [
            'won_reason_category' => 'relasi', 'won_date' => now()->addDay()->toDateString(),
        ])->assertStatus(422);

        $this->as($this->sales)->postJson("/api/funnels/{$funnel->id}/mark-won", [
            'won_reason_category' => 'relasi', 'won_date' => now()->toDateString(),
        ])->assertOk();

        $project = Project::where('name', 'like', '[FUNNEL] QA Hospital%')->latest('id')->first();
        $this->assertNotNull($project);
        $this->assertEquals(250000000, (float) $project->rab);
        $this->assertSame(now()->addMonths(3)->toDateString(), $project->end_date->toDateString());
        $this->assertNotSame($this->sales->id, (int) $project->project_manager_id);
        $this->assertContains((int) $project->project_manager_id, [$this->siteManager->id, $this->admin->id]);

        $this->as($this->sales)->postJson("/api/funnels/{$funnel->id}/activities", [
            'activity_type' => 'telepon', 'activity_date' => now()->toDateString(), 'notes' => 'Follow up setelah menang',
        ])->assertStatus(422);
    }

    public function test_win_rate_counts_by_closing_date_not_updated_at(): void
    {
        $won = $this->createFunnel();
        $lost = $this->createFunnel();

        $won->update(['status' => 'won', 'won_date' => now()->toDateString()]);
        // Lost last month but edited today: must not count in this month's win rate.
        $lost->update(['status' => 'lost', 'lost_date' => now()->subMonthNoOverflow()->startOfMonth()->toDateString()]);

        $this->as($this->sales)->getJson('/api/funnels/stats/summary')
            ->assertOk()
            ->assertJsonPath('data.win_rate_bulan_ini', 100);
    }

    // ---------- Projects ----------

    public function test_only_owner_or_admin_can_complete_project(): void
    {
        $project = $this->project($this->siteManager);

        $this->as($this->sales)->postJson("/api/projects/{$project->id}/complete")->assertStatus(403);
        $this->as($this->siteManager)->postJson("/api/projects/{$project->id}/complete")->assertOk();
        $this->as($this->siteManager)->postJson("/api/projects/{$project->id}/complete")->assertStatus(422);
    }

    public function test_engineer_assignment_syncs_and_is_scoped_to_owner(): void
    {
        $project = $this->project($this->siteManager);
        $otherSm = User::create([
            'name' => 'QA other sm', 'email' => 'qa_other_sm@test.local', 'password' => Hash::make('x'),
            'role' => 'site_manager', 'is_active' => true, 'status' => 'approved',
        ]);

        $this->as($otherSm)->postJson("/api/projects/{$project->id}/assign-engineer", ['engineer_id' => $this->engineer->id])
            ->assertStatus(403);

        $this->as($this->siteManager)->postJson("/api/projects/{$project->id}/assign-engineer", ['engineer_id' => $this->engineer->id])
            ->assertOk();
        $this->assertTrue(ProjectAssignment::where('project_id', $project->id)->where('user_id', $this->engineer->id)->exists());

        $ids = collect($this->as($this->engineer)->getJson('/api/dashboard/engineer')->assertOk()->json('data.assigned_projects'))->pluck('id');
        $this->assertContains($project->id, $ids->all());

        $this->as($this->admin)->postJson('/api/projects/assign-engineers', [
            'project_id' => 99999999, 'engineer_ids' => [$this->engineer->id],
        ])->assertStatus(404);
    }

    public function test_soft_delete_keeps_related_data_and_restore_is_owner_only(): void
    {
        $project = $this->project($this->siteManager);
        $material = Material::create(['project_id' => $project->id, 'name' => 'Kabel', 'unit' => 'm', 'qty_plan' => 10, 'qty_terpasang' => 0]);
        $otherSm = User::create([
            'name' => 'QA other sm', 'email' => 'qa_other_sm2@test.local', 'password' => Hash::make('x'),
            'role' => 'site_manager', 'is_active' => true, 'status' => 'approved',
        ]);

        $this->as($otherSm)->deleteJson("/api/projects/{$project->id}", ['password' => 'x'])->assertStatus(403);
        $this->as($this->siteManager)->deleteJson("/api/projects/{$project->id}", ['password' => 'secret123'])->assertOk();

        $this->assertSoftDeleted('projects', ['id' => $project->id]);
        $this->assertDatabaseHas('materials', ['id' => $material->id]);

        $this->as($otherSm)->postJson("/api/projects/{$project->id}/restore")->assertStatus(403);
        $this->as($this->siteManager)->postJson("/api/projects/{$project->id}/restore")->assertOk();
    }

    public function test_project_status_considers_progress(): void
    {
        $soon = now()->addDays(10)->toDateString();
        $this->assertSame('at_risk', Project::statusFor($soon, 50));
        $this->assertSame('on_track', Project::statusFor($soon, 90));
        $this->assertSame('delayed', Project::statusFor(now()->subDay()->toDateString(), 99));
        $this->assertSame('on_track', Project::statusFor(now()->addDays(60)->toDateString(), 0));
    }

    // ---------- Attendance ----------

    public function test_check_in_status_is_decided_by_server(): void
    {
        WorkLocation::query()->update(['is_active' => false]);
        WorkLocation::create(['name' => 'QA Office', 'latitude' => -6.2, 'longitude' => 106.8, 'radius_meters' => 200, 'is_active' => true]);
        Carbon::setTestNow(Carbon::today()->setTime(9, 30));

        $this->as($this->sales)->postJson('/api/attendance/check-in', [
            'latitude' => -6.2, 'longitude' => 106.8, 'status' => 'present',
        ])->assertStatus(201);

        $this->assertDatabaseHas('attendances', ['user_id' => $this->sales->id, 'status' => 'late']);
    }
}
