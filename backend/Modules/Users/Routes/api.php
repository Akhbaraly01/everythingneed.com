<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Http\Controllers\UserController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->middleware('role:super_admin');
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/addresses', [UserController::class, 'addAddress']);
    Route::get('/addresses', [UserController::class, 'indexAddresses']);
    Route::put('/addresses/{id}/default', [UserController::class, 'setDefaultAddress']);
    Route::delete('/addresses/{id}', [UserController::class, 'deleteAddress']);
    Route::get('/user/stats', [UserController::class, 'stats']);
    Route::delete('/account', [UserController::class, 'destroy']);
});