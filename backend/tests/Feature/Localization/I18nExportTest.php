<?php

namespace Tests\Feature\Localization;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

/**
 * Multilingual Phase 0: `i18n:export` turns lang/ PHP files into
 * deterministic, content-hash-versioned JSON bundles + a manifest the
 * frontend loader reads. `--check` is the CI drift guard.
 */
class I18nExportTest extends TestCase
{
    use RefreshDatabase;

    private string $exportPath;

    protected function setUp(): void
    {
        parent::setUp();

        $this->exportPath = storage_path('framework/testing/i18n-'.uniqid());
    }

    protected function tearDown(): void
    {
        File::deleteDirectory($this->exportPath);

        parent::tearDown();
    }

    public function test_export_writes_versioned_bundles_and_manifest(): void
    {
        $this->artisan('i18n:export', ['--path' => $this->exportPath])->assertSuccessful();

        $manifest = json_decode((string) file_get_contents($this->exportPath.'/manifest.json'), true);

        $this->assertIsArray($manifest);
        $this->assertMatchesRegularExpression('/^[0-9a-f]{12}$/', $manifest['version']);
        $this->assertSame(['common'], $manifest['locales']['en']);

        foreach (['en', 'es', 'fr', 'pt', 'de', 'ar', 'zh', 'sw'] as $locale) {
            $bundlePath = $this->exportPath.'/'.$manifest['version'].'/'.$locale.'/common.json';
            $this->assertFileExists($bundlePath);
        }

        $en = json_decode(
            (string) file_get_contents($this->exportPath.'/'.$manifest['version'].'/en/common.json'),
            true,
        );

        $this->assertSame('Home', $en['nav']['home']);
        $this->assertSame('Enregistrer', json_decode(
            (string) file_get_contents($this->exportPath.'/'.$manifest['version'].'/fr/common.json'),
            true,
        )['common']['save']);
    }

    public function test_export_is_deterministic(): void
    {
        $this->artisan('i18n:export', ['--path' => $this->exportPath])->assertSuccessful();
        $first = (string) file_get_contents($this->exportPath.'/manifest.json');

        $this->artisan('i18n:export', ['--path' => $this->exportPath])->assertSuccessful();
        $second = (string) file_get_contents($this->exportPath.'/manifest.json');

        $this->assertSame($first, $second);
    }

    public function test_check_passes_after_export_and_fails_on_drift(): void
    {
        $this->artisan('i18n:export', ['--path' => $this->exportPath])->assertSuccessful();

        $this->artisan('i18n:export', ['--check' => true, '--path' => $this->exportPath])
            ->assertSuccessful();

        $manifest = json_decode((string) file_get_contents($this->exportPath.'/manifest.json'), true);
        File::put($this->exportPath.'/'.$manifest['version'].'/en/common.json', '{ "nav": {} }');

        $this->artisan('i18n:export', ['--check' => true, '--path' => $this->exportPath])
            ->assertFailed();

        $this->artisan('i18n:export', ['--path' => $this->exportPath])->assertSuccessful();
        $this->artisan('i18n:export', ['--check' => true, '--path' => $this->exportPath])
            ->assertSuccessful();
    }

    public function test_prune_removes_stale_version_directories(): void
    {
        $staleDir = $this->exportPath.'/deadbeefcafe';
        File::ensureDirectoryExists($staleDir);
        File::put($staleDir.'/en.json', '{}');

        $this->artisan('i18n:export', ['--prune' => true, '--path' => $this->exportPath])
            ->assertSuccessful();

        $this->assertDirectoryDoesNotExist($staleDir);
        $this->assertFileExists($this->exportPath.'/manifest.json');
    }
}
