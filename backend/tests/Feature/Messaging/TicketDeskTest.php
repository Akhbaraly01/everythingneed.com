<?php

namespace Tests\Feature\Messaging;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Modules\Messaging\Entities\Ticket;
use Tests\TestCase;

class TicketDeskTest extends TestCase
{
    use RefreshDatabase;

    private function makeTicket(): array
    {
        $owner = User::factory()->create();
        $ticket = Ticket::create([
            'user_id' => $owner->id,
            'ticket_number' => 'TK-C-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5)),
            'subject' => 'Refund question',
            'description' => 'Where is my refund?',
            'priority' => 'medium',
            'status' => 'open',
        ]);

        return [$owner, $ticket];
    }

    private function staff(string $role = 'customer_service'): User
    {
        $u = User::factory()->create();
        UserRole::create(['user_id' => $u->id, 'role' => $role]);

        return $u;
    }

    public function test_internal_notes_hidden_from_owner_and_visible_to_staff(): void
    {
        [$owner, $ticket] = $this->makeTicket();
        $agent = $this->staff();

        // Agent files an internal note
        $this->actingAs($agent)->postJson("/api/tickets/{$ticket->id}/reply", [
            'message' => 'Checked with finance — refund scheduled.',
            'is_internal' => true,
        ])->assertStatus(201);

        // Owner cannot file internal notes (flag stripped → public reply)
        $this->actingAs($owner)->postJson("/api/tickets/{$ticket->id}/reply", [
            'message' => 'Still waiting…',
            'is_internal' => true,
        ])->assertStatus(201);

        $ownerView = $this->actingAs($owner)->getJson("/api/tickets/{$ticket->id}");
        $ownerView->assertStatus(200);
        $messages = collect($ownerView->json('data.messages.data') ?? $ownerView->json('data.messages'));

        // Owner sees only the public messages — the internal note is absent
        $this->assertFalse($messages->contains(fn ($m) => str_contains($m['message'], 'finance')));

        $staffView = $this->actingAs($agent)->getJson("/api/tickets/{$ticket->id}");
        $staffMessages = collect($staffView->json('data.messages.data') ?? $staffView->json('data.messages'));
        $this->assertTrue($staffMessages->contains(fn ($m) => str_contains($m['message'], 'finance')));
    }

    public function test_status_changes_write_audit_events(): void
    {
        [$owner, $ticket] = $this->makeTicket();
        $agent = $this->staff();

        $this->actingAs($agent)
            ->patchJson("/api/tickets/{$ticket->id}/status", ['status' => 'in_progress'])
            ->assertStatus(200);

        $events = $this->actingAs($agent)->getJson("/api/tickets/{$ticket->id}/events");
        $events->assertStatus(200);

        $types = collect($events->json('data'))->pluck('event_type');
        $this->assertTrue($types->contains('status_changed'));
    }

    public function test_department_transfer_is_audited_with_from_to(): void
    {
        [, $ticket] = $this->makeTicket();
        $agent = $this->staff();
        $deptId = (string) \Illuminate\Support\Str::uuid();

        \Illuminate\Support\Facades\DB::table('departments')->insert([
            'id' => $deptId,
            'name' => 'Billing',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($agent)
            ->postJson("/api/tickets/{$ticket->id}/assign-department", ['department_id' => $deptId])
            ->assertStatus(200);

        $events = collect($this->actingAs($agent)->getJson("/api/tickets/{$ticket->id}/events")->json('data'));
        $transfer = $events->firstWhere('event_type', 'department_transferred');
        $this->assertNotNull($transfer);
        $this->assertEquals($deptId, $transfer['payload']['to']);
    }

    public function test_escalation_sets_urgent_once_and_audits(): void
    {
        [$owner, $ticket] = $this->makeTicket();
        $agent = $this->staff();

        $esc = $this->actingAs($agent)->postJson("/api/tickets/{$ticket->id}/escalate", [
            'reason' => 'SLA breach',
        ]);
        $esc->assertStatus(200);
        $this->assertEquals('urgent', $esc->json('data.priority'));
        $this->assertNotNull($esc->json('data.escalated_at'));

        // Double escalation rejected
        $this->actingAs($agent)->postJson("/api/tickets/{$ticket->id}/escalate")
            ->assertStatus(422);

        $events = collect($this->actingAs($agent)->getJson("/api/tickets/{$ticket->id}/events")->json('data'));
        $this->assertEquals(1, $events->where('event_type', 'escalated')->count());
    }

    public function test_satisfaction_only_by_owner_after_resolution_once(): void
    {
        [$owner, $ticket] = $this->makeTicket();
        $agent = $this->staff();

        // Not resolvable yet
        $this->actingAs($owner)->postJson("/api/tickets/{$ticket->id}/satisfaction", ['rating' => 5])
            ->assertStatus(422);

        $this->actingAs($agent)->patchJson("/api/tickets/{$ticket->id}/status", ['status' => 'resolved']);

        // Stranger blocked
        $stranger = User::factory()->create();
        $this->actingAs($stranger)->postJson("/api/tickets/{$ticket->id}/satisfaction", ['rating' => 1])
            ->assertStatus(403);

        $rate = $this->actingAs($owner)->postJson("/api/tickets/{$ticket->id}/satisfaction", [
            'rating' => 5,
            'comment' => 'Fast and clear',
        ]);
        $rate->assertStatus(200);
        $this->assertEquals(5, $rate->json('data.satisfaction_rating'));

        // Double rating blocked
        $this->actingAs($owner)->postJson("/api/tickets/{$ticket->id}/satisfaction", ['rating' => 1])
            ->assertStatus(409);
    }
}
