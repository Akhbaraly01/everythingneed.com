<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\Wallet;
use App\Models\WalletTransaction;

class WalletPageController extends Controller
{
    public function index(Request $request): Response
    {
        $userId = $request->user()->id;

        $wallet = Wallet::firstOrCreate(
            ['user_id' => $userId],
            ['balance' => 0, 'currency' => 'USD']
        );

        $transactions = WalletTransaction::where('wallet_id', $wallet->id)
            ->orderByDesc('created_at')
            ->paginate(20);

        return Inertia::render('wallet/Index', [
            'wallet' => $wallet,
            'transactions' => $transactions,
        ]);
    }
}
