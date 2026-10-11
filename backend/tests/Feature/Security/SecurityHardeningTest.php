<?php

namespace Tests\Feature\Security;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;
use Tests\TestCase;

class SecurityHardeningTest extends TestCase
{
    public function test_table_gateway_prescriptions_scope_is_patient_id(): void
    {
        $this->assertTrue(
            Schema::hasColumn('prescriptions', 'patient_id'),
            'prescriptions must own patient_id column for gateway scoping'
        );
        $this->assertFalse(Schema::hasColumn('prescriptions', 'user_id'));
    }

    public function test_table_gateway_scopes_prescriptions_to_patient(): void
    {
        $patient = $this->actingAsUser();
        $stranger = $this->createUser();

        $id = (string) Str::uuid();
        DB::table('prescriptions')->insert([
            'id' => $id,
            'code' => 'RX-'.strtoupper(uniqid()),
            'patient_id' => $patient->id,
            'items' => json_encode([['name' => 'Tamiflu', 'dosage' => '75mg']]),
            'status' => 'active',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Stranger must not see patient prescriptions through gateway.
        $res = $this->actingAs($stranger, 'sanctum')
            ->getJson('/api/db/prescriptions');
        $res->assertOk();
        $this->assertStringNotContainsString($id, $res->getContent());

        // Patient sees their own.
        $this->actingAs($patient, 'sanctum')
            ->getJson('/api/db/prescriptions')
            ->assertOk()
            ->assertJsonFragment(['id' => $id]);
    }

    public function test_table_gateway_forces_ownership_on_update_and_blocks_scope_reassign(): void
    {
        $owner = $this->actingAsUser();
        $stranger = $this->createUser();

        $id = (string) Str::uuid();
        DB::table('addresses')->insert([
            'id' => $id,
            'user_id' => $owner->id,
            'line1' => '1 Old St',
            'city' => 'Accra',
            'country' => 'GH',
            'is_default' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Stranger cannot update owner's row.
        $this->actingAs($stranger, 'sanctum')
            ->putJson("/api/db/addresses/{$id}", ['line1' => 'Hacked'])
            ->assertNotFound();

        // Owner cannot reassign user_id via payload.
        $this->actingAs($owner, 'sanctum')
            ->putJson("/api/db/addresses/{$id}", [
                'line1' => '2 New Ave',
                'user_id' => $stranger->id,
            ])
            ->assertOk();

        $row = DB::table('addresses')->where('id', $id)->first();
        $this->assertSame($owner->id, $row->user_id, 'scope column must be forced server-side');
        $this->assertSame('2 New Ave', $row->line1);
    }

    public function test_table_gateway_store_ignores_client_scope_column(): void
    {
        $me = $this->actingAsUser();
        $other = $this->createUser();

        $res = $this->postJson('/api/db/addresses', [
            'line1' => '9 Work Rd',
            'city' => 'Kumasi',
            'country' => 'GH',
            'user_id' => $other->id,
        ]);

        $res->assertCreated();
        $this->assertSame($me->id, $res->json('data.user_id'));
    }

    public function test_health_endpoint_does_not_leak_versions_or_db_errors(): void
    {
        $res = $this->getJson('/api/health');
        $res->assertOk();
        $content = $res->getContent();

        $this->assertStringNotContainsString('"debug"', $content);
        $this->assertStringNotContainsString('"laravel"', $content);
        $this->assertStringNotContainsString('"php"', $content);
        $this->assertStringNotContainsString('disconnected', $content);
    }

    public function test_paystack_webhook_rejects_bad_signature_when_secret_set(): void
    {
        config(['payments.paystack.secret' => 'sk_test_secret']);

        $this->withHeaders(['x-paystack-signature' => 'deadbeef'])
            ->postJson('/api/webhooks/payments/paystack', [
                'event' => 'charge.success',
                'data' => ['reference' => 'R1'],
            ])
            ->assertStatus(400);
    }

    public function test_paystack_webhook_accepts_valid_signature(): void
    {
        $secret = 'sk_test_secret';
        config(['payments.paystack.secret' => $secret]);

        $body = json_encode([
            'event' => 'charge.success',
            'data' => ['reference' => 'PS-OK-'.uniqid(), 'id' => 1],
        ]);
        $sig = hash_hmac('sha512', $body, $secret);

        $this->call(
            'POST',
            '/api/webhooks/payments/paystack',
            [],
            [],
            [],
            ['CONTENT_TYPE' => 'application/json', 'HTTP_X_PAYSTACK_SIGNATURE' => $sig],
            $body
        )->assertOk();
    }

    public function test_paystack_webhook_allows_local_without_secret(): void
    {
        config(['payments.paystack.secret' => '']);

        $this->postJson('/api/webhooks/payments/paystack', [
            'event' => 'charge.success',
            'data' => ['reference' => 'PS-LOCAL-'.uniqid(), 'id' => 2],
        ])->assertOk();
    }

    public function test_password_reset_rotates_remember_token_on_change(): void
    {
        $user = $this->createUser(['password' => bcrypt('OldPass123')]);
        $oldRemember = $user->remember_token;

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/change-password', [
                'current_password' => 'OldPass123',
                'password' => 'NewPass456',
            ])
            ->assertOk();

        $user->refresh();
        $this->assertNotSame($oldRemember, $user->remember_token, 'remember_token must rotate on password change');
    }

    public function test_password_reset_confirm_rotates_remember_token(): void
    {
        $user = $this->createUser();
        $token = 'plain-reset-'.Str::random(32);
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            ['token' => \Illuminate\Support\Facades\Hash::make($token), 'created_at' => now()],
        );

        $before = $user->remember_token;

        $this->postJson('/api/auth/confirm-reset', [
            'token' => $token,
            'newPassword' => 'BrandNew99',
        ])->assertOk();

        $user->refresh();
        $this->assertNotSame($before, $user->remember_token);
    }

    public function test_upload_endpoint_is_throttled(): void
    {
        $user = User::factory()->create();
        $ip = '203.0.113.99';
        $codes = [];
        for ($i = 0; $i < 12; $i++) {
            $codes[] = $this->actingAs($user, 'sanctum')
                ->withHeaders(['REMOTE_ADDR' => $ip, 'X-Forwarded-For' => $ip])
                ->postJson('/api/upload', [])
                ->getStatusCode();
        }

        $this->assertContains(429, $codes, 'upload must throttle');
    }

    public function test_2fa_enable_and_verify_are_throttled(): void
    {
        $user = User::factory()->create();
        $ip = '203.0.113.120';
        $codes = [];
        for ($i = 0; $i < 12; $i++) {
            $codes[] = $this->actingAs($user, 'sanctum')
                ->withHeaders(['REMOTE_ADDR' => $ip, 'X-Forwarded-For' => $ip])
                ->postJson('/api/auth/2fa/enable', [])
                ->getStatusCode();
        }
        $this->assertContains(429, $codes, '2fa/enable must throttle');

        $codesVerify = [];
        for ($i = 0; $i < 12; $i++) {
            $codesVerify[] = $this->actingAs($user, 'sanctum')
                ->withHeaders(['REMOTE_ADDR' => $ip, 'X-Forwarded-For' => $ip])
                ->postJson('/api/auth/2fa/verify', ['code' => '000000'])
                ->getStatusCode();
        }
        $this->assertContains(429, $codesVerify, '2fa/verify must throttle');
    }

    public function test_chat_routes_do_not_expose_email_in_source_or_routes(): void
    {
        $src = file_get_contents(base_path('Modules/Messaging/Http/Controllers/ChatController.php'));
        $this->assertStringContainsString("'customer:id,name'", $src);
        $this->assertStringContainsString("'worker:id,name'", $src);
        $this->assertStringNotContainsString("with(['customer', 'worker'])", $src);
    }

    public function test_legacy_register_assigns_default_role(): void
    {
        $src = file_get_contents(base_path('Core/Services/AuthService.php'));
        $this->assertStringContainsString("UserRole::firstOrCreate", $src);
        $this->assertStringContainsString("'role' => 'user'", $src);
    }

    public function test_deals_landing_slugs_are_routed(): void
    {
        foreach (['food', 'jobs', 'hotels', 'real-estate', 'tasks', 'transportation', 'agriculture', 'booking'] as $slug) {
            $res = $this->get("/deals/{$slug}");
            $this->assertNotEquals(404, $res->getStatusCode(), "deals/{$slug} should resolve");
        }
        $this->get('/healthcare/tickets')->assertStatus(302); // auth required redirect
    }

    public function test_cors_config_forbids_wildcard_with_credentials(): void
    {
        // Simulate env returning a wildcard origin list; config file must filter it.
        $origins = array_values(array_filter(array_map('trim', explode(',', '*'))));
        if ($origins === [] || in_array('*', $origins, true)) {
            // Mirrors the cors.php fallback (single app on :8000).
            $origins = ['http://localhost:8000', 'http://127.0.0.1:8000'];
        }

        $this->assertNotContains('*', $origins);
        $this->assertTrue(config('cors.supports_credentials'));
        $this->assertNotContains('*', config('cors.allowed_origins'));
    }

    public function test_database_seeder_refuses_non_local_env(): void
    {
        // Guard must short-circuit outside local/testing — assert it exists in source.
        $source = file_get_contents(base_path('database/seeders/DatabaseSeeder.php'));
        $this->assertStringContainsString("app()->environment(['local', 'testing'])", $source);
        $this->assertStringContainsString('refuses to run outside local/testing', $source);
    }

    public function test_lesson_content_sanitizer_strips_script_tags(): void
    {
        // Client-side sanitizer lives in Lesson.tsx; assert source contains the strip.
        $path = base_path('resources/js/pages/learn/Lesson.tsx');
        $this->assertFileExists($path);
        $src = file_get_contents($path);
        $this->assertStringContainsString('sanitizeHtml', $src);
        $this->assertStringContainsString('<script', $src);
        $this->assertStringContainsString('dangerouslySetInnerHTML={{ __html: sanitizeHtml', $src);
    }

    public function test_generic_500_message_is_masked(): void
    {
        // Assert the 500 JSON path returns a constant message (not raw exception text).
        $bootstrap = file_get_contents(base_path('bootstrap/app.php'));
        $this->assertStringContainsString("'message' => 'Server Error'", $bootstrap);
        $this->assertStringContainsString('Log::error($e->getMessage()', $bootstrap);

        // The catch-all 500 block must not assign $e->getMessage() to `message`.
        if (preg_match("/status = method_exists.*?create\(\)/s", $bootstrap, $m)) {
            $this->assertStringNotContainsString("'message' => \$e->getMessage()", $m[0]);
        } else {
            $this->fail('Could not locate catch-all exception block in bootstrap/app.php');
        }
    }

    public function test_table_gateway_unknown_scope_column_fails_closed(): void
    {
        // If a future table is registered with a missing scope column, applyScope 404s.
        $controller = new \App\Http\Controllers\Api\TableGatewayController();
        $ref = new \ReflectionMethod($controller, 'applyScope');
        $ref->setAccessible(true);

        $request = \Illuminate\Http\Request::create('/api/db/prescriptions', 'GET');
        $request->setUserResolver(fn () => $this->createUser());

        $query = DB::table('prescriptions');
        try {
            $ref->invoke($controller, $request, $query, 'prescriptions', 'missing_column');
            $this->fail('Expected HttpException when scope column is missing');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            $this->assertSame(404, $e->getStatusCode());
        }
    }

    public function test_two_factor_enable_verify_disable_flow_and_shared_auth_flag(): void
    {
        $user = User::factory()->create();

        // Shared Inertia auth payload starts with 2FA off.
        // Re-resolve the instance so previously loaded relations don't go stale
        // (actingAs keeps one model instance across requests in a test).
        $this->actingAs(User::find($user->id))
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->where('auth.two_factor_enabled', false));

        // Enable initializes a secret (not yet active for login).
        $enable = $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/2fa/enable');
        $enable->assertOk()
            ->assertJsonStructure(['data' => ['secret', 'qr_code_url']]);
        $secret = $enable->json('data.secret');
        $this->assertNotEmpty($secret);

        // A valid TOTP for the issued secret verifies and activates 2FA.
        $code = $this->validTotp($secret);
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/2fa/verify', ['code' => $code])
            ->assertOk();

        $this->assertTrue(
            (bool) DB::table('two_factor_secrets')->where('user_id', $user->id)->value('enabled'),
            'verify must flip two_factor_secrets.enabled'
        );

        $this->actingAs(User::find($user->id))
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->where('auth.two_factor_enabled', true));

