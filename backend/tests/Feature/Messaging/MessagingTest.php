<?php

namespace Tests\Feature\Messaging;

use Tests\TestCase;
use App\Models\User;
use Modules\Messaging\Entities\Ticket;
use Modules\Messaging\Entities\TicketMessage;
use Modules\Messaging\Entities\Department;

class MessagingTest extends TestCase
{
    private function createDepartment(array $attributes = []): Department
    {
        return Department::create(array_merge([
            'name' => 'Support',
            'description' => 'General support department',
        ], $attributes));
    }

    private function createTicket(User $user, array $attributes = []): Ticket
    {
        return Ticket::create(array_merge([
            'user_id' => $user->id,
            'ticket_number' => 'TKT-' . strtoupper(uniqid()),
            'subject' => 'Test Subject',
            'description' => 'Test description',
            'priority' => 'medium',
            'status' => 'open',
        ], $attributes));
    }

    private function createTicketMessage(Ticket $ticket, User $sender, array $attributes = []): TicketMessage
    {
        return TicketMessage::create(array_merge([
            'ticket_id' => $ticket->id,
            'sender_id' => $sender->id,
            'message' => 'Test message',
            'is_internal' => false,
        ], $attributes));
    }

    public function test_authenticated_user_can_create_ticket(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Account Issue',
                'message' => 'I cannot access my account since yesterday.',
                'priority' => 'high',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Ticket created successfully']);

        $this->assertDatabaseHas('tickets', [
            'user_id' => $user->id,
            'subject' => 'Account Issue',
            'priority' => 'high',
            'status' => 'open',
        ]);
    }

    public function test_ticket_requires_subject(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'message' => 'This is my issue description.',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['subject']);
    }

    public function test_ticket_requires_message(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Payment Problem',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_unauthenticated_user_cannot_create_ticket(): void
    {
        $response = $this->postJson('/api/tickets', [
            'subject' => 'Unauthorized',
            'message' => 'This should fail.',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_list_own_tickets(): void
    {
        $user = $this->createUser();
        $this->createTicket($user, ['subject' => 'Ticket 1']);
        $this->createTicket($user, ['subject' => 'Ticket 2']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson('/api/tickets');

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [['id', 'ticket_number', 'subject', 'status']],
                'meta' => ['current_page', 'last_page', 'per_page', 'total'],
            ]);

        $this->assertCount(2, $response->json('data'));
    }

    public function test_user_only_sees_own_tickets(): void
    {
        $user1 = $this->createUser();
        $user2 = $this->createUser();

        $this->createTicket($user1, ['subject' => 'User1 Ticket']);
        $this->createTicket($user2, ['subject' => 'User2 Ticket']);

        $response = $this->actingAs($user1, 'sanctum')
            ->getJson('/api/tickets');

        $response->assertOk();
        $this->assertCount(1, $response->json('data'));
        $this->assertEquals('User1 Ticket', $response->json('data.0.subject'));
    }

    public function test_user_can_view_a_ticket(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user, ['subject' => 'My Issue']);

        $response = $this->actingAs($user, 'sanctum')
            ->getJson("/api/tickets/{$ticket->id}");

        $response->assertOk()
            ->assertJsonFragment(['subject' => 'My Issue']);
    }

    public function test_user_can_reply_to_ticket(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/tickets/{$ticket->id}/reply", [
                'message' => 'Additional information about my issue.',
            ]);

        $response->assertStatus(201)
            ->assertJsonFragment(['message' => 'Reply sent successfully']);

        $this->assertDatabaseHas('ticket_messages', [
            'ticket_id' => $ticket->id,
            'message' => 'Additional information about my issue.',
        ]);
    }

    public function test_reply_requires_message(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/tickets/{$ticket->id}/reply", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['message']);
    }

    public function test_unauthenticated_user_cannot_reply(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $response = $this->postJson("/api/tickets/{$ticket->id}/reply", [
            'message' => 'Should not work.',
        ]);

        $response->assertStatus(401);
    }

    public function test_user_can_close_own_ticket(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user, ['status' => 'open']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/tickets/{$ticket->id}/close");

        $response->assertOk()
            ->assertJsonFragment(['message' => 'Ticket closed successfully']);

        $ticket->refresh();
        $this->assertEquals('closed', $ticket->status);
    }

    public function test_ticket_number_is_auto_generated(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Auto Number Test',
                'message' => 'Testing auto-generated ticket number.',
            ]);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertNotNull($ticket->ticket_number);
        $this->assertStringStartsWith('TKT-', $ticket->ticket_number);
    }

    public function test_ticket_defaults_to_open_status(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Status Test',
                'message' => 'Checking default status.',
            ]);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertEquals('open', $ticket->status);
    }

    public function test_ticket_defaults_to_medium_priority(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Priority Test',
                'message' => 'Checking default priority.',
            ]);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertEquals('medium', $ticket->priority);
    }

    public function test_ticket_with_department(): void
    {
        $user = $this->createUser();
        $department = $this->createDepartment(['name' => 'Billing']);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Billing Question',
                'message' => 'I was charged incorrectly.',
                'department_id' => $department->id,
            ]);

        $response->assertStatus(201);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertEquals($department->id, $ticket->department_id);
    }

    public function test_ticket_initial_message_is_stored(): void
    {
        $user = $this->createUser();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Message Storage Test',
                'message' => 'This is the initial message body.',
            ]);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $messageCount = TicketMessage::where('ticket_id', $ticket->id)->count();
        $this->assertEquals(1, $messageCount);
    }

    public function test_multiple_replies_create_multiple_messages(): void
    {
        $user = $this->createUser();
        $ticket = $this->createTicket($user);

        $this->actingAs($user, 'sanctum');

        $this->postJson("/api/tickets/{$ticket->id}/reply", [
            'message' => 'First follow-up.',
        ])->assertStatus(201);

        $this->postJson("/api/tickets/{$ticket->id}/reply", [
            'message' => 'Second follow-up.',
        ])->assertStatus(201);

        $messageCount = TicketMessage::where('ticket_id', $ticket->id)->count();
        $this->assertEquals(2, $messageCount);
    }

    public function test_user_can_create_ticket_with_low_priority(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Low Priority',
                'message' => 'Minor issue, not urgent.',
                'priority' => 'low',
            ]);

        $response->assertStatus(201);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertEquals('low', $ticket->priority);
    }

    public function test_user_can_create_ticket_with_urgent_priority(): void
    {
        $user = $this->createUser();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/tickets', [
                'subject' => 'Urgent Issue',
                'message' => 'System is completely down!',
                'priority' => 'urgent',
            ]);

        $response->assertStatus(201);

        $ticket = Ticket::where('user_id', $user->id)->first();
        $this->assertEquals('urgent', $ticket->priority);
    }
}
