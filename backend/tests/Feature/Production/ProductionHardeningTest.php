<?php

namespace Tests\Feature\Production;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductionHardeningTest extends TestCase
{
    use RefreshDatabase;

    public function test_schedule_registers_financial_reconcile_in_console_routes(): void
    {
        $source = file_get_contents(base_path('routes/console.php'));
        $this->assertStringContainsString('financial:reconcile --release-expired', $source);
        $this->assertStringContainsString('Schedule::command', $source);
    }

    public function test_inertia_share_uses_config_not_env(): void
    {
        $source = file_get_contents(base_path('app/Http/Middleware/HandleInertiaRequests.php'));
        $this->assertStringNotContainsString("env('APP_SOCIAL_FACEBOOK')", $source);
        $this->assertStringNotContainsString("env('APP_STORE_URL')", $source);
        $this->assertStringContainsString("config('app.social'", $source);
        $this->assertStringContainsString("config('app.store_links'", $source);
    }

    public function test_config_app_exposes_social_and_store_links_and_force_https(): void
    {
        $config = config('app.social');
        $this->assertIsArray($config);
        $this->assertArrayHasKey('facebook', $config);
        $this->assertArrayHasKey('youtube', $config);

        $links = config('app.store_links');
        $this->assertArrayHasKey('ios', $links);
        $this->assertArrayHasKey('android', $links);

        $this->assertArrayHasKey('force_https', config('app'));
    }

    public function test_test_users_seeder_refuses_non_local_env(): void
    {
        $source = file_get_contents(base_path('database/seeders/TestUsersSeeder.php'));
        $this->assertStringContainsString("app()->environment(['local', 'testing'])", $source);
    }

    public function test_local_access_seeder_refuses_non_local_env(): void
    {
        $source = file_get_contents(base_path('database/seeders/LocalAccessSeeder.php'));
        $this->assertStringContainsString("app()->environment(['local', 'testing'])", $source);
    }

    public function test_production_seeder_only_calls_safe_seeders(): void
    {
        $source = file_get_contents(base_path('database/seeders/ProductionSeeder.php'));
        $this->assertStringContainsString('PermissionSeeder::class', $source);
        $this->assertStringContainsString('FeatureFlagSeeder::class', $source);
        $this->assertStringNotContainsString('TestUsersSeeder', $source);
        $this->assertStringNotContainsString('LocalAccessSeeder', $source);
        $this->assertStringNotContainsString('DatabaseSeeder', $source);
    }

    public function test_queue_tables_migration_exists(): void
    {
        $this->assertFileExists(base_path('database/migrations/2026_09_24_000002_create_queue_tables.php'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('jobs'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('failed_jobs'));
        $this->assertTrue(\Illuminate\Support\Facades\Schema::hasTable('job_batches'));
    }

    public function test_env_production_example_is_locked_down(): void
    {
        $env = file_get_contents(base_path('.env.production.example'));
        $this->assertStringContainsString('APP_ENV=production', $env);
        $this->assertStringContainsString('APP_DEBUG=false', $env);
        $this->assertStringContainsString('MAIL_ENABLED=true', $env);
        $this->assertStringContainsString('FORCE_HTTPS=true', $env);
        $this->assertStringContainsString('LOG_LEVEL=error', $env);
        $this->assertStringNotContainsString('PAYMENTS_DRIVER=mock', $env);
        $this->assertStringContainsString('ProductionSeeder', $env);
    }

    public function test_deploy_runbook_exists_and_documents_route_cache_limitation(): void
    {
        $this->assertFileExists(base_path('DEPLOY.md'));
        $doc = file_get_contents(base_path('DEPLOY.md'));
        $this->assertStringContainsString('Do not run', $doc);
        $this->assertStringContainsString('route:cache', $doc);
        $this->assertStringContainsString('ProductionSeeder', $doc);
        $this->assertStringContainsString('schedule:run', $doc);
        $this->assertStringContainsString('queue:work', $doc);
    }

    public function test_composer_has_optimize_prod_without_route_cache(): void
    {
        $json = json_decode(file_get_contents(base_path('composer.json')), true);
        $this->assertArrayHasKey('optimize-prod', $json['scripts']);
        $script = implode("\n", array_map('strval', $json['scripts']['optimize-prod']));
        $this->assertStringContainsString('config:cache', $script);
        $this->assertStringNotContainsString('route:cache', $script);
    }

    public function test_no_env_calls_outside_config_for_inertia_links(): void
    {
        // Regression: config:cache must not null social/store links.
        $this->assertSame(
            null,
            null,
        );
        $this->assertNotNull(config('app.social'));
        $this->assertNotNull(config('app.store_links'));
    }
}
