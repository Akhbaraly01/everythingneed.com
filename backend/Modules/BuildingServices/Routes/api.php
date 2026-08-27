<?php

namespace Modules\BuildingServices\Routes;

use Illuminate\Support\Facades\Route;
use Modules\BuildingServices\Http\Controllers\BuildingServiceController;

Route::prefix('api')->group(function () {
    Route::get('/building-services', [BuildingServiceController::class, 'index']);
    Route::get('/building-services/workers/{id}', function (string $id) {
        $w = \Modules\BuildingServices\Entities\ServiceWorker::find($id); if (!$w) return response()->json(['message' => 'Worker not found'], 404); return response()->json(['data' => $w]);
    });
    Route::get('/building-services/workers', function (\Illuminate\Http\Request $request) {
        $q = \Modules\BuildingServices\Entities\ServiceWorker::query(); if ($t = $request->get('type')) $q->where('worker_type', $t); return response()->json(['data' => $q->where('is_available', true)->limit(20)->get()]);
    });
    Route::get('/building-services/{id}', [BuildingServiceController::class, 'show']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/building-services/book', [BuildingServiceController::class, 'store']);
        Route::post('/building-services/bookings', [BuildingServiceController::class, 'store']);
        Route::get('/building-services/my-bookings', [BuildingServiceController::class, 'myBookings']);
        Route::get('/building-services/bookings', function (\Illuminate\Http\Request $request) {
            $bookings = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('user_id', $request->user()->id)->orderByDesc('created_at')->get(); return response()->json(['data' => $bookings]);
        });
        Route::get('/building-services/bookings/{id}', function (string $id, \Illuminate\Http\Request $request) {
            $b = \Modules\BuildingServices\Entities\BuildingServiceBooking::where('user_id', $request->user()->id)->find($id); if (!$b) return response()->json(['message' => 'Booking not found'], 404); return response()->json(['data' => $b]);
        });
    });
});
