<?php

namespace Modules\Healthcare\Services;

use Modules\Healthcare\Actions\BookAppointment;
use Modules\Healthcare\Actions\CancelAppointment;
use Modules\Healthcare\Actions\AssignDoctor;
use Modules\Healthcare\Actions\StartConsultation;
use Modules\Healthcare\Actions\CompleteConsultation;
use Modules\Healthcare\Actions\CreateDoctor;
use Modules\Healthcare\Entities\HealthTicket;
use Modules\Healthcare\Entities\Doctor;

class HealthcareService
{
    public function __construct(
        private BookAppointment $bookAppointment,
        private CancelAppointment $cancelAppointment,
        private AssignDoctor $assignDoctor,
        private StartConsultation $startConsultation,
        private CompleteConsultation $completeConsultation,
        private CreateDoctor $createDoctor,
    ) {}

    public function bookAppointment(array $data): object
    {
        return $this->bookAppointment->execute($data);
    }

    public function cancelAppointment(string $ticketId, ?string $reason = null): void
    {
        $this->cancelAppointment->execute($ticketId, $reason);
    }

    public function assignDoctor(string $ticketId, string $doctorId): void
    {
        $this->assignDoctor->execute($ticketId, $doctorId);
    }

    public function startConsultation(string $ticketId): void
    {
        $this->startConsultation->execute($ticketId);
    }

    public function completeConsultation(string $ticketId, array $data): void
    {
        $this->completeConsultation->execute($ticketId, $data);
    }

    public function createDoctor(array $data): object
    {
        return $this->createDoctor->execute($data);
    }

    public function getTicket(string $ticketId): ?HealthTicket
    {
        return HealthTicket::with(['doctor', 'patient'])->find($ticketId);
    }

    public function getPatientTickets(string $patientId, int $page = 1, int $perPage = 15): object
    {
        return HealthTicket::with(['doctor'])
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getDoctors(string $specialization = null, int $page = 1, int $perPage = 15, ?string $q = null, ?string $profession = null, ?bool $virtual = null): object
    {
        $query = Doctor::query();

        if ($specialization) {
            $query->where('specialization', $specialization);
        }

        if ($profession) {
            $query->where('profession', $profession);
        }

        if ($virtual) {
            $query->whereNotNull('virtual_fee')->where('virtual_fee', '>', 0);
        }

        if (is_string($q) && trim($q) !== '') {
            $like = '%'.trim($q).'%';
            $query->where(function ($scoped) use ($like) {
                $scoped->where('full_name', 'ilike', $like)
                    ->orWhere('specialization', 'ilike', $like)
                    ->orWhere('qualification', 'ilike', $like);
            });
        }

        return $query->orderBy('full_name')
            ->paginate($perPage, ['*'], 'page', $page);
    }

    public function getDoctor(string $doctorId): ?Doctor
    {
        return Doctor::find($doctorId);
    }
}
