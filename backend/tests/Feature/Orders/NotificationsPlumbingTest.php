<?php

namespace Tests\Feature\Orders;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Modules\Orders\Events\OrderPlaced;
use Modules\Orders\Entities\Order;
use Modules\Orders\Entities\OrderCancelled as OrderCancelledEvent;
use Modules\Orders\Listeners\SendOrderConfirmation;
use Tests\TestCase;

class NotificationsPlumbingTest extends TestCase
{
    use RefreshDatabase;

    private function placeOrder(): Order
    {
        $vendorUser = User::factory()->create();
        UserRole::create(['user_id' => $vendorUser->id, 'role' => 'vendor_admin']);

        $order = Order::create([
            'user_id' => User::factory()->create()->id,
            'order_number' => 'ORD-EVT-' . strtoupper(substr(bin2hex(random_bytes(4)), 0, 6)),
            'status' => 'pending',
            'subtotal' => 100,
            'total_amount' => 110,
            'currency' => 'USD',
            'shipping_address' => '1 Test Way',
            'shipping_city' => 'Springfield',
            'shipping_country' => 'Ghana',
        ]);

        return $order;
    }

    public function test_order_placed_event_notifies_customer_and_queues_receipt(): void
    {
        Mail::fake();

        $order = $this->placeOrder();
        $customerEmail = \App\Models\User::find($order->user_id)->email;

        (new SendOrderConfirmation())->handle(new OrderPlaced($order));

        // In-app notification created
        $this->assertDatabaseHas('notifications', [
            'user_id' => $order->user_id,
            'title' => 'Order confirmed',
            'type' => 'order',
            'related_id' => $order->id,
        ]);

        // Receipt mail queued for the customer
        Mail::assertSent(
            \Modules\Orders\Mail\OrderConfirmationMail::class,
            fn (\Modules\Orders\Mail\OrderConfirmationMail $mail) => $mail->hasTo($customerEmail),
        );
    }

    public function test_ticket_creation_alerts_customer_service_agents(): void
    {
        $agentA = User::factory()->create();
        UserRole::create(['user_id' => $agentA->id, 'role' => 'customer_service']);
        $agentB = User::factory()->create();
        UserRole::create(['user_id' => $agentB->id, 'role' => 'support_staff']);
        $bystander = User::factory()->create();
        UserRole::create(['user_id' => $bystander->id, 'role' => 'user']);

        $reporter = User::factory()->create();
        $ticket = \Modules\Messaging\Entities\Ticket::create([
            'user_id' => $reporter->id,
            'ticket_number' => 'TK-EVT-1',
            'subject' => 'Broken widget',
            'description' => 'It broke.',
            'priority' => 'high',
            'status' => 'open',
        ]);

        (new \Modules\Messaging\Listeners\NotifyDepartmentOfTicket())
            ->handle(new \Modules\Messaging\Events\TicketCreated($ticket));

        foreach ([$agentA, $agentB] as $agent) {
            $this->assertDatabaseHas('notifications', [
                'user_id' => $agent->id,
                'title' => 'New support ticket',
                'related_id' => $ticket->id,
            ]);
        }

        $this->assertDatabaseMissing('notifications', [
            'user_id' => $bystander->id,
            'related_id' => $ticket->id,
        ]);
    }
}
