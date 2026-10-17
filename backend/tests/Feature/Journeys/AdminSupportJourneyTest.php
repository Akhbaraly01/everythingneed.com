<?php

namespace Tests\Feature\Journeys;

use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AdminSupportJourneyTest extends TestCase
{
    private function openTicket(string $subject = 'Order never arrived'): string
    {
        $customer = $this->createUser();
        $this->actingAs($customer, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => $subject,
                'message' => 'My package is missing since Tuesday.',
                'priority' => 'urgent',
            ])
            ->assertStatus(201);

        return (string) DB::table('tickets')->where('user_id', $customer->id)->value('id');
    }

    public function test_support_console_list_filters_and_assigns_over_http(): void
    {
        $ticketId = $this->openTicket();

        // Admin lists the queue via the support console API
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');
        $list = $this->getJson('/api/admin/support/tickets')->assertOk();
        $this->assertContains($ticketId, array_column($list->json('data'), 'id'));
        $this->assertArrayHasKey('total', $list->json());

        // Filters: valid values pass, invalid values 422
        $this->getJson('/api/admin/support/tickets?status=pending')->assertOk();
        $this->getJson('/api/admin/support/tickets?priority=all&page=1')->assertOk();
        $this->getJson('/api/admin/support/tickets?search=missing')->assertOk();
        $this->getJson('/api/admin/support/tickets?status=bogus')->assertStatus(422);
        $this->getJson('/api/admin/support/tickets?priority=bogus')->assertStatus(422);

        // Assign to an agent
        $agent = $this->createUser();
        $this->patchJson("/api/admin/support/tickets/{$ticketId}/assign", ['assigned_to' => $agent->id])
            ->assertOk()
            ->assertJsonFragment(['message' => 'Ticket assigned successfully']);
        $this->assertDatabaseHas('tickets', ['id' => $ticketId, 'assigned_to' => $agent->id]);

        // Assign requires a valid user
        $this->patchJson("/api/admin/support/tickets/{$ticketId}/assign", [])->assertStatus(422);

        // A plain user may not touch the console
        $stranger = $this->createUser();
        $this->actingAs($stranger, 'sanctum');
        $this->getJson('/api/admin/support/tickets')->assertStatus(403);
        $this->patchJson("/api/admin/support/tickets/{$ticketId}/assign", ['assigned_to' => $stranger->id])
            ->assertStatus(403);
    }

    public function test_support_console_filters_are_validated(): void
    {
        $this->openTicket();
        $this->actingAsAdmin();

        $this->getJson('/api/admin/support/tickets?status=pending&priority=all&page=1')->assertOk();
        $this->getJson('/api/admin/support/tickets?status=bogus')->assertStatus(422);
        $this->getJson('/api/admin/support/tickets?priority=bogus')->assertStatus(422);
        $this->getJson('/api/admin/support/tickets?page=0')->assertStatus(422);
    }

    public function test_support_agent_role_can_use_the_console(): void
    {
        $ticketId = $this->openTicket();

        $agent = $this->createUser();
        $this->assignRole($agent, 'support_agent');
        $this->actingAs($agent, 'sanctum');

        $this->getJson('/api/admin/support/tickets')->assertOk();
        $this->patchJson("/api/admin/support/tickets/{$ticketId}/assign", ['assigned_to' => $agent->id])
            ->assertOk();
    }

    public function test_support_agents_endpoint_serves_the_assignee_picker(): void
    {
        // Support staff hold manageSupport but NOT the users console's
        // manageUsers policy - the picker has its own lightweight endpoint.
        $caller = $this->createUser();
        $this->assignRole($caller, 'support_agent');

        $colleague = $this->createUser(['name' => 'Ada Agent']);
        $this->assignRole($colleague, 'support_admin');

        $suspended = $this->createUser(['name' => 'Sam Suspended']);
        $this->assignRole($suspended, 'support_agent');
        DB::table('users')->where('id', $suspended->id)->update(['suspended_at' => now()]);

        $plain = $this->createUser();

        $this->actingAs($caller, 'sanctum');
        $res = $this->getJson('/api/admin/support/agents')->assertOk();
        $ids = array_column($res->json('data'), 'id');

        $this->assertContains($colleague->id, $ids);
        $this->assertNotContains($suspended->id, $ids, 'suspended staff must not be assignable');
        $this->assertNotContains($plain->id, $ids, 'plain users are not agents');
        // Payload stays minimal: id/name/email only.
        $this->assertSame(['id', 'name', 'email'], array_keys($res->json('data.0')));

        // Plain users may not enumerate staff.
        $this->actingAs($plain, 'sanctum');
        $this->getJson('/api/admin/support/agents')->assertStatus(403);
    }
}
