<?php

namespace Tests\Feature\Upload;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class UploadSecurityTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Storage::fake('public');
    }

    public function test_upload_is_namespaced_to_caller_scope(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/upload', [
            'file' => UploadedFile::fake()->image('photo.jpg'),
            'folder' => 'evidence',
        ]);

        $response->assertStatus(201);
        $path = $response->json('data.path');

        $this->assertStringStartsWith("uploads/u/{$user->id}/evidence/", $path);
        Storage::disk('public')->assertExists($path);
    }

    public function test_user_can_delete_own_upload(): void
    {
        $user = User::factory()->create();

        $path = "uploads/u/{$user->id}/files/keep.txt";
        Storage::disk('public')->put($path, 'mine');

        $this->actingAs($user)
            ->deleteJson('/api/upload', ['path' => $path])
            ->assertStatus(200);

        Storage::disk('public')->assertMissing($path);
    }

    public function test_user_cannot_delete_anothers_upload(): void
    {
        $owner = User::factory()->create();
        $attacker = User::factory()->create();

        $victimPath = "uploads/u/{$owner->id}/files/victim.jpg";
        Storage::disk('public')->put($victimPath, 'do-not-touch');

        $this->actingAs($attacker)
            ->deleteJson('/api/upload', ['path' => $victimPath])
            ->assertStatus(403);

        Storage::disk('public')->assertExists($victimPath);
    }

    public function test_traversal_attempts_are_rejected(): void
    {
        $user = User::factory()->create();
        // A juicy system-looking file that must never be deletable
        Storage::disk('public')->put('products/hero.jpg', 'system asset');

        $attempts = [
            '../products/hero.jpg',
            'uploads/u/../products/hero.jpg',
            '..%2Fproducts%2Fhero.jpg',
            '/absolute/path.jpg',
        ];

        foreach ($attempts as $attempt) {
            $this->actingAs($user)
                ->deleteJson('/api/upload', ['path' => $attempt])
                ->assertStatus(422);
        }

        Storage::disk('public')->assertExists('products/hero.jpg');
    }

    public function test_administrator_can_moderate_any_upload(): void
    {
        $owner = User::factory()->create();
        $admin = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $admin->id, 'role' => 'administrator']);

        $path = "uploads/u/{$owner->id}/files/report.pdf";
        Storage::disk('public')->put($path, 'moderate-me');

        $this->actingAs($admin)
            ->deleteJson('/api/upload', ['path' => $path])
            ->assertStatus(200);

        Storage::disk('public')->assertMissing($path);
    }
}
