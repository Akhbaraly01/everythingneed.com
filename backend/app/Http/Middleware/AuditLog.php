<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class AuditLog
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // W16 (R-06/N-01): every authenticated state-changing request is
        // audited - file channel (as before) plus an `audit_logs` row so
        // the admin audit console can query it. Best-effort: persistence
        // must never break the request path.
        if ($request->user() && in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            Log::channel('audit')->info('API Request', [
                'user_id' => $request->user()->id,
                'method' => $request->method(),
                'path' => $request->path(),
                'ip' => $request->ip(),
                'user_agent' => $request->userAgent(),
                'status' => $response->getStatusCode(),
            ]);

            try {
                app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                    'action' => $request->method().' '.$request->path(),
                    'entity_type' => 'api_request',
                    'entity_id' => $request->path(),
                    'performed_by' => (string) $request->user()->id,
                    'ip_address' => $request->ip(),
                    'metadata' => [
                        'status' => $response->getStatusCode(),
                        'user_agent' => $request->userAgent(),
                    ],
                ]);
            } catch (\Throwable) {
                // Audit must never break the request path.
            }
        }

        return $response;
    }
}
