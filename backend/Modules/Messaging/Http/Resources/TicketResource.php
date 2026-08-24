<?php

namespace Modules\Messaging\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class TicketResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'ticket_number' => $this->ticket_number,
            'subject' => $this->subject,
            'message' => $this->first_message?->message,
            'priority' => $this->priority,
            'status' => $this->status,
            'department' => [
                'id' => $this->department?->id,
                'name' => $this->department?->name,
            ],
            'messages_count' => $this->messages_count ?? $this->messages->count(),
            'created_at' => $this->created_at,
        ];
    }
}
