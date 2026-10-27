<?php

namespace Tests\Feature;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * One account may stay signed in on several devices at once; signing in on one device must not
 * sign the others out, and colleagues behind the same office IP must not block each other.
 */
class MultiDeviceLoginTest extends TestCase
{
    use RefreshDatabase;

    protected function tearDown(): void
    {
        Carbon::setTestNow();
        parent::tearDown();
    }

    private function user(string $email): User
    {
        return User::create([
            'name' => "QA {$email}", 'email' => $email, 'password' => Hash::make('secret123'),
            'role' => 'sales', 'is_active' => true, 'status' => 'approved',
        ]);
    }

    private function login(string $email, string $password = 'secret123')
    {
        return $this->postJson('/api/auth/login', ['email' => $email, 'password' => $password]);
    }

    /** Each request authenticates from scratch, as separate devices would. */
    private function me(string $token)
    {
        $this->app['auth']->forgetGuards();
        return $this->withToken($token)->getJson('/api/auth/me');
    }

    public function test_signing_in_on_a_second_device_keeps_the_first_signed_in(): void
    {
        $this->user('sales@test.local');
        $laptop = $this->login('sales@test.local')->assertOk()->json('token');
        $phone = $this->login('sales@test.local')->assertOk()->json('token');

        $this->me($laptop)->assertOk();
        $this->me($phone)->assertOk();
    }

    public function test_logging_out_on_one_device_leaves_the_other_signed_in(): void
    {
        $this->user('sales@test.local');
        $laptop = $this->login('sales@test.local')->json('token');
        $phone = $this->login('sales@test.local')->json('token');

        $this->app['auth']->forgetGuards();
        $this->withToken($phone)->postJson('/api/auth/logout')->assertOk();

        $this->me($phone)->assertUnauthorized();
        $this->me($laptop)->assertOk();
    }

    public function test_one_account_hitting_the_login_limit_does_not_block_colleagues_on_the_same_ip(): void
    {
        $this->user('sales@test.local');
        $this->user('colleague@test.local');

        for ($i = 0; $i < 5; $i++) {
            $this->login('sales@test.local', 'wrong-password')->assertStatus(422);
        }
        $this->login('sales@test.local', 'wrong-password')->assertStatus(429);

        $this->login('colleague@test.local')->assertOk();
    }

    public function test_a_session_expires_after_thirty_days(): void
    {
        $this->user('sales@test.local');
        $token = $this->login('sales@test.local')->json('token');

        Carbon::setTestNow(now()->addDays(29));
        $this->me($token)->assertOk();

        Carbon::setTestNow(now()->addDays(2));
        $this->me($token)->assertUnauthorized();
    }
}
