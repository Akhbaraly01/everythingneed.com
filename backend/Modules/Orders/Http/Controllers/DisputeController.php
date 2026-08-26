<?php

namespace Modules\Orders\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Orders\Entities\Dispute;

class DisputeController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $disputes = Dispute::where('user_id', $request->user()->id)
            ->with('order')
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $disputes->items(),
            'meta' => [
                'current_page' => $disputes->currentPage(),
                'last_page' => $disputes->lastPage(),
                'total' => $disputes->total(),
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'order_id' => 'nullable|uuid|exists:orders,id',
            'subject' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
        ]);

        $dispute = Dispute::create([
            'user_id' => $request->user()->id,
            'order_id' => $request->order_id,
            'subject' => $request->subject,
            'description' => $request->description,
            'status' => 'open',
        ]);

        return response()->json(['data' => $dispute], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::with('order')->find($id);

        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        return response()->json(['data' => $dispute]);
    }

    public function resolve(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $request->validate([
            'resolution' => 'required|in:refund,replacement,credit,dismissed',
            'resolution_notes' => 'nullable|string|max:2000',
        ]);

        $dispute->update([
            'status' => 'resolved',
            'resolution' => $request->resolution,
            'resolution_notes' => $request->resolution_notes,
        ]);

        return response()->json(['data' => $dispute]);
    }

    public function close(Request $request, string $id): JsonResponse
    {
        $dispute = Dispute::find($id);
        if (!$dispute || $dispute->user_id !== $request->user()->id) {
            return response()->json(['message' => 'Dispute not found'], 404);
        }

        $dispute->update(['status' => 'closed']);

        return response()->json(['data' => $dispute]);
    }
}
