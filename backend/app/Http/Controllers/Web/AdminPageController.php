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

    public function departments(): Response
    {
        $departments = DB::table('departments')
            ->leftJoin('tickets', 'tickets.department_id', '=', 'departments.id')
            ->select(
                'departments.id',
                'departments.name',
                'departments.description',
                'departments.created_at',
                DB::raw('count(tickets.id) as tickets_count'),
            )
            ->groupBy('departments.id')
            ->orderBy('departments.name')
            ->get();

        return Inertia::render('admin/Departments', [
            'departments' => $departments,
        ]);
    }

    public function rbac(): Response
    {
        // Matrix is fetched client-side (super-admin-gated API) so the page
        // stays in sync after every grant/revoke without a full reload.
        return Inertia::render('admin/Rbac', [
            'catalog' => \Database\Seeders\PermissionSeeder::CATALOG,
        ]);
    }

    public function categories(): Response
    {
        $categories = DB::table('categories')
            ->orderBy('name')
            ->get();

        return Inertia::render('admin/Categories', [
            'categories' => $categories,
        ]);
    }
}
