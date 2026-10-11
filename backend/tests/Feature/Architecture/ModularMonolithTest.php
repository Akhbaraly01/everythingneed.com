<?php

namespace Tests\Feature\Architecture;

use Tests\TestCase;

/**
 * Modular-monolith guardrails (Iteration 27).
 *
 * 1) Every DB::table(...) call inside Modules/ must only touch tables that
 *    module owns. Cross-module reads go through Core contract services
 *    (aggregates live in ReportingService; CRUD lives in the owner module).
 * 2) Module route files must register controller actions — no route closures.
 *
 * Core/ and app/ are intentionally exempt: Core is the shared kernel (it may
 * read any table on behalf of callers) and app/ is the application layer.
 */
class ModularMonolithTest extends TestCase
{
    /**
     * Module => tables it may reach directly via DB::table(...).
     * A module not listed here may not touch any table.
     */
    private const OWNERSHIP = [
        // Admin owns the CMS tables; `jobs` is the queue-infrastructure table
        // (health check only) — not the Jobs domain (job_posts).
        'Admin'            => ['cms_announcements', 'cms_banners', 'cms_blog_posts', 'cms_pages', 'jobs', 'cms_blocks', 'cms_revisions', 'navigations', 'navigation_items', 'cms_forms', 'cms_form_submissions', 'media_library', 'dynamic_modules', 'dynamic_module_entries'],
        'Analytics'        => ['analytics_events'],
        'Authentication'   => ['password_reset_tokens'],
        'BuildingServices' => ['building_service_bookings', 'service_workers'],
        'Engagement'       => ['favorites', 'recently_viewed', 'wishlists'],
        'Experts'          => ['expert_availability', 'expert_bookings', 'expert_reviews'],
        'Healthcare'       => ['doctors'],
        'Messaging'        => ['departments', 'support_tickets', 'tickets'],
        'Needs'            => ['need_categories', 'need_items'],
        'Orders'           => ['vendor_orders'],
        'Products'         => ['rejected_products'],
        'Rides'            => ['flights'],
        'Settings'         => ['feature_flags', 'system_settings'],
        'Vendors'          => ['vendor_commissions', 'vendor_withdrawals', 'vendors'],
    ];

    /**
     * Documented dynamic DB::table($var) call sites (file => why it is safe).
     */
    private const DYNAMIC_ALLOWED = [
        'Modules/Admin/Http/Controllers/AdminCmsController.php'
            => 'uniqueSlug() takes a table name; every caller passes a cms_* table',
    ];

    public function test_module_code_only_touches_tables_it_owns(): void
    {
        $violations = [];

        foreach ($this->phpFiles(base_path('Modules')) as $file) {
            $module = $this->moduleName($file);
            $allowed = self::OWNERSHIP[$module] ?? [];
            $relative = str_replace('\\', '/', str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file));
            $code = (string) file_get_contents($file);

            // Literal table names: DB::table('some_table')
            preg_match_all("/DB::table\(\s*['\"]([A-Za-z0-9_]+)['\"]/", $code, $matches);
            foreach (array_unique($matches[1]) as $table) {
                if (! in_array($table, $allowed, true)) {
                    $violations[] = sprintf(
                        '%s reads table "%s" but module "%s" only owns: [%s]',
                        $relative,
                        $table,
                        $module,
                        implode(', ', $allowed),
                    );
                }
            }

            // Dynamic references: DB::table($something)
            preg_match_all('/DB::table\(\s*(?![\'"])/', $code, $dynamic);
            if (count($dynamic[0]) > 0 && ! isset(self::DYNAMIC_ALLOWED[$relative])) {
                $violations[] = sprintf(
                    '%s uses a dynamic DB::table(...) reference (%d×) which the ownership test cannot verify',
                    $relative,
                    count($dynamic[0]),
                );
            }
        }

        $this->assertSame([], $violations, "Cross-module table access detected:\n" . implode("\n", $violations));
    }

    public function test_module_routes_register_controller_actions_not_closures(): void
    {
        $violations = [];

        foreach ($this->phpFiles(base_path('Modules')) as $file) {
            if (stripos($file, DIRECTORY_SEPARATOR . 'Routes' . DIRECTORY_SEPARATOR) === false) {
                continue;
            }

                $code = (string) file_get_contents($file);
                $relative = str_replace('\\', '/', str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file));

            // Route::get('uri', function ...) — action closures only.
            // Structural group closures (->group(function () { ... })) are fine.
            preg_match_all(
                "/Route::(?:get|post|put|patch|delete|options|any|match)\s*\(\s*(?:\[\s*['\"][^'\"]*['\"]\s*(?:,\s*['\"][^'\"]*['\"]\s*)*\]\s*,\s*)?['\"][^'\"]*['\"]\s*,\s*function\b/",
                $code,
                $matches,
                PREG_OFFSET_CAPTURE
            );

            foreach ($matches[0] as $hit) {
                $line = substr_count(substr($code, 0, $hit[1]), "\n") + 1;
                $violations[] = sprintf('%s:%d route closure action: %s', $relative, $line, trim($hit[0]));
            }
        }

        $this->assertSame([], $violations, "Route closures found in module routes:\n" . implode("\n", $violations));
    }

    /** @return list<string> */
    private function phpFiles(string $directory): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($directory, \FilesystemIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $files[] = $file->getPathname();
            }
        }

        sort($files);

        return $files;
    }

    private function moduleName(string $file): string
    {
        $relative = str_replace(base_path() . DIRECTORY_SEPARATOR, '', $file);
        $parts = explode(DIRECTORY_SEPARATOR, str_replace('/', DIRECTORY_SEPARATOR, $relative));

        return $parts[1] ?? '';
    }
}
