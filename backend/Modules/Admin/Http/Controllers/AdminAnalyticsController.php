<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\ReportingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminAnalyticsController extends Controller
{
    /** Whitelisted ranges — anything else falls back to 30d. */
    private const RANGES = ['7d', '30d', '90d'];

    public function __construct(private ReportingServiceInterface $reporting) {}

    public function overview(Request $request): JsonResponse
    {
        // Wave R (§109): five aggregate queries per hit is wasteful for a
        // dashboard polled on every console visit — 120s per range is fresh
        // enough (the CSV export below always reads live data).
        $range = $this->range($request);

        return response()->json([
            'data' => Cache::remember(
                "analytics.overview.{$range}",
                120,
                fn (): array => $this->reporting->adminOverview($range),
            ),
        ]);
    }

    public function userGrowth(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reporting->adminAnalyticsSeries('users', $this->since($request)),
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reporting->adminAnalyticsSeries('revenue', $this->since($request)),
        ]);
    }

    public function categories(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->reporting->productCategoryBreakdown()]);
    }

    public function traffic(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reporting->adminAnalyticsSeries('traffic', $this->since($request)),
        ]);
    }

    /**
     * Spec §63 domain series + conversion funnel in one payload.
     * Every series is real rows only — an empty window returns [] so the UI
     * renders an explicit empty state instead of fabricating data.
     *
     * GET /api/admin/analytics/domains?range=30d
     */
    public function domains(Request $request): JsonResponse
    {
        $since = $this->since($request);

        $series = [];
        foreach (['orders', 'bookings', 'healthcare', 'learning', 'needs', 'services', 'wallet', 'payments'] as $metric) {
            $series[$metric] = $this->reporting->adminAnalyticsSeries($metric, $since);
        }

        return response()->json([
            'data' => [
                'range' => $this->range($request),
                'since' => $since->toDateString(),
                'series' => $series,
                'funnel' => $this->reporting->adminConversionFunnel($since),
            ],
        ]);
    }

    /**
     * CSV export of the overview block + daily series for the selected
     * range. Gated by the analytics.overview.export permission.
     *
     * GET /api/admin/analytics/export?range=7d
     */
    public function export(Request $request): StreamedResponse
    {
        $range = $this->range($request);
        $since = now()->subDays((int) substr($range, 0, -1))->startOfDay();

        $overview = $this->reporting->adminOverview($range);
        $series = [
            'new_users'      => $this->seriesMap('users', $since),
            'revenue'        => $this->seriesMap('revenue', $since),
            'traffic_events' => $this->seriesMap('traffic', $since),
        ];

        $filename = 'everythingneed-analytics-'.$range.'-'.now()->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($overview, $series) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['EverythingNeed analytics export']);
            fputcsv($out, ['generated_at', now()->toIso8601String()]);
            fputcsv($out, ['range', $overview['range']]);
            fputcsv($out, ['since', $overview['since']]);
            fputcsv($out, []);
            fputcsv($out, ['metric', 'value']);
            foreach (['new_users', 'total_orders', 'total_revenue', 'active_vendors', 'total_users'] as $metric) {
                fputcsv($out, [$metric, $overview[$metric]]);
            }
            fputcsv($out, []);
            fputcsv($out, ['date', 'new_users', 'revenue', 'traffic_events']);

            $days = collect($series)
                ->flatMap(fn (array $map) => array_keys($map))
                ->unique()
                ->sort()
                ->values();

            foreach ($days as $day) {
                fputcsv($out, [
                    $day,
                    $series['new_users'][$day] ?? 0,
                    $series['revenue'][$day] ?? 0,
                    $series['traffic_events'][$day] ?? 0,
                ]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /** label => value map keyed by date for CSV merging. */
    private function seriesMap(string $metric, \DateTimeInterface $since): array
    {
        $map = [];
        foreach ($this->reporting->adminAnalyticsSeries($metric, $since) as $row) {
            $map[(string) $row->label] = $row->value;
        }

        return $map;
    }

    private function range(Request $request): string
    {
        $range = (string) $request->query('range', '30d');

        return in_array($range, self::RANGES, true) ? $range : '30d';
    }

    private function since(Request $request): \Illuminate\Support\Carbon
    {
        return now()->subDays((int) substr($this->range($request), 0, -1))->startOfDay();
    }
}
