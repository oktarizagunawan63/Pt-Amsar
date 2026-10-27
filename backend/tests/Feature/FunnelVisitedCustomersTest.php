<?php

namespace Tests\Feature;

use App\Models\Customer;
use App\Models\PlanVisit;
use App\Models\RealisasiVisit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** The "new deal" form pre-fills customer data from customers the salesperson has visited. */
class FunnelVisitedCustomersTest extends TestCase
{
    use RefreshDatabase;

    public function test_visited_customers_are_listed_for_the_new_deal_form(): void
    {
        $sales = User::create([
            'name' => 'QA sales', 'email' => 'qa_sales@test.local', 'password' => Hash::make('secret123'),
            'role' => 'sales', 'is_active' => true, 'status' => 'approved',
        ]);
        $customer = Customer::create([
            'name' => 'Andi', 'company' => 'RS QA', 'phone' => '0812', 'email' => 'andi@rsqa.test',
            'address' => 'Jl. Kesehatan 1, Bandung', 'created_by' => $sales->id, 'approval_status' => 'approved',
        ]);
        $plan = PlanVisit::create([
            'customer_id' => $customer->id, 'tanggal_visit' => now()->subDay()->toDateString(), 'lokasi' => 'Bandung',
            'tujuan' => 'Presentasi produk', 'assigned_to' => $sales->id, 'created_by' => $sales->id, 'status' => 'approved',
        ]);
        RealisasiVisit::create(['plan_visit_id' => $plan->id, 'type' => 'planned', 'status' => 'done', 'visited_by' => $sales->id]);

        Sanctum::actingAs($sales);
        $this->getJson('/api/funnels/visited-customers')
            ->assertOk()
            ->assertJsonPath('total', 1)
            ->assertJsonPath('data.0.company', 'RS QA')
            ->assertJsonPath('data.0.address', 'Jl. Kesehatan 1, Bandung');
    }
}
