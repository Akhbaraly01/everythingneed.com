<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Root API endpoint, health check, and authenticated user route.
| Module routes are self-registered by each module's ServiceProvider.
|
*/

Route::get('/', function () {
    return response()->json([
        'name' => config('app.name'),
        'version' => '1.0.0',
        'status' => 'operational',
        'type' => 'api_index',
        'message' => 'EverythingNeed backend API is running. Use the frontend at '.config('app.frontend_url', 'http://127.0.0.1:8080').'.',
        'endpoints' => [
            'auth' => '/api/auth/login',
            'health' => '/api/health',
            'server_health' => '/up',
            'docs' => '/api',
        ],
    ]);
});

Route::get('/health', function () {
    $checks = [
        'app' => config('app.name'),
        'environment' => config('app.env'),
        'debug' => config('app.debug'),
        'php' => phpversion(),
        'laravel' => app()->version(),
        'database' => 'ok',
        'cache' => config('cache.default'),
        'queue' => config('queue.default'),
        'session' => config('session.driver'),
        'frontend' => config('app.frontend_url', 'http://127.0.0.1:8080'),
        'timestamp' => now()->toIso8601String(),
    ];

    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $checks['database'] = 'connected';
    } catch (\Exception $e) {
        $checks['database'] = 'disconnected: ' . $e->getMessage();
    }

    return response()->json([
        'status' => 'operational',
        'service' => 'EverythingNeed API',
        'version' => '1.0.0',
        'checks' => $checks,
    ]);
});

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json([
        'data' => [
            'user' => $request->user(),
        ],
    ]);
});

/*
|--------------------------------------------------------------------------
| Table Gateway (Laravel data plane)
|--------------------------------------------------------------------------
| Generic, whitelisted table operations used by the frontend REST
| gateway. Every query is scoped to the authenticated owner.
*/

use App\Http\Controllers\Api\TableGatewayController;

Route::middleware(['auth:sanctum'])->prefix('db')->group(function () {
    Route::get('/{table}', [TableGatewayController::class, 'index']);
    Route::post('/{table}', [TableGatewayController::class, 'store']);
    Route::put('/{table}/{id}', [TableGatewayController::class, 'update']);
    Route::patch('/{table}/{id}', [TableGatewayController::class, 'update']);
    Route::delete('/{table}/{id}', [TableGatewayController::class, 'destroy']);
});
