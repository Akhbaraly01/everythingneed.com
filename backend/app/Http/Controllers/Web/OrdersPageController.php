<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Orders\Entities\Order;

class OrdersPageController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::with('items:id,order_id,product_name,quantity,total_price')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return Inertia::render('orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function show(Request $request, string $id): Response
    {
        $order = Order::with([
            'items.product:id,name,image_url',
            'items.variant:id,name',
            'tracking',
            'payments:id,order_id,user_id,amount,currency,status,method,reference,created_at',
        ])->findOrFail($id);

        abort_unless(
            (string) $order->user_id === (string) $request->user()->id,
            403,
            'This order belongs to another account.'
        );

        return Inertia::render('orders/Show', [
            'order' => $order,
        ]);
    }
}
