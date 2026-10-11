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
            'profession' => $this->profession,
            'qualification' => $this->qualification,
            'experience_years' => $this->experience_years,
            'consultation_fee' => $this->consultation_fee,
            'virtual_fee' => $this->virtual_fee,
            'home_visit_fee' => $this->home_visit_fee,
            'avatar_url' => $this->avatar_url,
            'is_available' => $this->is_available,
            'rating' => $this->rating,
            'created_at' => $this->created_at,
            // Presentation aliases: doctor cards/profiles read
            // name/specialty/image_url (see HealthcarePageController::
            // presentDoctor), the table stores full_name/specialization.
            'name' => $this->full_name,
            'specialty' => $this->specialization,
            'bio' => $this->qualification,
            'image_url' => $this->avatar_url,
            'years_experience' => $this->experience_years,
        ];
    }
}
