<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DepartmentAdminTest extends TestCase
{
    use RefreshDatabase;

    private function admin(string $role = 'administrator'): User
    {
        $user = User::factory()->create();
        \App\Models\UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    public function test_admin_can_create_update_and_list_departments(): void
    {
        $admin = $this->admin();

        $create = $this->actingAs($admin)->postJson('/api/admin/departments', [
            'name' => 'Billing',
            'description' => 'Payment disputes and refunds routing',
        ]);
        $create->assertStatus(201);
        $id = $create->json('data.id');

        $this->actingAs($admin)->putJson("/api/admin/departments/{$id}", [
            'description' => 'Updated description',
        ])->assertStatus(200);

        // Duplicate name is rejected
        $this->actingAs($admin)->postJson('/api/admin/departments', ['name' => 'Billing'])
            ->assertStatus(422);

        $list = $this->actingAs($admin)->getJson('/api/admin/departments');
        $list->assertStatus(200);
        $row = collect($list->json('data'))->firstWhere('id', $id);
        $this->assertEquals('Updated description', $row['description']);
    }

    public function test_department_in_use_cannot_be_deleted(): void
    {
        $admin = $this->admin();
        $id = (string) \Illuminate\Support\Str::uuid();

        DB::table('departments')->insert([
            'id' => $id,
            'name' => 'In Use Dept',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('tickets')->insert([
            'id' => (string) \Illuminate\Support\Str::uuid(),
            'user_id' => $admin->id,
            'ticket_number' => 'TK-TEST',
            'subject' => 'Test ticket',
            'description' => 'Ticket body',
            'priority' => 'low',
            'status' => 'open',
            'department_id' => $id,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/departments/{$id}")
            ->assertStatus(422);
    }

    public function test_regular_users_are_forbidden(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user)
            ->getJson('/api/admin/departments')
            ->assertStatus(403);

        $this->actingAs($user)
            ->postJson('/api/admin/departments', ['name' => 'Nope'])
            ->assertStatus(403);
    }
}
