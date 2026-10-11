<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Healthcare\Entities\Consultation;

/**
 * Compat endpoints for deep Inertia pages (labs / consultations shorthands).
 * Previously route closures.
 */
class HealthCompatController extends Controller
{
    /**
     * Emergency & support information (spec 21), driven by config/health.php
     * with a country lookup and a generic fallback.
     */
    public function emergency(Request $request): JsonResponse
    {
        $country = strtoupper((string) $request->get('country', 'DEFAULT'));

        return response()->json(['data' => [
            'country' => $country,
            'numbers' => config('health.emergency_numbers.'.$country, config('health.emergency_numbers.DEFAULT', [])),
            'support' => config('health.support_blurb'),
        ]]);
    }

    /**
     * The current patient's consultations.
     */
    public function consultations(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['data' => []]);
        }

        $consultations = Consultation::whereHas('ticket', fn ($q) => $q->where('patient_id', $user->id))
            ->with('ticket')
            ->get();

        return response()->json(['data' => $consultations]);
    }

    /**
     * Admin view: every consultation record with patient + doctor (console).
     */
    public function adminConsultations(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'page'   => ['nullable', 'integer', 'min:1'],
        ]);

        $query = \Illuminate\Support\Facades\DB::table('consultations as c')
            ->join('health_tickets as ht', 'ht.id', '=', 'c.ticket_id')
            ->leftJoin('users as u', 'u.id', '=', 'ht.patient_id')
            ->leftJoin('doctors as d', 'd.id', '=', 'ht.doctor_id')
            ->select([
                'c.id', 'c.diagnosis', 'c.notes', 'c.follow_up_date', 'c.created_at',
                'ht.ticket_number', 'ht.consultation_type',
                'u.name as patient_name', 'd.full_name as doctor_name',
            ])
            ->whereNull('c.deleted_at')
            ->orderByDesc('c.created_at');

        if (is_string($validated['search'] ?? null) && $validated['search'] !== '') {
            $search = $validated['search'];
            $query->where(function ($q) use ($search) {
                $q->where('ht.ticket_number', 'ilike', "%{$search}%")
                    ->orWhere('u.name', 'ilike', "%{$search}%")
                    ->orWhere('d.full_name', 'ilike', "%{$search}%");
            });
        }

        $total = (clone $query)->count();
        $page = (int) ($validated['page'] ?? 1);
        $rows = $query->offset(($page - 1) * 15)->limit(15)->get();

        return response()->json([
            'data'  => $rows,
            'total' => $total,
            'meta'  => ['page' => $page, 'per_page' => 15, 'total' => $total],
        ]);
    }
}
