<?php

use Illuminate\Support\Facades\Route;
use Modules\Authentication\Http\Controllers\AuthController;
use Modules\Authentication\Http\Controllers\PasswordResetController;

Route::prefix('api/auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register'])
        ->middleware(['throttle:10,1', 'turnstile']);
    Route::post('/login', [AuthController::class, 'login'])
        ->middleware(['throttle:10,1', 'turnstile']);
    Route::post('/otp/request', [AuthController::class, 'requestOtp'])
        ->middleware('throttle:6,1');
    Route::post('/otp/verify', [AuthController::class, 'verifyOtp'])
        ->middleware('throttle:10,1');
    Route::post('/otp/email/request', [AuthController::class, 'requestEmailOtp'])
        ->middleware('throttle:6,1');
    Route::post('/otp/email/verify', [AuthController::class, 'verifyEmailOtp'])
        ->middleware('throttle:10,1');
    Route::post('/2fa/login', [AuthController::class, 'verifyTwoFactorLogin'])
        ->middleware('throttle:10,1');

    // Password reset (log mailer locally; token also returned outside production)
    Route::post('/reset-password', [PasswordResetController::class, 'forgot'])
        ->middleware(['throttle:6,1', 'turnstile']);
    Route::post('/confirm-reset', [PasswordResetController::class, 'confirm'])
        ->middleware('throttle:10,1');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout'])
            ->middleware('throttle:30,1');
        Route::post('/change-password', [PasswordResetController::class, 'change'])
            ->middleware('throttle:6,1');
        Route::get('/user', [AuthController::class, 'user'])
            ->middleware('throttle:60,1');
        Route::get('/me', [AuthController::class, 'user'])
            ->middleware('throttle:60,1');
        Route::get('/session', [AuthController::class, 'session'])
            ->middleware('throttle:60,1');
        // Sessions page: list + revoke own tokens.
        Route::get('/tokens', [AuthController::class, 'tokens'])
            ->middleware('throttle:60,1');
        Route::delete('/tokens/{id}', [AuthController::class, 'revokeToken'])
            ->middleware('throttle:30,1');
        Route::delete('/tokens', [AuthController::class, 'revokeOtherTokens'])
            ->middleware('throttle:10,1');
        Route::post('/2fa/enable', [AuthController::class, 'enableTwoFactor'])
            ->middleware('throttle:10,1');
        Route::post('/2fa/verify', [AuthController::class, 'verifyTwoFactor'])
            ->middleware('throttle:10,1');
        Route::post('/2fa/disable', [AuthController::class, 'disableTwoFactor'])
            ->middleware('throttle:10,1');
    });
});