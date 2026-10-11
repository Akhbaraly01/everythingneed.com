<?php

namespace Tests\Feature\WaveQ;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\TestCase;

/**
 * Wave Q — spec §95 (Phase D security tests): adversarial battery over
 * unauthorized access, cross-user/vendor access, price + wallet
 * manipulation, payment replay, invalid uploads, malicious CMS content,
 * unsafe URLs and injection payloads. Anything that fails here is fixed,
 * not pinned.
 */
class WaveQSecurityTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(\Database\Seeders\PermissionSeeder::class);
        Cache::forget('rbac.matrix');
    }

    private function seedProduct(float $price = 100, int $stock = 5): string
    {
        $id = (string) Str::uuid();
        DB::table('products')->insert([
            'id' => $id,
            'vendor_id' => (string) Str::uuid(),
            'name' => 'WaveQ Gizmo',
            'description' => 'Security fixture.',
            'category' => 'misc',
            'price' => $price,
            'stock_quantity' => $stock,
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return $id;
    }

    private function placeOrder(string $productId, int $qty = 2, array $extra = []): \Illuminate\Testing\TestResponse
    {
        return $this->postJson('/api/product-orders', array_merge([
            'items' => [['product_id' => $productId, 'quantity' => $qty]],
            'shipping_address' => '1 Test Way',
        ], $extra));
    }

    public function test_guest_cannot_touch_protected_mutations(): void
    {
        $productId = $this->seedProduct();

        $this->postJson('/api/product-orders', [
            'items' => [['product_id' => $productId, 'quantity' => 1]],
            'shipping_address' => 'x',
        ])->assertStatus(401);

        $this->getJson('/api/admin/stats')->assertStatus(401);
        $this->postJson('/api/admin/cms/pages', ['title' => 'x'])->assertStatus(401);
    }

    public function test_plain_user_cannot_use_the_cms_console(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/admin/cms/pages', ['title' => 'Nope'])->assertStatus(403);
        $this->putJson('/api/admin/cms/pages/' . (string) Str::uuid() . '/blocks', ['blocks' => []])
            ->assertStatus(403);
    }

    public function test_cross_user_order_access_is_denied(): void
    {
        $productId = $this->seedProduct();

        $alice = $this->createUser();
        $this->actingAs($alice, 'sanctum');
        $orderId = $this->placeOrder($productId)->assertStatus(201)->json('data.id');
        $this->assertNotEmpty($orderId);

        $bob = $this->createUser();
        $this->actingAs($bob, 'sanctum');

        $this->getJson('/api/product-orders/' . $orderId)->assertStatus(403);
        $this->postJson('/api/product-orders/' . $orderId . '/cancel')->assertStatus(403);
    }

    public function test_cross_vendor_order_access_is_denied(): void
    {
        $vendorA = $this->createUser();
        $this->assignRole($vendorA, 'vendor_admin');
        $shopA = $this->createVendor($vendorA, ['store_name' => 'Shop A']);

        $vendorB = $this->createUser();
        $this->assignRole($vendorB, 'vendor_admin');
        $this->createVendor($vendorB, ['store_name' => 'Shop B']);

        $rowId = (string) Str::uuid();
        DB::table('vendor_orders')->insert([
            'id' => $rowId,
            'vendor_id' => $shopA->id,
            'customer_id' => $this->createUser()->id,
            'product_name' => 'Shop A item',
            'quantity' => 1,
            'unit_price' => 10,
            'total_price' => 10,
            'order_number' => 'WQ-' . Str::random(8),
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($vendorB, 'sanctum');
        $this->getJson('/api/vendor/orders/' . $rowId)->assertStatus(403);
    }

    public function test_order_totals_come_from_the_server_not_the_client(): void
    {
        $productId = $this->seedProduct(100, 5);

        $this->actingAsUser();
        // Smuggled price fields are not even accepted as input, let alone honored.
        $orderId = $this->placeOrder($productId, 2, ['unit_price' => 1, 'total_price' => 2])
            ->assertStatus(201)
            ->json('data.id');

        $this->assertSame(100.0, (float) DB::table('order_items')->where('order_id', $orderId)->value('unit_price'));
        $this->assertSame(200.0, (float) DB::table('orders')->where('id', $orderId)->value('total_amount'));
    }

    public function test_wallet_rejects_negative_amounts(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/wallet/deposit', ['amount' => -50, 'payment_method' => 'card'])
            ->assertStatus(422);
        $this->postJson('/api/wallet/deposit', ['amount' => 0, 'payment_method' => 'card'])
            ->assertStatus(422);
    }

    public function test_payment_replay_with_the_same_idempotency_key_moves_money_once(): void
    {
        $this->actingAsUser();
        $key = 'waveq-replay-' . Str::random(10);

        $first = $this->postJson('/api/payments/charge', [
            'amount' => 25,
            'method' => 'card',
            'idempotency_key' => $key,
        ])->assertStatus(201);

        $second = $this->postJson('/api/payments/charge', [
            'amount' => 25,
            'method' => 'card',
            'idempotency_key' => $key,
        ])->assertStatus(201);

        $this->assertSame($first->json('data.id'), $second->json('data.id'));
        $this->assertSame(1, DB::table('payments')->where('idempotency_key', $key)->count());
    }

    public function test_upload_rejects_executables_oversize_and_bad_mime(): void
    {
        $this->actingAsUser();

        $this->postJson('/api/upload', ['file' => UploadedFile::fake()->create('evil.php', 100, 'application/x-php')])
            ->assertStatus(422);
        $this->postJson('/api/upload', ['file' => UploadedFile::fake()->create('evil.exe', 100, 'application/x-msdownload')])
            ->assertStatus(422);
        $this->postJson('/api/upload', ['file' => UploadedFile::fake()->create('huge.png', 11000, 'image/png')])
            ->assertStatus(422);

        $this->postJson('/api/upload', ['file' => UploadedFile::fake()->image('ok.png')])
            ->assertStatus(201);
    }

    public function test_cms_rejects_executable_content_but_keeps_prose(): void
    {
        $this->actingAsUser('content_admin');

        $this->postJson('/api/admin/cms/pages', [
            'title' => 'XSS page',
            'content' => '<script>alert(1)</script>',
        ])->assertStatus(422);

        $this->postJson('/api/admin/cms/pages', [
            'title' => 'PHP page',
            'content' => "<?php echo 'pwned'; ?>",
        ])->assertStatus(422);

        // Plain prose — including the word JavaScript — stays legal.
        $this->postJson('/api/admin/cms/pages', [
            'title' => 'Learn JavaScript basics',
            'content' => 'JavaScript is a programming language. Use <b>bold</b> safely.',
        ])->assertStatus(201);
    }

    public function test_cms_blocks_reject_unknown_types_bad_urls_and_scripts(): void
    {
        $this->actingAsUser('content_admin');

        $pageId = $this->postJson('/api/admin/cms/pages', ['title' => 'Block page'])
            ->assertStatus(201)
            ->json('data.id');

        $put = fn (array $blocks) => $this->putJson(
            '/api/admin/cms/pages/' . $pageId . '/blocks',
            ['blocks' => $blocks]
        );

        $put([['type' => 'nope_not_a_block', 'data' => []]])->assertStatus(422);

        $put([['type' => 'cta', 'data' => [
            'heading' => 'Hi',
            'body' => 'Body copy.',
            'button_label' => 'Go',
            'button_url' => 'javascript:alert(1)',
        ]]])->assertStatus(422);

        $put([['type' => 'cta', 'data' => [
            'heading' => 'Hi <script>alert(1)</script>',
            'body' => 'Body copy.',
            'button_label' => 'Go',
            'button_url' => 'https://example.com/sale',
        ]]])->assertStatus(422);

        $put([['type' => 'cta', 'data' => [
            'heading' => 'Summer sale',
            'body' => 'Body copy.',
            'button_label' => 'Shop now',
            'button_url' => 'https://example.com/sale',
        ]]])->assertOk();
    }

    public function test_unsafe_image_urls_are_rejected(): void
    {
        $this->actingAsUser('category_admin');

        $this->postJson('/api/categories', [
            'name' => 'WaveQ URL Cat',
            'image_url' => 'javascript:alert(1)',
        ])->assertStatus(422);
    }

    public function test_injection_payloads_are_inert(): void
    {
        // SQLi-shaped search: parameterized, never a 500.
        $this->getJson('/api/search?q=' . urlencode("' OR '1'='1"))->assertOk();
        $this->getJson('/api/search?q=' . urlencode('x"; DROP TABLE users; --'))->assertOk();

        // XSS-shaped search: 200, echoed nowhere executable.
        $this->getJson('/api/search?q=' . urlencode('<script>alert(1)</script>'))->assertOk();

        // SQLi-shaped login never authenticates.
        $login = $this->postJson('/api/auth/login', [
            'email' => "' OR 1=1 --",
            'password' => 'anything',
        ]);
        $this->assertNotSame(200, $login->getStatusCode());
        $this->assertNull($login->json('data.access_token'));

        // XSS-shaped review stores verbatim (React escapes at render; the API
        // must neither execute it nor mangle it).
        $this->actingAsUser();
        $productId = $this->seedProduct();
        $res = $this->postJson('/api/reviews', [
            'reviewable_type' => 'product',
            'reviewable_id' => $productId,
            'rating' => 5,
            'comment' => '<script>alert(1)</script> great gizmo',
        ])->assertStatus(201);
        $this->assertSame(
            '<script>alert(1)</script> great gizmo',
            DB::table('reviews')->where('id', $res->json('data.id'))->value('comment')
        );
    }
}
