<?php

use Illuminate\Support\Facades\Route;
use Modules\Hotels\Http\Controllers\HotelController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/hotels/{id}/reserve', [HotelController::class, 'reserve']);
        Route::get('/hotels/reservations/mine', [HotelController::class, 'myReservations']);
        Route::post('/hotels/reservations/{id}/cancel', [HotelController::class, 'cancelReservation']);
        Route::post('/hotels/reservations/{id}/check-in', [HotelController::class, 'checkIn']);
        Route::post('/hotels/reservations/{id}/check-out', [HotelController::class, 'checkOut']);
    });

    // Public reads
    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{id}/rooms/{roomId}', function (string $id, string $roomId) {
        $hotel = \Modules\Hotels\Entities\Hotel::find($id); if (!$hotel) return response()->json(['message' => 'Hotel not found'], 404);
        $room = \Modules\Hotels\Entities\HotelRoom::where('hotel_id', $id)->find($roomId); if (!$room) return response()->json(['message' => 'Room not found'], 404);
        return response()->json(['data' => ['hotel' => $hotel, 'room' => $room]]);
    });
    Route::get('/hotels/{id}', [HotelController::class, 'show']);
    Route::get('/hotels/{id}/rooms', [HotelController::class, 'rooms']);
});
