<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\ReportingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

/**
 * AdminStatsController
 *
 * Provides aggregate statistics for the admin control center dashboard.
 * All endpoints require auth:sanctum + viewDashboard gate.
 */
class AdminStatsController extends Controller
{
    public function __construct(private ReportingServiceInterface $reporting) {}

    /**
     * Returns aggregate platform statistics.
     *
     * GET /api/admin/stats
     */
    public function index(): JsonResponse
    {
        try {
            $stats = Cache::remember('admin_stats', 60, fn () => $this->reporting->adminDashboardStats());

            return response()->json(['data' => $stats]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Failed to load stats',
                'error'   => app()->isLocal() ? $e->getMessage() : 'Internal error',
            ], 500);
        }
    }

    /**
     * Returns system health metrics.
     *
     * GET /api/admin/stats/system
     */
    public function system(): JsonResponse
    {
        $health = [
            'database'       => $this->checkDatabase(),
            'cache'          => $this->checkCache(),
            'queue'          => $this->checkQueue(),
            'storage'        => $this->checkStorage(),
            'php_version'    => PHP_VERSION,
            'laravel_version' => app()->version(),
            'checked_at'     => now()->toISOString(),
        ];

        $allHealthy = collect($health)
            ->filter(fn ($v) => is_array($v))
            ->every(fn ($v) => ($v['status'] ?? '') === 'ok');

        return response()->json([
            'data'   => $health,
            'status' => $allHealthy ? 'healthy' : 'degraded',
        ]);
    }

    /**
     * Checks database connectivity.
     *
     * @return array{status: string, latency_ms?: float, error?: string}
     */
    private function checkDatabase(): array
    {
        try {
            $start = microtime(true);
            DB::connection()->getPdo();
            $latency = round((microtime(true) - $start) * 1000, 2);

            return ['status' => 'ok', 'latency_ms' => $latency];
        } catch (Throwable $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }

    /**
     * Checks cache store read/write.
     *
     * @return array{status: string, driver: string, error?: string}
     */
    private function checkCache(): array
    {
        try {
            Cache::put('_health_check', 1, 5);
            $value = Cache::get('_health_check');

            return [
                'status' => $value === 1 ? 'ok' : 'error',
                'driver' => config('cache.default'),
            ];
        } catch (Throwable $e) {
            return ['status' => 'error', 'driver' => config('cache.default'), 'error' => $e->getMessage()];
        }
    }

    /**
     * Checks queue by counting pending jobs.
     *
     * @return array{status: string, pending_jobs: int}
     */
    private function checkQueue(): array
    {
        try {
            $pending = DB::table('jobs')->count();

            return ['status' => 'ok', 'pending_jobs' => $pending];
        } catch (Throwable $e) {
            return ['status' => 'error', 'pending_jobs' => 0, 'error' => $e->getMessage()];
        }
    }

    /**
     * Checks disk storage usage.
     *
     * @return array{status: string, free_gb: float, total_gb: float, used_percent: float}
     */
    private function checkStorage(): array
    {
        try {
            $storagePath = storage_path();
            $free        = disk_free_space($storagePath);
            $total       = disk_total_space($storagePath);
            $usedPercent = $total > 0 ? round((($total - $free) / $total) * 100, 1) : 0;

            return [
                'status'       => $usedPercent < 90 ? 'ok' : 'warning',
                'free_gb'      => round($free / 1073741824, 2),
                'total_gb'     => round($total / 1073741824, 2),
                'used_percent' => $usedPercent,
            ];
        } catch (Throwable $e) {
            return ['status' => 'error', 'error' => $e->getMessage()];
        }
    }
}
