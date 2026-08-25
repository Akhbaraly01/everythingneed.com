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
            // Detail view: conversation thread (internal notes pre-filtered
            // by the controller for non-staff viewers).
            'messages' => $this->whenLoaded('messages', fn () => $this->messages->map(fn ($m) => [
                'id' => $m->id,
                'sender_id' => $m->sender_id,
                'message' => $m->message,
                'is_internal' => (bool) $m->is_internal,
                'created_at' => $m->created_at,
            ])),
            'satisfaction_rating' => $this->satisfaction_rating ?? null,
            'escalated_at' => $this->escalated_at ?? null,
            'created_at' => $this->created_at,
        ];
    }
}
