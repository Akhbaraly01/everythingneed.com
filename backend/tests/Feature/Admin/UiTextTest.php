<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use Database\Seeders\PermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

/**
 * W8 editable system text (no-code UI strings): config/ui_texts.php
 * defaults flow to every Inertia render via the shared `uiTexts` prop,
 * system_settings `ui.*` rows override them instantly (cache flushed on
 * write), and the editor endpoint sits behind manageSettings.
 */
class UiTextTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    #[Test]
    public function test_guest_login_page_shares_default_ui_texts(): void
    {
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->has('uiTexts')
                ->where('uiTexts.ui.login_title.value', 'everythingneed.com')
                ->where('uiTexts.ui.login_title.label', 'Login page title')
                ->where('uiTexts.ui.login_subtitle.value', 'Your one-stop platform for all human needs'));
    }

    #[Test]
    public function test_settings_override_flows_into_texts_and_the_login_page(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'ui.login_title', 'value' => 'Members sign in']],
        ])->assertOk();

        $data = $this->getJson('/api/admin/ui-texts')->assertOk()->json('data');
        $this->assertSame('Members sign in', $data['ui.login_title']['value']);
        $this->assertSame('Login page title', $data['ui.login_title']['label']);

        // Back to the web guard as a guest (actingAs made sanctum default).
        $this->app['auth']->forgetGuards();
        $this->app['auth']->shouldUse('web');

        // The rendered page reflects the edit immediately (no extra cache layer).
        $this->get(route('login'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->where('uiTexts.ui.login_title.value', 'Members sign in'));
    }

    #[Test]
    public function test_runtime_created_ui_key_is_editable_and_shared(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'ui.custom_note', 'value' => 'Welcome back!']],
        ])->assertOk();

        $data = $this->getJson('/api/admin/ui-texts')->assertOk()->json('data');
        $this->assertSame('Welcome back!', $data['ui.custom_note']['value']);
        // Unwired keys label themselves until given a config label.
        $this->assertSame('ui.custom_note', $data['ui.custom_note']['label']);
    }

    #[Test]
    public function test_editor_endpoint_is_gated_to_settings_managers(): void
    {
        $this->getJson('/api/admin/ui-texts')->assertStatus(401);

        $sec = User::factory()->create();
        $this->assignRole($sec, 'security_admin');
        $this->actingAs($sec, 'sanctum');
        $this->getJson('/api/admin/ui-texts')->assertStatus(403);

        $this->app['auth']->forgetGuards();
        $admin = User::factory()->create();
        $this->assignRole($admin, 'administrator');
        $this->actingAs($admin, 'sanctum');
        $this->getJson('/api/admin/ui-texts')->assertOk();
    }

    #[Test]
    public function test_non_ui_settings_are_not_surfaced_as_texts(): void
    {
        $this->actingAsAdmin();

        $this->putJson('/api/admin/settings', [
            'settings' => [['key' => 'platform_name', 'value' => 'EverythingNeed']],
        ])->assertOk();

        $data = $this->getJson('/api/admin/ui-texts')->assertOk()->json('data');
        $this->assertArrayNotHasKey('platform_name', $data);
        $this->assertArrayHasKey('ui.login_title', $data);
    }
}
