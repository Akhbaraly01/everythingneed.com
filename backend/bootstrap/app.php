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
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
            'verified.custom' => \App\Http\Middleware\EnsureEmailIsVerified::class,
        ]);

        $middleware->web(append: [
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
            \App\Http\Middleware\GlobalRateLimit::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
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

            if ($e instanceof AccessDeniedHttpException) {
                return response()->json([
                    'message' => 'Forbidden',
                    'error' => $e->getMessage() ?: 'You do not have permission to perform this action.',
                ], 403);
            }

            if ($e instanceof NotFoundHttpException) {
                return response()->json([
                    'message' => 'Not Found',
                    'error' => config('app.debug')
                        ? $e->getMessage() ?: "The route {$request->path()} could not be found."
                        : 'The requested resource was not found.',
                    'path' => $request->path(),
                ], 404);
            }

            $status = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;

            return response()->json([
                'message' => $e->getMessage() ?: 'Server Error',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred.',
            ], $status);
        });
    })->create();
