<?php

use Illuminate\Support\Facades\Route;
use Modules\Authentication\Http\Controllers\AuthController;

Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/otp/request', [AuthController::class, 'requestOtp']);
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp']);
    Route::post('/2fa/login', [AuthController::class, 'verifyTwoFactorLogin']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/user', [AuthController::class, 'user']);
        Route::get('/me', [AuthController::class, 'user']);
        Route::get('/session', [AuthController::class, 'session']);
        Route::post('/2fa/enable', [AuthController::class, 'enableTwoFactor']);
        Route::post('/2fa/verify', [AuthController::class, 'verifyTwoFactor']);
    });
});