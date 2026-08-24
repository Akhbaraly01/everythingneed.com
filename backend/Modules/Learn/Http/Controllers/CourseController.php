<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Modules\Learn\Services\LearnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CourseController extends Controller
{
    public function __construct(
        private LearnService $learnService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $courses = $this->learnService->getCourses(
            $request->only(['category', 'level', 'type']),
            $request->get('page', 1),
            $request->get('per_page', 15)
        );

        return response()->json([
            'data' => $courses->items(),
            'meta' => [
                'current_page' => $courses->currentPage(),
                'last_page' => $courses->lastPage(),
                'per_page' => $courses->perPage(),
                'total' => $courses->total(),
            ],
        ]);
    }

    public function show(string $id): JsonResponse
    {
        if (!\Illuminate\Support\Str::isUuid($id)) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        $course = $this->learnService->getCourse($id);

        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        return response()->json([
            'data' => $course,
        ]);
    }

    public function enroll(Request $request, string $courseId): JsonResponse
    {
        if (!\Illuminate\Support\Str::isUuid($courseId)) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        $enrollment = $this->learnService->enrollUser($courseId, $request->user()->id);

        return response()->json([
            'message' => 'Enrolled successfully',
            'data' => $enrollment,
        ], 201);
    }

    public function categories(): JsonResponse
    {
        $categories = \Modules\Learn\Entities\Course::query()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'data' => $categories->map(fn ($c) => ['name' => $c, 'slug' => \Illuminate\Support\Str::slug($c)])->values(),
        ]);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $enrollments = $this->learnService->getUserEnrollments($request->user()->id);

        return response()->json([
            'data' => $enrollments,
        ]);
    }
}
