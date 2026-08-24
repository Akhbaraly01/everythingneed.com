<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

class HandleInertiaRequests
{
    public function handle(Request $request, Closure $next): Response
    {
        Inertia::share([
            'auth' => function () use ($request) {
                if ($user = $request->user()) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'roles' => $user->roles->pluck('role'),
                        // Granular permissions arrive with the RBAC campaign;
                        // role-derived until then.
                        'permissions' => collect(),
                    ];
                }

                return null;
            },
            'flash' => function () use ($request) {
                return [
                    'success' => $request->session()->get('success'),
                    'error' => $request->session()->get('error'),
                ];
            },
            'ziggy' => function () use ($request) {
                return [
                    'url' => route('home', [], false),
                    'port' => null,
                    'defaults' => [],
                    'routes' => [],
                ];
            },
        ]);

        return $next($request);
    }
}
