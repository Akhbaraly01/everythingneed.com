<?php

namespace Tests\Feature\Admin;

use App\Models\User;
use App\Models\UserRole;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use Modules\Vendors\Entities\Vendor;
use Tests\TestCase;

/**
 * W3 detail-route contract: /admin/{orders|vendors|users|payouts}/{id} are
 * server-rendered inside the exact role group of their list page, reuse the
 * same scope-aware service contracts as the JSON show() endpoints, and never
 * leak row existence — missing and out-of-scope rows share one generic
 * non-leaking response (the app-wide web not-found flash), while role
 * denials follow the web convention: 302 to the caller's own landing.
 */
class AdminDetailRoutesTest extends TestCase
{
    use RefreshDatabase;

    private function roleUser(string $role): User
    {
        $user = User::factory()->create();
        UserRole::create(['user_id' => $user->id, 'role' => $role]);

        return $user;
    }

    /**
     * bootstrap/app.php renders NotFoundHttpException for non-JSON requests
     * as a redirect carrying a generic flash (never a row-revealing page) —
     * missing and out-of-scope rows are therefore indistinguishable.
     */
    private function assertWebNotFound(\Illuminate\Testing\TestResponse $response): void
    {
        $response->assertStatus(302)
            ->assertSessionHas('error', 'The requested resource was not found.');
    }

    private function vendorFor(User $owner): Vendor
    {
        return Vendor::create([
            'user_id' => $owner->id,
            'store_name' => 'W3 Detail Store',
            'category' => 'general',
            'is_verified' => true,
        ]);
    }

