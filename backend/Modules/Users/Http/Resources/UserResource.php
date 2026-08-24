<?php

namespace Modules\Users\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'email' => $this->email,
            'profile' => [
                'full_name' => $this->profile?->full_name,
                'phone' => $this->profile?->phone,
                'avatar_url' => $this->profile?->avatar_url,
            ],
            'roles' => $this->roles->pluck('role'),
            'wallet' => [
                'balance' => $this->wallet?->balance,
                'currency' => $this->wallet?->currency,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
