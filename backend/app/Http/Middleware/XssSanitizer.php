<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class XssSanitizer
{
    public function handle(Request $request, Closure $next): Response
    {
        $input = $request->all();

        $sanitized = $this->sanitizeArray($input);

        $request->merge($sanitized);

        return $next($request);
    }

    private function sanitizeArray(array $data): array
    {
        $sanitized = [];

        foreach ($data as $key => $value) {
            if (is_string($value)) {
                $sanitized[$key] = strip_tags($value);
                $sanitized[$key] = htmlspecialchars($sanitized[$key], ENT_QUOTES, 'UTF-8');
            } elseif (is_array($value)) {
                $sanitized[$key] = $this->sanitizeArray($value);
            } else {
                $sanitized[$key] = $value;
            }
        }

        return $sanitized;
    }
}
