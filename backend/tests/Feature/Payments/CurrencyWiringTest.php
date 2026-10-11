<?php

namespace Tests\Feature\Payments;

use Core\Support\Currencies;
use Modules\Orders\Entities\Order;
use Modules\Payments\Entities\Payment;
use Modules\Payments\Services\PaymentService;
use Modules\Products\Entities\Product;
use Modules\Vendors\Entities\Vendor;
use Modules\Wallet\Services\WalletService;
use Tests\TestCase;

/**
 * Spec 90: no hard-coded currency assumptions in business logic -
 * platform default is config-driven (APP_CURRENCY), stored rows keep
 * their own currency, and gateway charges are provider-aware.
 */
class CurrencyWiringTest extends TestCase
{
    public function test_default_currency_follows_app_currency_config(): void
    {
        config()->set('app.currency', null);
        $this->assertSame('USD', Currencies::default());

        config()->set('app.currency', 'NGN');
        $this->assertSame('NGN', Currencies::default());

        config()->set('app.currency', 'eur');
        $this->assertSame('EUR', Currencies::default());
    }

    public function test_product_order_carries_the_product_currency(): void
    {
        $vendorUser = $this->createVendorUser();
        $vendor = Vendor::create([
            'user_id' => $vendorUser->id,
            'store_name' => fake()->company(),
            'category' => 'electronics',
            'is_verified' => true,
        ]);
        $product = Product::create([
            'vendor_id' => $vendor->id,
            'name' => 'Currency Probe',
            'description' => 'EUR product',
            'category' => 'electronics',
            'price' => 20.00,
            'currency' => 'EUR',
            'stock_quantity' => 5,
            'is_active' => true,
        ]);

        $customer = $this->actingAsUser();
        $response = $this->postJson('/api/product-orders', [
            'items' => [['product_id' => $product->id, 'quantity' => 1]],
            'shipping_address' => '1 Test St',
        ]);

        $response->assertStatus(201);
        $order = Order::find($response->json('data.id'));
        $this->assertSame('EUR', $order->currency);
    }

    public function test_charge_without_currency_uses_platform_default(): void
    {
        config()->set('app.currency', 'NGN');
        $user = $this->createUser();

        $payment = app(PaymentService::class)->charge([
            'user_id' => (string) $user->id,
            'amount' => 5.0,
            'method' => 'card',
            'idempotency_key' => 'currency-probe-'.uniqid(),
            'purpose' => 'wallet_deposit',
        ]);

        $this->assertSame('NGN', $payment->currency);
    }

    public function test_wallet_deposit_charges_in_the_wallets_own_currency(): void
    {
        $user = $this->createUser();
        $walletService = app(WalletService::class);
        $wallet = $walletService->getWallet($user->id);
        $wallet->update(['currency' => 'EUR']);

        $walletService->deposit($user->id, 10.0, 'card');

        $payment = Payment::where('idempotency_key', 'like', 'WALLET-DEP-%')
            ->where('user_id', $user->id)
            ->latest('created_at')
            ->first();

        $this->assertNotNull($payment);
        $this->assertSame('EUR', $payment->currency);
        $this->assertSame('succeeded', $payment->status);
    }
}
