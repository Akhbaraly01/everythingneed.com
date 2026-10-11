<?php

namespace Tests\Feature\Upload;

use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

/**
 * Spec 44: "Protect against ... unsafe SVG". SVGs reach disk only through
 * MediaService, which sanitizes them (Core\Services\SvgSanitizer) before
 * storing; entity/DOCTYPE payloads are rejected outright.
 */
class SvgSanitizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Storage::fake('public');
    }

    private function svg(string $inner): string
    {
        return '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24">'.$inner.'</svg>';
    }

    private function upload(string $content): \Illuminate\Testing\TestResponse
    {
        $admin = $this->createAdmin();
        $this->actingAs($admin, 'sanctum');

        return $this->postJson('/api/admin/media', [
            'file' => UploadedFile::fake()->createWithContent('probe.svg', $content),
        ]);
    }

    public function test_script_tags_are_stripped_before_storage(): void
    {
        $res = $this->upload($this->svg(
            '<rect width="24" height="24" fill="red"/><script>alert(document.cookie)</script>'
        ));

        $res->assertCreated();
        $stored = (string) Storage::disk('public')->get($res->json('data.path'));

        $this->assertStringNotContainsString('<script', $stored);
        $this->assertStringNotContainsString('document.cookie', $stored);
        $this->assertStringContainsString('<rect', $stored);
    }

    public function test_event_handlers_and_javascript_hrefs_are_stripped(): void
    {
        $res = $this->upload($this->svg(
            '<rect width="4" height="4" onload="steal()"/>'
            .'<a href="javascript:alert(1)"><circle cx="8" cy="8" r="4"/></a>'
        ));

        $res->assertCreated();
        $stored = (string) Storage::disk('public')->get($res->json('data.path'));

        $this->assertStringNotContainsString('onload', $stored);
        $this->assertStringNotContainsString('javascript:', $stored);
        $this->assertStringContainsString('<circle', $stored);
    }

    public function test_entity_bomb_payload_is_rejected(): void
    {
        $res = $this->upload(
            '<!DOCTYPE svg [<!ENTITY a "aaaa">]><svg xmlns="http://www.w3.org/2000/svg">&a;</svg>'
        );

        $res->assertUnprocessable();
        $this->assertDatabaseCount('media_library', 0);
    }

    public function test_clean_svg_passes_through(): void
    {
        $res = $this->upload($this->svg(
            '<defs><linearGradient id="g"><stop offset="0" stop-color="blue"/></linearGradient></defs>'
            .'<circle cx="12" cy="12" r="8" fill="url(#g)"/>'
            .'<image href="https://cdn.example.com/a.png" width="4" height="4"/>'
        ));

        $res->assertCreated();
        $stored = (string) Storage::disk('public')->get($res->json('data.path'));

        $this->assertStringContainsString('<circle', $stored);
        $this->assertStringContainsString('#g', $stored);
        $this->assertStringContainsString('https://cdn.example.com/a.png', $stored);
        $this->assertSame('image/svg+xml', $res->json('data.mime_type'));
    }

    public function test_animated_smil_elements_are_removed(): void
    {
        $res = $this->upload($this->svg(
            '<rect width="4" height="4"><animate attributeName="href" values="javascript:alert(1)" dur="1s"/></rect>'
        ));

        $res->assertCreated();
        $stored = (string) Storage::disk('public')->get($res->json('data.path'));

        $this->assertStringNotContainsString('<animate', $stored);
        $this->assertStringNotContainsString('javascript:', $stored);
    }
}
