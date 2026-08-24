<?php

namespace App\Domain\Events;

interface ShouldBroadcast
{
    public function broadcastOn(): string;
    public function broadcastAs(): string;
}
