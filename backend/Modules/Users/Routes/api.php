<?php

use Illuminate\Support\Facades\Route;
use Modules\Users\Http\Controllers\UserController;

Route::prefix('api')->middleware('auth:sanctum')->group(function () {
    Route::get('/users', [UserController::class, 'index'])->middleware('role:super_admin');
    Route::get('/users/{id}', [UserController::class, 'show']);
    Route::put('/profile', [UserController::class, 'updateProfile']);
    Route::post('/addresses', [UserController::class, 'addAddress']);
    Route::delete('/account', [UserController::class, 'destroy']);
});