<?php

use Illuminate\Support\Facades\Route;
use Modules\Messaging\Http\Controllers\ChatController;
use Modules\Messaging\Http\Controllers\TicketController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        // Support tickets
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store'])
            ->middleware('throttle:10,1');
        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::post('/tickets/{id}/reply', [TicketController::class, 'reply'])
            ->middleware('throttle:30,1');
        Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
        Route::post('/tickets/{id}/assign-department', [TicketController::class, 'assignDepartment']);
        Route::post('/tickets/{id}/close', [TicketController::class, 'close']);
        Route::post('/tickets/{id}/escalate', [TicketController::class, 'escalate']);
        Route::post('/tickets/{id}/satisfaction', [TicketController::class, 'satisfaction']);
        Route::get('/tickets/{id}/events', [TicketController::class, 'events']);

        // Direct chat
        Route::get('/chat/users', [ChatController::class, 'users']);
        Route::get('/chat/conversations', [ChatController::class, 'conversations']);
        Route::post('/chat/conversations', [ChatController::class, 'findOrCreate'])
            ->middleware('throttle:30,1');
        Route::get('/chat/{conversationId}/messages', [ChatController::class, 'messages']);
        Route::post('/chat/{conversationId}/messages', [ChatController::class, 'send'])
            ->middleware('throttle:60,1');
    });
});