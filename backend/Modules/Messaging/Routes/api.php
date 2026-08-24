<?php

use Illuminate\Support\Facades\Route;
use Modules\Messaging\Http\Controllers\ChatController;
use Modules\Messaging\Http\Controllers\TicketController;

Route::prefix('api')->group(function () {
    Route::middleware('auth:sanctum')->group(function () {
        // Support tickets
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::post('/tickets/{id}/reply', [TicketController::class, 'reply']);
        Route::patch('/tickets/{id}/status', [TicketController::class, 'updateStatus']);
        Route::post('/tickets/{id}/assign-department', [TicketController::class, 'assignDepartment']);
        Route::post('/tickets/{id}/close', [TicketController::class, 'close']);

        // Direct chat
        Route::get('/chat/conversations', [ChatController::class, 'conversations']);
        Route::post('/chat/conversations', [ChatController::class, 'findOrCreate']);
        Route::get('/chat/{conversationId}/messages', [ChatController::class, 'messages']);
        Route::post('/chat/{conversationId}/messages', [ChatController::class, 'send']);
    });
});