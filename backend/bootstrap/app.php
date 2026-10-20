<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
    )
    ->withBroadcasting(
        __DIR__.'/../routes/channels.php',
        ['prefix' => 'api', 'middleware' => ['api', 'auth:sanctum']],
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Multilingual Phase 0: the `locale` cookie is a non-sensitive UI
        // preference read by the pre-paint script and written directly by
        // client JS, so it must stay plain (encrypted cookies written from
        // the client are undecryptable and get dropped server-side).
        $middleware->encryptCookies(except: ['locale']);

        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'permission' => \App\Http\Middleware\EnsureUserHasPermission::class,
            'verified.custom' => \App\Http\Middleware\EnsureEmailIsVerified::class,
            'audit' => \App\Http\Middleware\AuditLog::class,
            'turnstile' => \App\Http\Middleware\VerifyTurnstile::class,
        ]);

        $middleware->web(append: [
            \App\Http\Middleware\EnsureAccountActive::class,
            \App\Http\Middleware\ApplyUserLocale::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);

        $middleware->api(prepend: [
            \App\Http\Middleware\ValidateUuidParams::class,
        ]);

        $middleware->api(prepend: [
            \App\Http\Middleware\ForceJsonResponse::class,
        ]);

        $middleware->throttleApi();

        // Module routes register outside the core api group, so a global
        // route-independent limiter guarantees full coverage.
        $middleware->use([
            // Multilingual Phase 0: resolve request locale (cookie ->
            // Accept-Language -> default) before anything renders or
            // validates; account preference layers on in the web group.
            \App\Http\Middleware\SetLocale::class,
            \App\Http\Middleware\GlobalRateLimit::class,
            // Phase 5: tighter per-actor window for POST/PUT/PATCH/DELETE
            // under /api/* (reads keep the generous buckets).
            \App\Http\Middleware\MutatingRateLimit::class,
            \App\Http\Middleware\SecurityHeaders::class,
            // W16 (R-06/N-01): route-independent audit coverage for every
            // authenticated mutating request (admin + API). The middleware
            // itself filters to POST/PUT/PATCH/DELETE with a user.
            \App\Http\Middleware\AuditLog::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Backlog #2: private-attachment streams are browser fetches, not
        // Inertia navigations — a bad/expired signature must be a plain 403,
        // never the global web-context forbidden redirect.
        $exceptions->renderable(function (\Illuminate\Routing\Exceptions\InvalidSignatureException $e, $request) {
            if ($request->is('signed-storage/*')) {
                return response('Invalid signature.', 403);
            }

            return null;
        });

        $exceptions->renderable(function (\Symfony\Component\HttpKernel\Exception\NotFoundHttpException $e, $request) {
            if ($request->is('signed-storage/*')) {
                return response('Not Found.', 404);
            }

            return null;
        });

        $exceptions->renderable(function (\Illuminate\Database\QueryException $e, $request) {
            if (str_contains($e->getMessage(), 'invalid input syntax for type uuid')) {
                return response()->json([
                    'message' => 'Not Found',
                    'error' => 'The requested resource was not found.',
                    'path' => $request->path(),
                ], 404);
            }

            return null;
        });

        $exceptions->renderable(function (\Core\Exceptions\DomainException $e) {
            return method_exists($e, 'render')
                ? $e->render()
                : response()->json([
                    'message' => $e->getMessage(),
                    'error' => $e->getErrorCode(),
                ], $e->getStatusCode());
        });

        $exceptions->renderable(function (Throwable $e, $request) {
            // Exceptions defining their own render() take precedence
            if (method_exists($e, 'render')) {
                return null;
            }

            if ($e instanceof AuthenticationException) {
                // Web context: let Laravel redirect guests to route('login').
                if (!$request->expectsJson() && !($request->is('api/*'))) {
                    return null;
                }

                return response()->json([
                    'message' => 'Unauthenticated',
                    'error' => 'Please log in.',
                ], 401);
            }

            if ($e instanceof ValidationException) {
                // Web context: standard redirect-back-with-errors behaviour.
                if (!$request->expectsJson() && !($request->is('api/*'))) {
                    return null;
                }

                return response()->json([
                    'message' => 'Validation Error',
                    'errors' => $e->errors(),
                ], 422);
            }

            // abort(403) throws plain HttpException; AccessDeniedHttpException
            // is thrown by explicit throwers — cover both as web 403.
            if ($e instanceof AccessDeniedHttpException
                || ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException
                    && $e->getStatusCode() === 403)) {
                // Web context: redirect guests to login; authenticated users
                // land on their own workspace (never back onto the forbidden
                // URL itself, which would self-loop on direct entries).
                if (!$request->expectsJson() && !($request->is('api/*'))) {
                    if (!$request->user()) {
                        return redirect()->guest(route('login'));
                    }

                    try {
                        $landing = app(\Core\Services\Contracts\WorkspaceResolverInterface::class)
                            ->landingPath($request->user());
                    } catch (\Throwable) {
                        $landing = '/dashboard';
                    }

                    return redirect()->to($landing)->with('error', 'You do not have permission to perform this action.');
                }

                return response()->json([
                    'message' => 'Forbidden',
                    'error' => (config('app.debug') && !app()->isProduction()) && $e->getMessage()
                        ? $e->getMessage()
                        : 'You do not have permission to perform this action.',
                ], 403);
            }

            if ($e instanceof NotFoundHttpException) {
                // Web context: redirect back so Inertia receives a valid response.
                if (!$request->expectsJson() && !($request->is('api/*'))) {
                    return redirect()->back()->with('error', 'The requested resource was not found.');
                }

                $disclose = config('app.debug') && !app()->isProduction();

                return response()->json([
                    'message' => 'Not Found',
                    'error' => $disclose
                        ? $e->getMessage() ?: "The route {$request->path()} could not be found."
                        : 'The requested resource was not found.',
                    'path' => $request->path(),
                ], 404);
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            // Web context: never leak plain JSON to Inertia visits.
            if (!$request->expectsJson() && !($request->is('api/*'))) {
                // Always log first — otherwise web errors vanish silently.
                \Illuminate\Support\Facades\Log::error($e->getMessage(), [
                    'exception' => $e,
                    'path' => $request->path(),
                ]);

                return redirect()->back()->with('error', 'An unexpected error occurred.');
            }

            // Never leak exception internals to API clients (even in debug).
            // Log the real message; return a generic one in `message`.
            \Illuminate\Support\Facades\Log::error($e->getMessage(), [
                'exception' => $e,
                'path' => $request->path(),
            ]);

            return response()->json([
                'message' => 'Server Error',
                'error' => (config('app.debug') && !app()->isProduction())
                    ? $e->getMessage()
                    : 'An unexpected error occurred.',
            ], $status);
        });
    })->create();
