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
            $request->get('per_page', 15),
            $request->get('q'),
            $request->get('profession'),
            $request->boolean('virtual')
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

    /**
     * Admin console: full provider profile edit.
     *
     * PUT /api/admin/healthcare/doctors/{id}
     * (role: super_admin, administrator, healthcare_admin)
     */
    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $doctor = \Modules\Healthcare\Entities\Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        $validated = $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'specialization' => 'sometimes|string|max:100',
            'profession' => 'sometimes|string|in:doctor,nurse,chew,dentist,pharmacist,medical_laboratory_scientist,physiotherapist,optometrist,midwife,dietitian,psychologist,other',
            'qualification' => 'sometimes|string|max:255',
            'experience_years' => 'sometimes|integer|min:0',
            'consultation_fee' => 'sometimes|numeric|min:0',
            'virtual_fee' => 'nullable|numeric|min:0',
            'home_visit_fee' => 'nullable|numeric|min:0',
            'avatar_url' => 'nullable|url|max:500',
            'is_available' => 'sometimes|boolean',
        ]);

        if ($validated === []) {
            return response()->json(['message' => 'No changes provided'], 422);
        }

        $doctor->update($validated);

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'update',
                'entity_type' => 'doctor',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => $validated,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break the update.
        }

        return response()->json([
            'message' => 'Doctor updated successfully',
            'data' => new DoctorResource($doctor->fresh()),
        ]);
    }

    /**
     * Admin console: remove a provider. Soft delete; refused while health
     * tickets reference the doctor so history keeps resolving.
     *
     * DELETE /api/admin/healthcare/doctors/{id}
     * (role: super_admin, administrator, healthcare_admin)
     */
    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        $doctor = \Modules\Healthcare\Entities\Doctor::find($id);

        if (!$doctor) {
            return response()->json(['message' => 'Doctor not found'], 404);
        }

        if ($doctor->healthTickets()->exists()) {
            return response()->json([
                'message' => 'This doctor has appointments and cannot be deleted. Set availability to off instead.',
            ], 422);
        }

        $name = $doctor->full_name;
        $doctor->delete();

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'delete',
                'entity_type' => 'doctor',
                'entity_id' => $id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['full_name' => $name],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break deletion.
        }

        return response()->json(['message' => 'Doctor deleted']);
    }
}
