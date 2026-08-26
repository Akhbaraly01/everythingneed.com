<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Orders\Entities\ReturnRequest;
use Modules\Orders\Entities\Order;

class ReturnRequestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $userId = $request->user()->id;

        $returns = ReturnRequest::where('user_id', $userId)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $returns->items(),
            'meta' => [
                'current_page' => $returns->currentPage(),
                'last_page' => $returns->lastPage(),
                'total' => $returns->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'required|uuid|exists:orders,id',
            'order_item_id' => 'nullable|uuid',
            'reason' => 'required|string|max:500',
            'description' => 'nullable|string|max:2000',
        ]);

        $order = Order::findOrFail($request->order_id);

        if ($order->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Not your order'], 403);
        }

        if (!in_array($order->status, ['delivered', 'completed'])) {
            return response()->json(['message' => 'Order must be delivered before a return can be requested'], 422);
        }

        $existing = ReturnRequest::where('order_id', $order->id)
            ->where('user_id', $request->user()->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($existing) {
            return response()->json(['message' => 'A pending return already exists for this order'], 422);
        }

        $return = ReturnRequest::create([
            'order_id' => $order->id,
            'order_item_id' => $request->order_item_id,
            'user_id' => $request->user()->id,
            'vendor_id' => $order->items->first()?->vendor_id,
            'reason' => $request->reason,
            'description' => $request->description,
            'status' => 'pending',
        ]);

        return response()->json(['data' => $return], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $return = ReturnRequest::with('order')->find($id);

        if (!$return || $return->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Return request not found'], 404);
        }

        return response()->json(['data' => $return]);
    }

    public function approve(Request $request, string $id): JsonResponse
    {
        $return = ReturnRequest::find($id);
        if (!$return) {
            return response()->json(['message' => 'Return request not found'], 404);
        }

        $return->update([
            'status' => 'approved',
            'admin_notes' => $request->admin_notes,
            'refund_amount' => $request->refund_amount,
        ]);

        return response()->json(['data' => $return]);
    }

    public function reject(Request $request, string $id): JsonResponse
    {
        $return = ReturnRequest::find($id);
        if (!$return) {
            return response()->json(['message' => 'Return request not found'], 404);
        }

        $return->update([
            'status' => 'rejected',
            'admin_notes' => $request->admin_notes,
        ]);

        return response()->json(['data' => $return]);
    }
}
