<?php

namespace Tests\Feature\Vendors;

use Tests\TestCase;
use App\Models\User;
use App\Models\UserRole;
use Modules\Vendors\Entities\Vendor;

class VendorRegistrationTest extends TestCase
{
    public function test_vendor_can_register(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/vendors', [
                'store_name' => 'My Electronics Shop',
                'category' => 'electronics',
                'description' => 'Best electronics store',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => ['id', 'store_name', 'category', 'is_verified'],
            ]);

        $this->assertDatabaseHas('vendors', [
            'user_id' => $user->id,
            'store_name' => 'My Electronics Shop',
            'category' => 'electronics',
        ]);
    }

    public function test_vendor_registration_requires_store_name(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/vendors', [
                'category' => 'electronics',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['store_name']);
    }

    public function test_vendor_registration_requires_category(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/vendors', [
                'store_name' => 'My Shop',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['category']);
    }

    public function test_unauthenticated_user_cannot_register_vendor(): void
    {
        $response = $this->postJson('/api/vendors', [
            'store_name' => 'My Shop',
            'category' => 'electronics',
        ]);

        $response->assertStatus(401);
    }

    public function test_admin_can_approve_vendor(): void
    {
        $admin = $this->createAdmin();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser, ['is_verified' => false]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/vendors/{$vendor->id}/approve");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Vendor approved successfully']);

        $vendor->refresh();
        $this->assertTrue($vendor->is_verified);
    }

    public function test_admin_can_suspend_vendor(): void
    {
        $admin = $this->createAdmin();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser, ['is_verified' => true]);

        $response = $this->actingAs($admin, 'sanctum')
            ->postJson("/api/vendors/{$vendor->id}/suspend", [
                'reason' => 'Violation of terms',
            ]);

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Vendor suspended successfully']);

        $vendor->refresh();
        $this->assertFalse($vendor->is_verified);
    }

    public function test_non_admin_cannot_approve_vendor(): void
    {
        $regularUser = $this->createUser();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser, ['is_verified' => false]);

        $response = $this->actingAs($regularUser, 'sanctum')
            ->postJson("/api/vendors/{$vendor->id}/approve");

        $response->assertStatus(403);
    }

    public function test_non_admin_cannot_suspend_vendor(): void
    {
        $regularUser = $this->createUser();
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser, ['is_verified' => true]);

        $response = $this->actingAs($regularUser, 'sanctum')
            ->postJson("/api/vendors/{$vendor->id}/suspend");

        $response->assertStatus(403);
    }

    public function test_user_cannot_register_as_vendor_twice(): void
    {
        $user = $this->createUser();
        $this->createVendor($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/vendors', [
                'store_name' => 'Another Shop',
                'category' => 'clothing',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['general']);
    }

    public function test_anyone_can_list_vendors(): void
    {
        $vendorUser = $this->createUser();
        $this->createVendor($vendorUser, ['store_name' => 'Test Vendor', 'is_verified' => true]);

        $response = $this->actingAs($this->createUser(), 'sanctum')
            ->getJson('/api/vendors');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'store_name', 'category']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);
    }

    public function test_public_directory_hides_unverified_and_suspended_vendors(): void
    {
        $approvedUser = $this->createUser();
        $approved = $this->createVendor($approvedUser, ['store_name' => 'Approved Shop', 'is_verified' => true]);

        $pendingUser = $this->createUser();
        $this->createVendor($pendingUser, ['store_name' => 'Pending Shop', 'is_verified' => false]);

        $response = $this->getJson('/api/vendors?per_page=50');

        $response->assertOk();
        $ids = collect($response->json('data'))->pluck('id');
        $this->assertTrue($ids->contains($approved->id));
        $this->assertCount(1, $ids, 'Only approved vendors are publicly listed');
    }

    public function test_anyone_can_view_a_vendor(): void
    {
        $vendorUser = $this->createUser();
        $vendor = $this->createVendor($vendorUser, ['store_name' => 'Viewable Shop']);

        $response = $this->actingAs($this->createUser(), 'sanctum')
            ->getJson("/api/vendors/{$vendor->id}");

        $response->assertOk()
            ->assertJsonFragment(['store_name' => 'Viewable Shop']);
    }
}
