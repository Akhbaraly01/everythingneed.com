<?php

namespace Database\Factories;

use Modules\Messaging\Entities\Ticket;
use Modules\Messaging\Entities\TicketMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class TicketFactory extends Factory
{
    protected $model = Ticket::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'ticket_number' => fake()->unique()->bothify('TKT-#####'),
            'subject' => fake()->sentence(),
            'priority' => 'normal',
            'status' => 'open',
        ];
    }

    public function closed(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'closed',
        ]);
    }
}
