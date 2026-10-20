<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AppealController;
use App\Http\Controllers\Api\AutoTranslateController;

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
        'message' => 'EverythingNeed backend API is running. Open the app at '.config('app.frontend_url', 'http://127.0.0.1:8000').'.',
        'endpoints' => [
            'auth' => '/api/auth/login',
            'health' => '/api/health',
            'server_health' => '/up',
            'docs' => '/api',
        ],
    ]);
});

// Whole-page translation proxy (Path B). The client chunks visible text
// under the configured caps; the throttle protects provider quota.
Route::post('/i18n/auto-translate', AutoTranslateController::class)
    ->middleware('throttle:'.config('auto_translate.throttle', '120,1'));

Route::get('/health', function () {
    $checks = [
        'database' => 'ok',
        'timestamp' => now()->toIso8601String(),
    ];

    try {
        \Illuminate\Support\Facades\DB::connection()->getPdo();
        $checks['database'] = 'connected';
    } catch (\Exception $e) {
        // Never leak raw DB exception details to unauthenticated callers.
        \Illuminate\Support\Facades\Log::warning('Health check DB failure: '.$e->getMessage());
        $checks['database'] = 'error';
    }

    return response()->json([
        'status' => $checks['database'] === 'connected' ? 'operational' : 'degraded',
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

// Public CMS banners (homepage slider) — active only, no auth
Route::get('/cms/banners/public', function () {
    $banners = \Illuminate\Support\Facades\DB::table('cms_banners')
        ->where('is_active', true)
        ->whereNull('deleted_at')
        ->orderBy('sort_order')
        ->orderByDesc('created_at')
        ->limit(12)
        ->get(['id', 'title', 'image_url', 'link_url', 'position']);

    return response()->json(['data' => $banners]);
});

// Public CMS pages (published only)
Route::get('/cms/pages/public', function () {
    $pages = \Illuminate\Support\Facades\DB::table('cms_pages')
        ->where('status', 'published')
        ->whereNull('deleted_at')
        ->orderByDesc('updated_at')
        ->limit(50)
        ->get(['id', 'title', 'slug', 'content', 'updated_at']);

    return response()->json(['data' => $pages]);
});

Route::get('/cms/pages/public/{slug}', function (string $slug) {
    $page = \Illuminate\Support\Facades\DB::table('cms_pages')
        ->where('slug', $slug)
        ->where('status', 'published')
        ->whereNull('deleted_at')
        ->first(['id', 'title', 'slug', 'content', 'updated_at']);

    if (! $page) {
        return response()->json(['message' => 'Page not found'], 404);
    }

    return response()->json(['data' => $page]);
});

// Public blog (published only)
Route::get('/cms/blog/public', function () {
    $posts = \Illuminate\Support\Facades\DB::table('cms_blog_posts')
        ->where('status', 'published')
        ->whereNull('deleted_at')
        ->orderByDesc('published_at')
        ->limit(50)
        ->get(['id', 'title', 'slug', 'content', 'author', 'published_at']);

    return response()->json(['data' => $posts]);
});

// Public active announcements within their date window
Route::get('/cms/announcements/public', function () {
    $now = now();
    $announcements = \Illuminate\Support\Facades\DB::table('cms_announcements')
        ->where('is_active', true)
        ->whereNull('deleted_at')
        ->where(function ($q) use ($now) {
            $q->whereNull('starts_at')->orWhere('starts_at', '<=', $now);
        })
        ->where(function ($q) use ($now) {
            $q->whereNull('ends_at')->orWhere('ends_at', '>=', $now);
        })
        ->orderByRaw("case priority when 'high' then 0 when 'medium' then 1 else 2 end")
        ->orderByDesc('created_at')
        ->limit(20)
        ->get(['id', 'title', 'content', 'priority', 'starts_at', 'ends_at']);

    return response()->json(['data' => $announcements]);
});

// Public no-code modules (W3, published only, no auth - storefront content)
Route::get('/modules/{slug}', [\Modules\Admin\Http\Controllers\AdminDynamicModuleController::class, 'publicShow']);
Route::get('/modules/{slug}/entries', [\Modules\Admin\Http\Controllers\AdminDynamicModuleController::class, 'publicEntries']);

Route::get('/forms/{slug}', [\Modules\Admin\Http\Controllers\AdminCmsFormController::class, 'publicShow']);
Route::post('/forms/{slug}/submit', [\Modules\Admin\Http\Controllers\AdminCmsFormController::class, 'publicSubmit'])
    ->middleware('throttle:10,1');

/*
|--------------------------------------------------------------------------
| Table Gateway (Laravel data plane)
|--------------------------------------------------------------------------
| Generic, whitelisted table operations used by the frontend REST
| gateway. Every query is scoped to the authenticated owner.
*/

use App\Http\Controllers\Api\TableGatewayController;

Route::post('/ai/chat', [App\Http\Controllers\Api\AiController::class, 'chat'])
    ->middleware('throttle:10,1');

Route::post('/newsletter/subscribe', [App\Http\Controllers\Api\NewsletterController::class, 'subscribe'])
    ->middleware('throttle:10,1');

// Suspension appeals (plan Q): guest endpoint, heavily throttled,
// generic response (never discloses account existence).
Route::post('/appeals', [AppealController::class, 'store'])
    ->middleware('throttle:3,1');

Route::middleware('auth:sanctum')->prefix('newsletter')->group(function () {
    Route::get('/subscriptions', [App\Http\Controllers\Api\NewsletterController::class, 'index'])
        ->middleware('role:super_admin,administrator,content_manager,cms_editor,content_admin');
});

Route::middleware(['auth:sanctum'])->prefix('db')->group(function () {
    Route::get('/{table}', [TableGatewayController::class, 'index']);
    Route::post('/{table}', [TableGatewayController::class, 'store']);
    Route::put('/{table}/{id}', [TableGatewayController::class, 'update']);
    Route::patch('/{table}/{id}', [TableGatewayController::class, 'update']);
    Route::delete('/{table}/{id}', [TableGatewayController::class, 'destroy']);
});

// ─── Payment webhooks (provider → platform) ──────────────────────────────────
Route::post('/webhooks/payments/stripe', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'stripe'])
    ->middleware('throttle:60,1');
Route::post('/webhooks/payments/paypal', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'paypal'])
    ->middleware('throttle:60,1');
Route::post('/webhooks/payments/paystack', [\App\Http\Controllers\Api\PaymentWebhookController::class, 'paystack'])
    ->middleware('throttle:60,1');

// ─── KYC ──────────────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->prefix('kyc')->group(function () {
    Route::get('/', [\App\Http\Controllers\Api\KycController::class, 'show']);
    Route::get('/documents/{side}', [\App\Http\Controllers\Api\KycController::class, 'document']);
    Route::get('/documents/{side}/signed-url', [\App\Http\Controllers\Api\KycController::class, 'documentSignedUrl']);
    Route::post('/submit', [\App\Http\Controllers\Api\KycController::class, 'submit'])
        ->middleware('throttle:10,1');
    Route::post('/{id}/review', [\App\Http\Controllers\Api\KycController::class, 'review'])
        ->middleware('permission:kyc.applications.review');
    Route::get('/{id}/documents/{side}', [\App\Http\Controllers\Api\KycController::class, 'reviewDocument'])
        ->middleware('permission:kyc.applications.review');
    Route::get('/{id}/documents/{side}/signed-url', [\App\Http\Controllers\Api\KycController::class, 'reviewDocumentSignedUrl'])
        ->middleware('permission:kyc.applications.review');
});
