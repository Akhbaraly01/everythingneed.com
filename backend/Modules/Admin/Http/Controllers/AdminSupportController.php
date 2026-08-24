<?php

namespace Modules\Admin\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AdminSupportController extends Controller
{
    public function tickets(Request $request): JsonResponse
    {
        $query = DB::table('support_tickets')->orderByDesc('created_at');

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject', 'ilike', "%{$search}%")
                  ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $total = $query->count();
        $tickets = $query->offset(($request->get('page', 1) - 1) * 15)->limit(15)->get();

        return response()->json([
            'data' => $tickets,
            'total' => $total,
        ]);
    }

    public function assign(Request $request, string $id): JsonResponse
    {
        $request->validate(['assigned_to' => 'required|string']);

        DB::table('support_tickets')
            ->where('id', $id)
            ->update([
                'assigned_to' => $request->assigned_to,
                'status' => 'in_progress',
                'updated_at' => now(),
            ]);

        return response()->json(['message' => 'Ticket assigned successfully']);
    }
}
