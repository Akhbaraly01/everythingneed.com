<?php

namespace Tests\Feature\Needs;

use Modules\Needs\Entities\NeedCategory;
use Modules\Needs\Entities\NeedRequest;
use Tests\TestCase;

/**
 * TODO 05 category + dynamic-form system: hierarchy, visibility, allowlisted
 * question schemas, answer validation, snapshot preservation, guarded delete.
 */
class NeedCategoryFormsTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
    }

    private function schema(): array
    {
        return [
            ['key' => 'property_type', 'label' => 'Property type', 'type' => 'select', 'required' => true, 'options' => ['Apartment', 'House']],
            ['key' => 'rooms', 'label' => 'Rooms', 'type' => 'number', 'required' => false],
        ];
    }

    public function test_public_categories_show_only_active_with_children(): void
    {
        $parent = NeedCategory::create([
            'name' => 'Home Services', 'slug' => 'home-services-' . uniqid(),
            'icon' => 'home', 'color' => '#000000', 'is_active' => true,
        ]);
        NeedCategory::create([
            'name' => 'Cleaning', 'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles', 'color' => '#10B981',
            'parent_id' => $parent->id, 'is_active' => true,
        ]);
        NeedCategory::create([
            'name' => 'Retired', 'slug' => 'retired-' . uniqid(),
            'icon' => 'x', 'color' => '#999999', 'is_active' => false,
        ]);

        $list = $this->getJson('/api/need-categories')->assertOk();
        $list->assertJsonFragment(['slug' => $parent->slug]);
        $list->assertJsonMissing(['name' => 'Retired']);

        $single = $this->getJson("/api/need-categories/{$parent->id}")->assertOk();
        $this->assertCount(1, $single->json('data.children'));
    }

    public function test_customer_cannot_touch_admin_category_endpoints(): void
    {
        $this->actingAsUser();

        $this->getJson('/api/admin/needs/categories')->assertStatus(403);
        $this->postJson('/api/admin/needs/categories', ['name' => 'X', 'slug' => 'x'])->assertStatus(403);
    }

    public function test_needs_admin_can_crud_categories(): void
    {
        $this->actingAsUser('needs_admin');

        $created = $this->postJson('/api/admin/needs/categories', [
            'name' => 'Plumbing',
            'slug' => 'plumbing-' . uniqid(),
            'form_schema' => $this->schema(),
        ])->assertStatus(201);
        $id = $created->json('data.id');
        $this->assertEquals(1, $created->json('data.form_schema_version'));

        // Schema change bumps the version.
        $updated = $this->putJson("/api/admin/needs/categories/{$id}", [
            'form_schema' => array_merge($this->schema(), [
                ['key' => 'urgency', 'label' => 'Urgency', 'type' => 'text', 'required' => false],
            ]),
        ])->assertOk();
        $this->assertEquals(2, $updated->json('data.form_schema_version'));

        // Same schema resubmitted: no bump.
        $same = $this->putJson("/api/admin/needs/categories/{$id}", [
            'name' => 'Plumbing & Heating',
        ])->assertOk();
        $this->assertEquals(2, $same->json('data.form_schema_version'));
    }

    public function test_invalid_schemas_are_rejected(): void
    {
        $this->actingAsUser('needs_admin');

        // Unknown field type.
        $this->postJson('/api/admin/needs/categories', [
            'name' => 'Bad', 'slug' => 'bad-' . uniqid(),
            'form_schema' => [['key' => 'x1', 'label' => 'X', 'type' => 'code']],
        ])->assertStatus(422);

        // Duplicate keys.
        $this->postJson('/api/admin/needs/categories', [
            'name' => 'Bad', 'slug' => 'bad2-' . uniqid(),
            'form_schema' => [
                ['key' => 'dup', 'label' => 'A', 'type' => 'text', 'required' => false],
                ['key' => 'dup', 'label' => 'B', 'type' => 'text', 'required' => false],
            ],
        ])->assertStatus(422);

        // Select without options.
        $this->postJson('/api/admin/needs/categories', [
            'name' => 'Bad', 'slug' => 'bad3-' . uniqid(),
            'form_schema' => [['key' => 'pick', 'label' => 'Pick', 'type' => 'select', 'required' => false]],
        ])->assertStatus(422);
    }

    public function test_category_cannot_live_under_itself_or_its_child(): void
    {
        $this->actingAsUser('needs_admin');

        $parent = NeedCategory::create([
            'name' => 'P', 'slug' => 'p-' . uniqid(), 'icon' => 'x', 'color' => '#000',
        ]);
        $child = NeedCategory::create([
            'name' => 'C', 'slug' => 'c-' . uniqid(), 'icon' => 'x', 'color' => '#000',
            'parent_id' => $parent->id,
        ]);

        $this->putJson("/api/admin/needs/categories/{$parent->id}", [
            'parent_id' => $parent->id,
        ])->assertStatus(422);

        $this->putJson("/api/admin/needs/categories/{$parent->id}", [
            'parent_id' => $child->id,
        ])->assertStatus(422);
    }

    public function test_used_category_cannot_be_deleted_but_unused_can(): void
    {
        $category = NeedCategory::create([
            'name' => 'Used', 'slug' => 'used-' . uniqid(), 'icon' => 'x', 'color' => '#000',
        ]);
        $owner = $this->actingAsUser();
        NeedRequest::create([
            'user_id' => $owner->id, 'category_id' => $category->id,
            'request_number' => 'NR-' . strtoupper(uniqid()),
            'title' => 'T', 'description' => 'D', 'status' => NeedRequest::STATUS_PENDING,
        ]);

        $this->actingAsUser('needs_admin');

        $this->deleteJson("/api/admin/needs/categories/{$category->id}")
            ->assertStatus(422)
            ->assertJsonFragment(['requests' => 1]);

        $free = NeedCategory::create([
            'name' => 'Free', 'slug' => 'free-' . uniqid(), 'icon' => 'x', 'color' => '#000',
        ]);
        $this->deleteJson("/api/admin/needs/categories/{$free->id}")->assertOk();
        $this->assertSoftDeleted('need_categories', ['id' => $free->id]);
    }

    public function test_request_answers_validate_and_snapshot(): void
    {
        $category = NeedCategory::create([
            'name' => 'Cleaning', 'slug' => 'cleaning-' . uniqid(),
            'icon' => 'sparkles', 'color' => '#10B981',
            'form_schema' => $this->schema(), 'form_schema_version' => 3,
        ]);

        $this->actingAsUser();

        // Missing required answer.
        $this->postJson('/api/need-requests', [
            'title' => 'Clean my flat',
            'description' => 'Two-bed flat.',
            'category_id' => $category->id,
            'answers' => ['rooms' => 2],
        ])->assertStatus(422);

        // Invalid option.
        $this->postJson('/api/need-requests', [
            'title' => 'Clean my flat',
            'description' => 'Two-bed flat.',
            'category_id' => $category->id,
            'answers' => ['property_type' => 'Castle', 'rooms' => 2],
        ])->assertStatus(422);

        // Valid: snapshot rides along.
        $created = $this->postJson('/api/need-requests', [
            'title' => 'Clean my flat',
            'description' => 'Two-bed flat.',
            'category_id' => $category->id,
            'answers' => ['property_type' => 'House', 'rooms' => 3],
        ])->assertStatus(201);

        $request = NeedRequest::findOrFail($created->json('data.id'));
        $this->assertEquals(['property_type' => 'House', 'rooms' => 3], $request->answers);
        $this->assertEquals(3, $request->form_schema_version);
        $this->assertEquals($this->schema(), $request->form_schema_snapshot);

        // Tightening the live schema never breaks the submitted snapshot.
        $category->update([
            'form_schema' => [['key' => 'property_type', 'label' => 'Property type', 'type' => 'text', 'required' => true]],
            'form_schema_version' => 4,
        ]);
        $this->assertEquals($this->schema(), $request->fresh()->form_schema_snapshot);
    }
}
