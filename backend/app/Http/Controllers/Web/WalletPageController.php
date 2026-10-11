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
            ['balance' => 0, 'currency' => \Core\Support\Currencies::default()]
        );

        $type = $request->get('type');
        $typeFilter = in_array($type, ['credit', 'debit'], true) ? $type : 'all';

        $query = WalletTransaction::where('wallet_id', $wallet->id);
        if ($typeFilter !== 'all') {
            $query->where('type', $typeFilter);
        }
        $transactions = $query->orderByDesc('created_at')
            ->paginate(20);

        $available = app(\Core\Services\Contracts\WalletServiceInterface::class)
            ->getAvailableBalance($userId);
        $balance = (float) $wallet->balance;

        return Inertia::render('wallet/Index', [
            'wallet' => $wallet,
            'available' => $available,
            'pending' => max(0, round($balance - $available, 2)),
            'transactions' => $transactions,
            'typeFilter' => $typeFilter,
        ]);
    }
}