    /**
     * @return array{id: string, customer: User, vendor: Vendor}
     */
    private function makeOrder(?string $customerId = null): array
    {
        $customer = User::factory()->create();
        $owner = User::factory()->create();
        $vendor = $this->vendorFor($owner);
        $id = (string) Str::uuid();

        DB::table('vendor_orders')->insert([
            'id' => $id,
            'vendor_id' => $vendor->id,
            'customer_id' => $customerId ?? $customer->id,
            'product_name' => 'W3 Widget',
            'quantity' => 2,
            'unit_price' => 25,
            'total_price' => 50,
            'order_number' => 'W3-' . strtoupper(Str::random(8)),
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['id' => $id, 'customer' => $customer, 'vendor' => $vendor];
    }

    /**
     * @return array{id: string, vendor: Vendor}
     */
    private function makeWithdrawal(): array
    {
        $owner = User::factory()->create();
        $vendor = $this->vendorFor($owner);
        $id = (string) Str::uuid();

        DB::table('vendor_withdrawals')->insert([
            'id' => $id,
            'vendor_id' => $vendor->id,
            'amount' => 120,
            'status' => 'pending',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['id' => $id, 'vendor' => $vendor];
    }

    public function test_order_detail_renders_with_payments_and_refunds(): void
    {
        $order = $this->makeOrder();

        $paymentId = (string) Str::uuid();
        DB::table('payments')->insert([
            'id' => $paymentId,
            'order_id' => $order['id'],
            'user_id' => $order['customer']->id,
            'amount' => 50,
            'currency' => 'USD',
            'status' => 'succeeded',
            'method' => 'card',
            'reference' => 'PAY-' . strtoupper(Str::random(10)),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        DB::table('refunds')->insert([
            'id' => (string) Str::uuid(),
            'payment_id' => $paymentId,
            'amount' => 25,
            'status' => 'completed',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->roleUser('orders_admin');

        $this->actingAs($admin, 'web')->get('/admin/orders/' . $order['id'])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/OrderDetail')
                ->where('order.id', $order['id'])
                ->has('items', 0)
                ->has('payments', 1)
                ->where('payments.0.status', 'succeeded')
                ->has('refunds', 1)
                ->where('refunds.0.status', 'completed'));
    }

    public function test_order_detail_404s_for_missing_order(): void
    {
        $admin = $this->roleUser('orders_admin');

        $this->assertWebNotFound(
            $this->actingAs($admin, 'web')->get('/admin/orders/' . Str::uuid())
        );
    }

    public function test_order_detail_404s_for_rows_outside_the_own_scope(): void
    {
        $viewer = $this->roleUser('orders_admin');
        $own = $this->makeOrder($viewer->id);
        $foreign = $this->makeOrder();

        DB::table('permission_scopes')->insert([
            'id' => (string) Str::uuid(),
            'holder_type' => 'user',
            'holder_id' => $viewer->id,
            'permission' => 'orders.orders.view',
            'scope' => 'own',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $this->actingAs($viewer, 'web')->get('/admin/orders/' . $own['id'])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page->where('order.id', $own['id']));

        // Non-leaking: a scoped-out row is indistinguishable from a missing one.
        $this->assertWebNotFound(
            $this->actingAs($viewer, 'web')->get('/admin/orders/' . $foreign['id'])
        );
    }

    public function test_order_detail_is_denied_for_roles_outside_the_orders_group(): void
    {
        $order = $this->makeOrder();
        $editor = $this->roleUser('content_manager');

        $this->actingAs($editor, 'web')->get('/admin/orders/' . $order['id'])
            ->assertStatus(302);
    }

    public function test_vendor_detail_renders_owner_and_stats_matching_the_list(): void
    {
        $owner = User::factory()->create(['name' => 'Vendor Owner']);
        $vendor = $this->vendorFor($owner);
        DB::table('products')->insert([
            'id' => (string) Str::uuid(),
            'vendor_id' => $vendor->id,
            'name' => 'Shelf Product',
            'category' => 'general',
            'price' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        $this->makeOrderFor($vendor);

        $admin = $this->roleUser('platform_ops');

        $this->actingAs($admin, 'web')->get('/admin/vendors/' . $vendor->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/VendorDetail')
                ->where('vendor.store_name', 'W3 Detail Store')
                ->where('owner.id', $owner->id)
                ->where('stats.products', 1)
                ->where('stats.orders', 1)
                ->has('recentProducts', 1)
                ->has('recentOrders', 1));
    }

    public function test_vendor_detail_404s_for_missing_vendor_and_denies_outside_roles(): void
    {
        $platform = $this->roleUser('platform_ops');
        $this->assertWebNotFound(
            $this->actingAs($platform, 'web')->get('/admin/vendors/' . Str::uuid())
        );

        $vendor = $this->vendorFor(User::factory()->create());
        $editor = $this->roleUser('content_manager');
        $this->actingAs($editor, 'web')->get('/admin/vendors/' . $vendor->id)
            ->assertStatus(302);
    }

    public function test_user_detail_renders_roles_grants_and_stats(): void
    {
        $subject = User::factory()->create();
        UserRole::create(['user_id' => $subject->id, 'role' => 'worker']);
        DB::table('user_permissions')->insert([
            'id' => (string) Str::uuid(),
            'user_id' => $subject->id,
            'permission' => 'orders.orders.view',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $admin = $this->roleUser('security_admin');

        $this->actingAs($admin, 'web')->get('/admin/users/' . $subject->id)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/UserDetail')
                ->where('user.id', $subject->id)
                ->has('roles', 1)
                ->where('roles.0', 'worker')
                ->has('grants', 1)
                ->where('grants.0.permission', 'orders.orders.view'));
    }

    public function test_user_detail_404s_for_missing_user_and_denies_outside_roles(): void
    {
        $security = $this->roleUser('security_admin');
        $this->assertWebNotFound(
            $this->actingAs($security, 'web')->get('/admin/users/' . Str::uuid())
        );

        $subject = User::factory()->create();
        $finance = $this->roleUser('finance_admin');
        $this->actingAs($finance, 'web')->get('/admin/users/' . $subject->id)
            ->assertStatus(302);
    }

    public function test_payout_detail_renders_with_vendor_context(): void
    {
        $withdrawal = $this->makeWithdrawal();

        $reviewer = $this->roleUser('payout_reviewer');

        $this->actingAs($reviewer, 'web')->get('/admin/payouts/' . $withdrawal['id'])
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('admin/PayoutDetail')
                ->where('withdrawal.id', $withdrawal['id'])
                ->where('withdrawal.status', 'pending')
                ->where('vendor.store_name', 'W3 Detail Store')
                ->has('recentWithdrawals', 1));
    }

    public function test_payout_detail_404s_for_missing_payout_and_denies_outside_roles(): void
    {
        $reviewer = $this->roleUser('wallet_admin');
        $this->assertWebNotFound(
            $this->actingAs($reviewer, 'web')->get('/admin/payouts/' . Str::uuid())
        );

        $withdrawal = $this->makeWithdrawal();
        $editor = $this->roleUser('content_manager');
        $this->actingAs($editor, 'web')->get('/admin/payouts/' . $withdrawal['id'])
            ->assertStatus(302);
    }

    public function test_soft_deleted_withdrawal_is_not_reachable(): void
    {
        $withdrawal = $this->makeWithdrawal();
        DB::table('vendor_withdrawals')->where('id', $withdrawal['id'])->update(['deleted_at' => now()]);

        $reviewer = $this->roleUser('payout_reviewer');

        $this->assertWebNotFound(
            $this->actingAs($reviewer, 'web')->get('/admin/payouts/' . $withdrawal['id'])
        );
    }

    /**
     * @return array{id: string}
     */
    private function makeOrderFor(Vendor $vendor): array
    {
        $customer = User::factory()->create();
        $id = (string) Str::uuid();

        DB::table('vendor_orders')->insert([
            'id' => $id,
            'vendor_id' => $vendor->id,
            'customer_id' => $customer->id,
            'product_name' => 'Vendor Row',
            'quantity' => 1,
            'unit_price' => 15,
            'total_price' => 15,
            'order_number' => 'W3V-' . strtoupper(Str::random(8)),
            'status' => 'delivered',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return ['id' => $id];
    }
}
