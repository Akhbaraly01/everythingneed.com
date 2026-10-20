<?php

namespace Tests\Feature\Pharmacy;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Modules\Orders\Entities\MedicineOrder;
use Modules\Orders\Entities\MedicineOrderItem;
use Modules\Pharmacy\Entities\Medicine;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 console medicine CRUD: full edit (PUT) + guarded delete (DELETE) on
 * /api/medicines/{id} for super_admin / administrator / pharmacy_admin.
 */
class AdminMedicineCrudTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function makeMedicine(array $overrides = []): Medicine
    {
        return Medicine::create(array_merge([
            'name' => 'Paracetamol',
            'category' => 'painkillers',
            'price' => 12.50,
            'stock_quantity' => 40,
        ], $overrides));
    }

    #[Test]
    public function test_super_admin_edits_every_field(): void
    {
        $this->actingAsAdmin();
        $medicine = $this->makeMedicine();

        $this->putJson("/api/medicines/{$medicine->id}", [
            'name' => 'Ibuprofen',
            'generic_name' => 'Ibuprofen BP',
            'category' => 'nsiads',
            'price' => 9.99,
            'stock_quantity' => 7,
            'requires_prescription' => true,
        ])->assertOk()
            ->assertJsonPath('data.name', 'Ibuprofen')
            ->assertJsonPath('data.generic_name', 'Ibuprofen BP')
            ->assertJsonPath('data.requires_prescription', true);

        $fresh = Medicine::findOrFail($medicine->id);
        $this->assertSame('9.99', (string) $fresh->price);
        $this->assertSame(7, $fresh->stock_quantity);
    }

    #[Test]
    public function test_legacy_stock_alias_still_maps_to_stock_quantity(): void
    {
        $this->actingAsAdmin();
        $medicine = $this->makeMedicine();

        $this->putJson("/api/medicines/{$medicine->id}", ['stock' => 3])->assertOk();

        $this->assertSame(3, Medicine::findOrFail($medicine->id)->stock_quantity);
    }

    #[Test]
    public function test_empty_payload_is_rejected(): void
    {
        $this->actingAsAdmin();
        $medicine = $this->makeMedicine();

        $this->putJson("/api/medicines/{$medicine->id}", [])
            ->assertStatus(422)
            ->assertJsonPath('message', 'No changes provided');
    }

    #[Test]
    public function test_edit_404s_for_unknown_medicine(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/medicines/' . Str::uuid(), ['name' => 'Ghost'])->assertStatus(404);
    }

    #[Test]
    public function test_pharmacy_admin_role_can_edit_and_delete(): void
    {
        $actor = $this->createUser();
        $this->assignRole($actor, 'pharmacy_admin');
        $this->actingAs($actor, 'sanctum');

        $medicine = $this->makeMedicine();

        $this->putJson("/api/medicines/{$medicine->id}", ['price' => 15])->assertOk();

        $this->deleteJson("/api/medicines/{$medicine->id}")->assertOk();
        $this->assertNull(Medicine::find($medicine->id));
    }

    #[Test]
    public function test_plain_user_cannot_edit_or_delete(): void
    {
        $medicine = $this->makeMedicine();
        $user = $this->createUser();
        $this->actingAs($user, 'sanctum');

        $this->putJson("/api/medicines/{$medicine->id}", ['name' => 'Hacked'])->assertStatus(403);
        $this->deleteJson("/api/medicines/{$medicine->id}")->assertStatus(403);
    }

    #[Test]
    public function test_delete_soft_deletes_the_medicine(): void
    {
        $this->actingAsAdmin();
        $medicine = $this->makeMedicine();

        $this->deleteJson("/api/medicines/{$medicine->id}")
            ->assertOk()
            ->assertJsonPath('message', 'Medicine deleted');

        $this->assertNull(Medicine::find($medicine->id));
        $trashed = Medicine::withTrashed()->find($medicine->id);
        $this->assertNotNull($trashed);
        $this->assertNotNull($trashed->deleted_at);

        // Public reads no longer resolve it.
        $this->getJson("/api/medicines/{$medicine->id}")->assertStatus(404);
    }

    #[Test]
    public function test_delete_is_refused_while_order_items_exist(): void
    {
        $this->actingAsAdmin();
        $medicine = $this->makeMedicine();

        $order = MedicineOrder::create([
            'user_id' => User::factory()->create()->id,
            'order_number' => 'MED-GUARD001',
            'delivery_address' => 'Test address',
            'total_amount' => 25,
            'status' => 'pending',
        ]);
        MedicineOrderItem::create([
            'order_id' => $order->id,
            'medicine_id' => $medicine->id,
            'quantity' => 2,
            'unit_price' => 12.50,
        ]);

        $this->deleteJson("/api/medicines/{$medicine->id}")
            ->assertStatus(422);

        $this->assertNotNull(Medicine::find($medicine->id));
    }
}
