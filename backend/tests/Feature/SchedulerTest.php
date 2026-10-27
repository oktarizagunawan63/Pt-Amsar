<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\PlanVisit;
use App\Models\Project;
use App\Models\ProjectNotification;
use App\Models\RealisasiVisit;
use App\Models\User;
use App\Models\Warning;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/**
 * The daily jobs in routes/console.php: project status refresh, automatic missed visits,
 * and the deadline / over-budget notifications.
 */
class SchedulerTest extends TestCase
{
    use RefreshDatabase;

    private User $admin;
    private User $salesManager;
    private User $sales;
    private User $siteManager;

    protected function setUp(): void
    {
        parent::setUp();
        Carbon::setTestNow('2026-10-27 00:15:00');

        foreach (['admin' => 'administrator', 'salesManager' => 'sales_manager', 'sales' => 'sales', 'siteManager' => 'site_manager'] as $prop => $role) {
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

    private function project(array $extra = []): Project
    {
        return Project::create(array_merge([
            'name' => 'QA Project', 'location' => 'Jakarta', 'status' => 'on_track',
            'start_date' => '2026-01-01', 'end_date' => '2027-04-01',
            'rab' => 1000, 'rab_realisasi' => 0, 'progress' => 0,
            'project_manager_id' => $this->siteManager->id, 'site_manager_id' => $this->siteManager->id,
            'created_by' => $this->siteManager->id, 'assigned_engineers' => [],
        ], $extra));
    }

    private function planVisit(string $date, string $status = 'approved'): PlanVisit
    {
        $customer = Customer::create([
            'name' => 'QA Customer', 'company' => 'QA Co', 'address' => 'Jl. Test',
            'created_by' => $this->salesManager->id, 'approval_status' => 'approved',
        ]);
        return PlanVisit::create([
            'customer_id' => $customer->id, 'tanggal_visit' => $date, 'lokasi' => 'Lokasi', 'tujuan' => 'Presentasi produk',
            'assigned_to' => $this->sales->id, 'created_by' => $this->sales->id, 'status' => $status,
        ]);
    }

    public function test_all_daily_jobs_are_scheduled(): void
    {
        Artisan::call('schedule:list');
        $out = Artisan::output();

        foreach (['projects:refresh-status', 'visits:mark-missed', 'projects:check-deadlines', 'projects:check-budget'] as $command) {
            $this->assertStringContainsString($command, $out);
        }
    }

    public function test_refresh_status_recomputes_unfinished_projects_only(): void
    {
        $overdue = $this->project(['end_date' => '2026-10-20', 'progress' => 50]);
        $closing = $this->project(['end_date' => '2026-11-10', 'progress' => 40]);
        $done = $this->project(['end_date' => '2026-10-01', 'progress' => 100, 'status' => 'completed']);

        $this->artisan('projects:refresh-status')->assertSuccessful();

        $this->assertSame('delayed', $overdue->fresh()->status);
        $this->assertSame('at_risk', $closing->fresh()->status);
        $this->assertSame('completed', $done->fresh()->status);
    }

    public function test_mark_missed_flags_approved_visits_whose_day_is_over(): void
    {
        $overdue = $this->planVisit('2026-10-26');

        $this->artisan('visits:mark-missed')->assertSuccessful();

        $this->assertDatabaseHas('realisasi_visits', ['plan_visit_id' => $overdue->id, 'status' => 'missed']);
        $this->assertDatabaseHas('warnings', ['plan_visit_id' => $overdue->id, 'type' => 'missed_visit', 'user_id' => $this->sales->id]);
        foreach ([$this->sales, $this->salesManager, $this->admin] as $user) {
            $this->assertDatabaseHas('project_notifications', ['user_id' => $user->id, 'title' => 'Kunjungan Terlewat']);
        }
    }

    public function test_mark_missed_leaves_today_pending_and_realised_visits_alone(): void
    {
        $today = $this->planVisit('2026-10-27');
        $pending = $this->planVisit('2026-10-20', 'pending');
        $realised = $this->planVisit('2026-10-20');
        RealisasiVisit::create(['plan_visit_id' => $realised->id, 'type' => 'planned', 'status' => 'done', 'visited_by' => $this->sales->id]);

        $this->artisan('visits:mark-missed')->assertSuccessful();

        $this->assertDatabaseMissing('realisasi_visits', ['plan_visit_id' => $today->id]);
        $this->assertDatabaseMissing('realisasi_visits', ['plan_visit_id' => $pending->id]);
        $this->assertSame(1, RealisasiVisit::where('plan_visit_id', $realised->id)->count());
        $this->assertSame(0, Warning::count());
    }

    public function test_mark_missed_twice_records_each_visit_once(): void
    {
        $overdue = $this->planVisit('2026-10-26');

        $this->artisan('visits:mark-missed')->assertSuccessful();
        $this->artisan('visits:mark-missed')->assertSuccessful();

        $this->assertSame(1, RealisasiVisit::where('plan_visit_id', $overdue->id)->count());
        $this->assertSame(1, Warning::where('plan_visit_id', $overdue->id)->count());
        $this->assertSame(1, ProjectNotification::where('user_id', $this->sales->id)->where('title', 'Kunjungan Terlewat')->count());
    }

    public function test_mark_missed_button_still_records_the_same_outcome(): void
    {
        $overdue = $this->planVisit('2026-10-26');
        Sanctum::actingAs($this->sales);

        $this->postJson("/api/realisasi-visits/{$overdue->id}/mark-missed")->assertOk();

        $this->assertDatabaseHas('realisasi_visits', ['plan_visit_id' => $overdue->id, 'status' => 'missed', 'visited_by' => $this->sales->id]);
        $this->assertDatabaseHas('warnings', ['plan_visit_id' => $overdue->id, 'type' => 'missed_visit']);
        $this->assertDatabaseHas('project_notifications', ['user_id' => $this->salesManager->id, 'title' => 'Kunjungan Terlewat']);
    }

    public function test_deadline_check_notifies_site_manager_and_administrator_once_per_day(): void
    {
        $project = $this->project(['end_date' => '2026-11-01', 'progress' => 40]);
        $this->project(['end_date' => '2026-11-01', 'progress' => 90]);
        $this->project(['end_date' => '2026-12-31', 'progress' => 10]);

        $this->artisan('projects:check-deadlines')->assertSuccessful();
        $this->artisan('projects:check-deadlines')->assertSuccessful();

        foreach ([$this->siteManager, $this->admin] as $user) {
            $this->assertSame(1, ProjectNotification::where(['user_id' => $user->id, 'type' => 'deadline_warning'])->count(), $user->role);
        }
        $this->assertSame(2, ProjectNotification::where('type', 'deadline_warning')->where('project_id', $project->id)->count());
    }

    public function test_budget_check_compares_rab_columns_once_per_day(): void
    {
        $over = $this->project(['rab' => 1000, 'rab_realisasi' => 1500]);
        $this->project(['rab' => 1000, 'rab_realisasi' => 900]);

        $this->artisan('projects:check-budget')->assertSuccessful();
        $this->artisan('projects:check-budget')->assertSuccessful();

        $notified = ProjectNotification::where('type', 'over_budget')->get();
        $this->assertTrue($notified->every(fn ($n) => $n->project_id === $over->id));
        $this->assertSame(1, $notified->where('user_id', $this->siteManager->id)->count());
        $this->assertSame(1, $notified->where('user_id', $this->admin->id)->count());
    }
}
