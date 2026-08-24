<?php

namespace Modules\Pharmacy\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Pharmacy\Entities\Prescription;

class PrescriptionController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Prescription::where('patient_id', $request->user()->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $prescriptions = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15));

        return response()->json([
            'data' => $prescriptions->items(),
            'meta' => [
                'current_page' => $prescriptions->currentPage(),
                'last_page' => $prescriptions->lastPage(),
                'per_page' => $prescriptions->perPage(),
                'total' => $prescriptions->total(),
            ],
        ]);
    }
}
