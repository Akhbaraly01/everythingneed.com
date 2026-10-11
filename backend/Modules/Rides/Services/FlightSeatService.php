<?php

namespace Modules\Rides\Services;

use Core\Services\BaseService;
use Core\Services\Contracts\FlightSeatInterface;
use Illuminate\Support\Facades\DB;

class FlightSeatService extends BaseService implements FlightSeatInterface
{
    public function releaseSeats(string $flightId, int $seats): bool
    {
        $affected = DB::table('flights')
            ->where('id', $flightId)
            ->lockForUpdate()
            ->increment('seats_available', $seats);

        return (bool) $affected;
    }
}