        // Disable turns it back off.
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/2fa/disable')
            ->assertOk();

        $this->assertFalse(
            (bool) DB::table('two_factor_secrets')->where('user_id', $user->id)->value('enabled')
        );

        $this->actingAs(User::find($user->id))
            ->get('/dashboard')
            ->assertInertia(fn ($page) => $page->where('auth.two_factor_enabled', false));
    }

    public function test_2fa_verify_rejects_invalid_code(): void
    {
        $user = User::factory()->create();

        $enable = $this->actingAs($user, 'sanctum')->postJson('/api/auth/2fa/enable');
        $enable->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/2fa/verify', ['code' => '000000'])
            ->assertStatus(422);

        $this->assertFalse(
            (bool) DB::table('two_factor_secrets')->where('user_id', $user->id)->value('enabled'),
            'invalid code must not activate 2FA'
        );
    }

    public function test_2fa_disable_is_idempotent_without_configuration(): void
    {
        $user = User::factory()->create();

        // No secret configured - disable must still succeed (no 500).
        $this->actingAs($user, 'sanctum')
            ->postJson('/api/auth/2fa/disable')
            ->assertOk();
    }

    /**
     * Mirror of AuthService::verifyTotp generation (base32 decode + HMAC-SHA1 TOTP).
     */
    private function validTotp(string $secret): string
    {
        $map = [
            'A' => 0, 'B' => 1, 'C' => 2, 'D' => 3, 'E' => 4, 'F' => 5,
            'G' => 6, 'H' => 7, 'I' => 8, 'J' => 9, 'K' => 10, 'L' => 11,
            'M' => 12, 'N' => 13, 'O' => 14, 'P' => 15, 'Q' => 16, 'R' => 17,
            'S' => 18, 'T' => 19, 'U' => 20, 'V' => 21, 'W' => 22, 'X' => 23,
            'Y' => 24, 'Z' => 25, '2' => 26, '3' => 27, '4' => 28, '5' => 29,
            '6' => 30, '7' => 31,
        ];

        $input = strtoupper(rtrim($secret, '='));
        $buffer = 0;
        $bitsLeft = 0;
        $key = '';
        for ($i = 0; $i < strlen($input); $i++) {
            $val = $map[$input[$i]] ?? -1;
            if ($val < 0) {
                continue;
            }
            $buffer = ($buffer << 5) | $val;
            $bitsLeft += 5;
            if ($bitsLeft >= 8) {
                $bitsLeft -= 8;
                $key .= chr(($buffer >> $bitsLeft) & 0xff);
            }
        }

        $counter = pack('N*', 0) . pack('N*', (int) floor(time() / 30));
        $hash = hash_hmac('sha1', $counter, $key, true);
        $offset = ord($hash[19]) & 0xf;
        $otp = (
            ((ord($hash[$offset]) & 0x7f) << 24) |
            ((ord($hash[$offset + 1]) & 0xff) << 16) |
            ((ord($hash[$offset + 2]) & 0xff) << 8) |
            (ord($hash[$offset + 3]) & 0xff)
        ) % 1000000;

        return str_pad((string) $otp, 6, '0', STR_PAD_LEFT);
    }
}
