<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Core\Services\Contracts\ReportingServiceInterface;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Admin reports console (W5.4). Wired to the previously dead
 * ReportingService::getSalesReport / getAnalyticsReport.
 *
 * View endpoints are gated by permission:reports.reports.view, the CSV
 * export by permission:reports.reports.export (auditor has both; analyst
 * is view-only).
 */
class AdminReportController extends Controller
{
    public function __construct(private ReportingServiceInterface $reporting) {}

    /** GET /api/admin/reports/sales */
    public function sales(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reporting->getSalesReport($this->filters($request)),
        ]);
    }

    /** GET /api/admin/reports/analytics */
    public function analytics(Request $request): JsonResponse
    {
        return response()->json([
            'data' => $this->reporting->getAnalyticsReport($this->filters($request)),
        ]);
    }

    /** GET /api/admin/reports/export — CSV of the sales report. */
    public function export(Request $request): StreamedResponse
    {
        $filters = $this->filters($request);
        $report = $this->reporting->getSalesReport($filters);

        $filename = 'everythingneed-sales-report-'
            .$filters['start_date']->format('Ymd').'-'
            .$filters['end_date']->format('Ymd').'.csv';

        return response()->streamDownload(function () use ($report) {
            $out = fopen('php://output', 'w');

            fputcsv($out, ['EverythingNeed sales report']);
            fputcsv($out, ['generated_at', now()->toIso8601String()]);
            fputcsv($out, ['start', (string) $report['period']['start']]);
            fputcsv($out, ['end', (string) $report['period']['end']]);
            fputcsv($out, []);
            fputcsv($out, ['metric', 'value']);
            fputcsv($out, ['total_revenue', $report['total_revenue']]);
            fputcsv($out, ['total_orders', $report['total_orders']]);
            fputcsv($out, ['avg_order_value', $report['avg_order_value']]);
            fputcsv($out, []);
            fputcsv($out, ['date', 'revenue', 'orders']);

            foreach ($report['daily_breakdown'] as $date => $day) {
                fputcsv($out, [$date, $day['revenue'], $day['orders']]);
            }

            fclose($out);
        }, $filename, ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Normalised window: defaults to the last 30 days, rejects inverted
     * ranges with a 422 validation error.
     *
     * @return array{start_date: Carbon, end_date: Carbon}
     */
    private function filters(Request $request): array
    {
        $request->validate([
            'start_date' => ['nullable', 'date'],
            'end_date'   => ['nullable', 'date'],
        ]);

        $start = $request->filled('start_date')
            ? Carbon::parse($request->input('start_date'))->startOfDay()
            : now()->subDays(30)->startOfDay();
        $end = $request->filled('end_date')
            ? Carbon::parse($request->input('end_date'))->endOfDay()
            : now()->endOfDay();

        if ($start->greaterThan($end)) {
            throw ValidationException::withMessages([
                'start_date' => 'start_date must be on or before end_date',
            ]);
        }

        return ['start_date' => $start, 'end_date' => $end];
    }
}
