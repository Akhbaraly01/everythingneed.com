<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class PreventSqlInjection
{
    public function handle(Request $request, Closure $next): Response
    {
        $dangerousPatterns = [
            '/(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE|EXEC|EXECUTE)\b)/i',
            '/(--|;|\/\*|\*\/|xp_)',
            '/(\bOR\b\s+\b\d+\b\s*=\s*\b\d+\b)/i',
            '/(\bAND\b\s+\b\d+\b\s*=\s*\b\d+\b)/i',
        ];

        $input = array_merge($request->all(), $request->query());

        foreach ($input as $key => $value) {
            if (is_string($value)) {
                foreach ($dangerousPatterns as $pattern) {
                    if (preg_match($pattern, $value)) {
                        abort(400, 'Potentially dangerous input detected.');
                    }
                }
            }
        }

        return $next($request);
    }
}
