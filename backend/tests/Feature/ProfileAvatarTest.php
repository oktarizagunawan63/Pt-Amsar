<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ProfileAvatarTest extends TestCase
{
    use RefreshDatabase;

    private function user(): User
    {
        return User::create([
            'name' => 'QA Avatar',
            'email' => 'qa_avatar@test.local',
            'password' => Hash::make('secret123'),
            'role' => 'sales',
            'is_active' => true,
            'status' => 'approved',
        ]);
    }

    public function test_user_can_upload_replace_and_delete_avatar(): void
    {
        Storage::fake('public');
        $user = $this->user();
        Sanctum::actingAs($user);

        $first = $this->post('/api/auth/avatar', ['avatar' => UploadedFile::fake()->image('a.jpg', 200, 200)], ['Accept' => 'application/json'])
            ->assertOk()
            ->assertJsonPath('user.avatar_url', fn ($url) => str_contains($url, '/storage/avatars/'));
        $firstPath = $user->fresh()->avatar;
        Storage::disk('public')->assertExists($firstPath);

        $this->post('/api/auth/avatar', ['avatar' => UploadedFile::fake()->image('b.png', 200, 200)], ['Accept' => 'application/json'])
            ->assertOk();
        Storage::disk('public')->assertMissing($firstPath); // old photo cleaned up
        Storage::disk('public')->assertExists($user->fresh()->avatar);

        $this->deleteJson('/api/auth/avatar')->assertOk()->assertJsonPath('user.avatar_url', null);
        $this->assertNull($user->fresh()->avatar);
    }

    public function test_non_image_and_oversized_files_are_rejected(): void
    {
        Storage::fake('public');
        Sanctum::actingAs($this->user());

        $this->post('/api/auth/avatar', ['avatar' => UploadedFile::fake()->create('cv.pdf', 100, 'application/pdf')], ['Accept' => 'application/json'])
            ->assertStatus(422);
        $this->post('/api/auth/avatar', ['avatar' => UploadedFile::fake()->image('big.jpg')->size(3000)], ['Accept' => 'application/json'])
            ->assertStatus(422);
    }

    public function test_guest_cannot_upload_avatar(): void
    {
        $this->postJson('/api/auth/avatar')->assertStatus(401);
    }
}
