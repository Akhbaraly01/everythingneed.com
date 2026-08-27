<?php

use Illuminate\Support\Facades\Route;
use Modules\Reviews\Http\Controllers\ReviewController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/reviews', [ReviewController::class, 'store']);
        Route::put('/reviews/{id}', [ReviewController::class, 'update']);
        Route::delete('/reviews/{id}', [ReviewController::class, 'destroy']);
        Route::get('/reviews/mine', function (\Illuminate\Http\Request $request) {
            $reviews = \Modules\Reviews\Entities\Review::where('user_id', $request->user()->id)->orderByDesc('created_at')->get();
            return response()->json(['data' => $reviews]);
        });
    });

    // Public read
    Route::get('/reviews', [ReviewController::class, 'index']);
});
