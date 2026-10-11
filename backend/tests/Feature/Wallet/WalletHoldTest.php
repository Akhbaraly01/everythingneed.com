<?php

namespace Tests\Feature\Wallet;

use App\Models\User;
use App\Models\Wallet;
use App\Models\WalletHold;
use Core\Services\WalletService;
use Tests\TestCase;

class WalletHoldTest extends TestCase
{
    private WalletService $wallet;

    protected function setUp(): void
    {
        parent::setUp();
        $this->wallet = $this->app->make(WalletService::class);
    }

    public function test_hold_reserves_funds_without_deducting_balance(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');

        $hold = $this->wallet->hold($user->id, 30.00, 'HOLD-001', 'order reserve');

        $this->assertEquals('active', $hold->status);
        $this->assertEquals(30.00, (float) $hold->amount);
        $this->assertEquals(100.00, $this->wallet->getBalance($user->id));
        $this->assertEquals(70.00, $this->wallet->getAvailableBalance($user->id));
    }

    public function test_hold_insufficient_available_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);
        $this->expectExceptionMessage('Insufficient available balance.');

        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 50.00, 'REF-SEED');
        $this->wallet->hold($user->id, 40.00, 'HOLD-A');
        $this->wallet->hold($user->id, 20.00, 'HOLD-B');
    }

    public function test_hold_is_idempotent_by_reference(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');

        $a = $this->wallet->hold($user->id, 30.00, 'HOLD-IDEM');
        $b = $this->wallet->hold($user->id, 30.00, 'HOLD-IDEM');

        $this->assertEquals($a->id, $b->id);
        $this->assertEquals(1, WalletHold::where('reference', 'HOLD-IDEM')->count());
    }

    public function test_release_hold_restores_available_balance(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 40.00, 'HOLD-REL');

        $this->assertEquals(60.00, $this->wallet->getAvailableBalance($user->id));

        $hold = $this->wallet->releaseHold($user->id, 'HOLD-REL');

        $this->assertEquals('released', $hold->status);
        $this->assertNotNull($hold->released_at);
        $this->assertEquals(100.00, $this->wallet->getAvailableBalance($user->id));
        $this->assertEquals(100.00, $this->wallet->getBalance($user->id));
    }

    public function test_release_missing_hold_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = User::factory()->create();
        $this->wallet->releaseHold($user->id, 'NOPE');
    }

    public function test_capture_hold_debits_balance_and_marks_captured(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 35.00, 'HOLD-CAP');

        $result = $this->wallet->captureHold($user->id, 'HOLD-CAP');

        $this->assertEquals('captured', $result['hold']->status);
        $this->assertEquals('debit', $result['transaction']->type);
        $this->assertEquals(35.00, (float) $result['transaction']->amount);
        $this->assertEquals(65.00, $this->wallet->getBalance($user->id));
        $this->assertEquals(65.00, $this->wallet->getAvailableBalance($user->id));
    }

    public function test_capture_twice_throws(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 100.00, 'REF-SEED');
        $this->wallet->hold($user->id, 20.00, 'HOLD-2CAP');
        $this->wallet->captureHold($user->id, 'HOLD-2CAP');
        $this->wallet->captureHold($user->id, 'HOLD-2CAP');
    }

    public function test_multiple_holds_available_is_balance_minus_sum(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 200.00, 'REF-SEED');
        $this->wallet->hold($user->id, 50.00, 'HOLD-M1');
        $this->wallet->hold($user->id, 30.00, 'HOLD-M2');

        $this->assertEquals(120.00, $this->wallet->getAvailableBalance($user->id));
        $this->assertEquals(200.00, $this->wallet->getBalance($user->id));
    }

    public function test_list_holds_returns_paginated(): void
    {
        $user = User::factory()->create();
        $this->wallet->topUp($user->id, 500.00, 'REF-SEED');
        foreach (range(1, 3) as $i) {
            $this->wallet->hold($user->id, 10.00, "HOLD-L{$i}");
        }

        $page = $this->wallet->listHolds($user->id, 1, 2);

        $this->assertEquals(2, $page->count());
        $this->assertEquals(3, $page->total());
    }
}
