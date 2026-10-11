<?php

namespace Core\Services\Contracts;

/**
 * Flight seat inventory commands used across module boundaries
 * (Bookings releases seats when a booking is cancelled).
 * Implemented by\Modules\Rides.
 */
interface FlightSeatInterface
{
    /** Release $seats back to a flight. Returns false when the flight is missing. */
    public function releaseSeats(string $flightId, int $seats): bool;
}
