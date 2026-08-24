<?php

namespace Modules\Healthcare\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Healthcare\Services\HealthcareService;
use Modules\Healthcare\Http\Requests\BookAppointmentRequest;
use Modules\Healthcare\Http\Requests\StoreDoctorRequest;
use Modules\Healthcare\Http\Resources\DoctorResource;
use Modules\Healthcare\Http\Resources\AppointmentResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DoctorController extends Controller
{
    public function __construct(
        private HealthcareService $healthcareService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $doctors = $this->healthcareService->getDoctors(
            $request->get('specialization'),
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => DoctorResource::collection($doctors->items()),
            'meta' => [
                'current_page' => $doctors->currentPage(),
                'last_page' => $doctors->lastPage(),
                'per_page' => $doctors->perPage(),
                'total' => $doctors->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        if (!\Illuminate\Support\Str::isUuid($id)) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $doctor = $this->healthcareService->getDoctor($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        return response()->json([
            'data' => new DoctorResource($doctor),
        ]);
    }

    public function store(StoreDoctorRequest $request): JsonResponse
    {
        $doctor = $this->healthcareService->createDoctor($request->validated());

        return response()->json([
            'message' => 'Doctor created successfully',
            'data' => new DoctorResource($doctor),
        ], 201);
    }

    /**
     * Weekly availability slots for a doctor (from expert_availability).
     */
    public function availability(string $id): JsonResponse
    {
        $doctor = \Modules\Healthcare\Entities\Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $slots = \Modules\Experts\Entities\ExpertAvailability::where('expert_type', 'doctor')
            ->where('expert_id', $doctor->id)
            ->where('is_available', true)
            ->get();

        return response()->json(['data' => $slots]);
    }

    public function setAvailability(Request $request, string $id): JsonResponse
    {
        $doctor = \Modules\Healthcare\Entities\Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $user = $request->user();
        $isOwnDoctor = $doctor->user_id && $doctor->user_id === $user->id;
        if (!$isOwnDoctor && !$user->hasRole('super_admin') && !$user->hasRole('administrator') && !$user->hasRole('healthcare_admin')) {
            return response()->json(['message' => 'Only this doctor or an administrator can set availability'], 403);
        }

        $validated = $request->validate([
            'slots' => 'required|array|min:1',
            'slots.*.day_of_week' => 'required|integer|min:0|max:6',
            'slots.*.start_time' => 'required|string|max:5',
            'slots.*.end_time' => 'required|string|max:5',
        ]);

        \Modules\Experts\Entities\ExpertAvailability::where('expert_type', 'doctor')
            ->where('expert_id', $doctor->id)
            ->delete();

        foreach ($validated['slots'] as $slot) {
            \Modules\Experts\Entities\ExpertAvailability::create([
                'expert_type' => 'doctor',
                'expert_id' => $doctor->id,
                'is_available' => true,
                'status_message' => "Day {$slot['day_of_week']}: {$slot['start_time']}-{$slot['end_time']}",
            ]);
        }

        return response()->json([
            'message' => 'Availability updated',
            'data' => \Modules\Experts\Entities\ExpertAvailability::where('expert_type', 'doctor')
                ->where('expert_id', $doctor->id)->get(),
        ], 201);
    }
}
