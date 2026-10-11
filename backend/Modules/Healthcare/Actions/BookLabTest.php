<?php

namespace Modules\Healthcare\Actions;

use Core\Exceptions\ValidationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Modules\Healthcare\Entities\LabBooking;
use Modules\Healthcare\Entities\LabTest;

class BookLabTest
{
    public function execute(array $data): LabBooking
    {
        // Spec 24: booking runs in one transaction with the test row locked so
        // two concurrent requests for the same slot serialize instead of
        // double-booking. The unique (lab_test_id, date, time) partial index
        // is the final backstop against a raced insert.
        return DB::transaction(function () use ($data) {
            $test = LabTest::where('id', $data['lab_test_id'])->lockForUpdate()->first();
            if (!$test) {
                throw new ValidationException('Lab test not found');
            }
            if (!$test->is_active) {
                throw new ValidationException('This lab test is not currently available');
            }

            $clash = LabBooking::where('lab_test_id', $test->id)
                ->where('appointment_date', $data['appointment_date'])
                ->where('appointment_time', $data['appointment_time'])
                ->where('status', '!=', LabBooking::STATUS_CANCELLED)
                ->exists();
            if ($clash) {
                throw new ValidationException('That time slot is already booked for this test');
            }

            try {
                return LabBooking::create([
                    'patient_id' => $data['patient_id'],
                    'lab_test_id' => $test->id,
                    'booking_number' => $this->generateBookingNumber(),
                    'appointment_date' => $data['appointment_date'],
                    'appointment_time' => $data['appointment_time'],
                    'price' => $test->price,
                    'status' => LabBooking::STATUS_PENDING,
                    'notes' => $data['notes'] ?? null,
                ]);
            } catch (QueryException $e) {
                if ((string) ($e->errorInfo[0] ?? '') === '23505') {
                    throw new ValidationException('That time slot is already booked for this test');
                }

                throw $e;
            }
        });
    }

    private function generateBookingNumber(): string
    {
        return 'LB-' . strtoupper(Str::random(8));
    }
}
