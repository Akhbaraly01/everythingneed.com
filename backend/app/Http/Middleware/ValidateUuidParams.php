<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpFoundation\Response;

class ValidateUuidParams
{
    private const UUID_PATTERN = '/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/';

    public function handle(Request $request, Closure $next): Response
    {
        foreach ($request->route()->parameters() as $name => $value) {
            if (!is_string($value)) {
                continue;
            }

            $isIdParam = $name === 'id' || str_ends_with($name, '_id') || str_ends_with($name, 'Id');

            if ($isIdParam && !preg_match(self::UUID_PATTERN, $value)
                && !in_array($name, ['key', 'path'], true)) {
                throw new NotFoundHttpException("Invalid identifier format for {$name}.");
            }
        }

        return $next($request);
    }
}
