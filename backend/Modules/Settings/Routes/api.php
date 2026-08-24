<?php

use Illuminate\Support\Facades\Route;
use Modules\Settings\Http\Controllers\SettingController;

Route::prefix('api')->group(function () {
    Route::get('/settings/public', [SettingController::class, 'publicIndex']);
});

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/settings', [SettingController::class, 'index']);
    Route::put('/settings', [SettingController::class, 'update']);
    Route::get('/settings/{key}', [SettingController::class, 'show']);
    Route::delete('/settings/{key}', [SettingController::class, 'destroy']);

    // Per-user settings (self or admin)
    Route::get('/users/{userId}/settings', [SettingController::class, 'indexForUser']);
    Route::put('/users/{userId}/settings', [SettingController::class, 'updateForUser']);
    Route::get('/users/{userId}/settings/{key}', [SettingController::class, 'showForUser']);
    Route::delete('/users/{userId}/settings/{key}', [SettingController::class, 'destroyForUser']);
});
