<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ActivityTracker
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        if ($user = $request->user()) {
            $user->update(['last_activity_at' => now()]);

            Log::channel('activity')->info('User Activity', [
                'user_id' => $user->id,
                'action' => $request->method() . ' ' . $request->path(),
                'ip' => $request->ip(),
                'timestamp' => now()->toISOString(),
            ]);
        }

        return $response;
    }
}
