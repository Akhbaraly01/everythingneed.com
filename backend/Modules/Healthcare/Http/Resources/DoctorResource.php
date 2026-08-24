<?php

namespace Modules\Healthcare\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class DoctorResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'specialization' => $this->specialization,
            'qualification' => $this->qualification,
            'experience_years' => $this->experience_years,
            'consultation_fee' => $this->consultation_fee,
            'virtual_fee' => $this->virtual_fee,
            'avatar_url' => $this->avatar_url,
            'is_available' => $this->is_available,
            'rating' => $this->rating,
            'created_at' => $this->created_at,
        ];
    }
}
