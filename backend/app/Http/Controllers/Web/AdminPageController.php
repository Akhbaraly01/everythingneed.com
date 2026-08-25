<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class AdminPageController extends Controller
{
    public function approvals(): Response
    {
        $pending = DB::table('products')
            ->leftJoin('vendors', 'vendors.id', '=', 'products.vendor_id')
            ->whereNull('products.approved_at')
            ->orderBy('products.created_at')
            ->select(
                'products.id',
                'products.name',
                'products.category',
                'products.price',
                'products.stock_quantity',
                'products.created_at',
                'vendors.store_name as vendor_name',
            )
            ->limit(100)
            ->get();

        $recentDecisions = DB::table('rejected_products')
            ->join('products', 'products.id', '=', 'rejected_products.product_id')
            ->orderByDesc('rejected_products.created_at')
            ->limit(15)
           ->select(
                'rejected_products.id',
                'products.name as product_name',
                'rejected_products.reason',
                'rejected_products.created_at',
            )
            ->get();

        return Inertia::render('admin/Approvals', [
            'pending' => $pending,
            'recentDecisions' => $recentDecisions,
        ]);
    }
}
