<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class TransformJsonStrings
{
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->isJson()) {
            $request->merge(['_json_string_body' => $request->getContent()]);
        }

        return $next($request);
    }
}
