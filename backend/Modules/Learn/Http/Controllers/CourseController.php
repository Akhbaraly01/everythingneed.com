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
            $request->only(['category', 'level', 'type', 'course_type', 'instructor_name', 'q', 'sort']),
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

    public function show(Request $request, string $id): JsonResponse
    {
        if (!\Illuminate\Support\Str::isUuid($id)) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        $course = $this->learnService->getCourse($id);

        if (!$course) {
            return response()->json(['message' => 'Course not found'], 404);
        }

        // L-B lifecycle: unpublished courses read as missing for the public.
        // Course managers preview them; already-enrolled learners keep access
        // to what they paid for.
        if ($course->status !== \Modules\Learn\Entities\Course::STATUS_PUBLISHED) {
            $user = $request->user();
            $canPreview = $user !== null && $user->hasPermission('learn.courses.manage');
            $enrolled = $user !== null
                && \Modules\Learn\Entities\Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->exists();

            if (!$canPreview && !$enrolled) {
                return response()->json(['message' => 'Course not found'], 404);
            }
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
            ->published()
            ->select('category')
            ->distinct()
            ->orderBy('category')
            ->pluck('category');

        return response()->json([
            'data' => $categories->map(fn ($c) => [
                'name' => $c,
                'slug' => \Illuminate\Support\Str::slug($c),
                'courses_count' => \Modules\Learn\Entities\Course::published()
                    ->where('category', $c)->count(),
            ])->values(),
        ]);
    }

    /**
     * Instructor directory derived from real courses (deep-link endpoint
     * below serves the profiles).
     */
    public function instructors(): JsonResponse
    {
        $rows = \Modules\Learn\Entities\Course::query()
            ->published()
            ->select('instructor_name')
            ->whereNotNull('instructor_name')
            ->distinct()
            ->orderBy('instructor_name')
            ->pluck('instructor_name');

        return response()->json([
            'data' => $rows->map(fn ($name) => [
                'id' => $name,
                'full_name' => $name,
                'courses_count' => \Modules\Learn\Entities\Course::published()
                    ->where('instructor_name', $name)->count(),
                'students_count' => (int) \Modules\Learn\Entities\Course::published()
                    ->where('instructor_name', $name)->sum('students_count'),
            ])->values(),
        ]);
    }

    public function myCourses(Request $request): JsonResponse
    {
        $enrollments = $this->learnService->getUserEnrollments($request->user()->id);

        return response()->json([
            'data' => $enrollments,
        ]);
    }

    /**
     * Instructor profile derived from their courses (deep-link endpoint).
     */
    public function instructor(string $id): JsonResponse
    {
        $name = urldecode($id);
        $course = \Modules\Learn\Entities\Course::where('instructor_name', 'ilike', $name)->first();
        if ($course === null && \Illuminate\Support\Str::isUuid($id)) {
            $course = \Modules\Learn\Entities\Course::where('id', $id)->first();
        }

        if (!$course || !filled($course->instructor_name)) {
            $user = \Illuminate\Support\Str::isUuid($id) ? \App\Models\User::find($id) : null;
            if ($user) {
                return response()->json(['data' => [
                    'id' => $user->id,
                    'full_name' => $user->name,
                    'bio' => null,
                    'avatar_url' => null,
                    'specialization' => null,
                    'courses_count' => 0,
                    'students_count' => 0,
                    'rating' => null,
                    'courses' => [],
                ]]);
            }

            return response()->json(['message' => 'Instructor not found'], 404);
        }

        $published = \Modules\Learn\Entities\Course::published()
            ->where('instructor_name', $course->instructor_name);

        $count = (clone $published)->count();
        $students = (int) (clone $published)->sum('students_count');
        $ratings = (clone $published)
            ->whereNotNull('rating')
            ->pluck('rating')
            ->filter(fn ($r) => $r > 0);

        // Spec 16: /learn/instructors/{id} is a real destination - the profile
        // carries the instructor's published catalogue, not just statistics.
        $courses = (clone $published)
            ->orderByDesc('students_count')
            ->orderByDesc('created_at')
            ->get([
                'id', 'title', 'slug', 'category', 'level', 'course_type',
                'price', 'thumbnail_url', 'rating', 'students_count', 'duration_hours',
            ]);

        return response()->json(['data' => [
            'id' => $course->instructor_name,
            'full_name' => $course->instructor_name,
            'bio' => $course->instructor_bio ?? null,
            'avatar_url' => $course->instructor_avatar ?? null,
            'specialization' => $course->category,
            'courses_count' => $count,
            'students_count' => $students,
            'rating' => $ratings->count() ? round($ratings->avg(), 1) : null,
            'courses' => $courses,
        ]]);
    }

    /**
     * Admin console: create a course. It becomes live immediately — the
     * public index, detail page, search discovery, categories and the
     * navigation all read the courses table directly (spec 47).
     *
     * POST /api/admin/courses (role: super_admin, administrator, learning_admin)
     */
    public function adminStore(Request $request): JsonResponse
    {
        $data = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string|max:5000',
            'category' => 'required|string|max:100',
            'course_type' => 'required|string|in:theory,practical,both',
            'instructor_name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'duration_hours' => 'nullable|numeric|min:0',
            'level' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:50',
            'thumbnail_url' => 'nullable|url|max:500',
            'video_url' => 'nullable|url|max:500',
            'objectives' => 'nullable|array',
            'objectives.*' => 'string|max:255',
            'requirements' => 'nullable|string|max:5000',
            'is_featured' => 'nullable|boolean',
        ]);

        $base = \Illuminate\Support\Str::slug($data['title']) ?: 'course';
        $slug = $base;
        for ($i = 2; \Modules\Learn\Entities\Course::where('slug', $slug)->exists(); $i++) {
            $slug = $base . '-' . $i;
        }

        $course = \Modules\Learn\Entities\Course::create(array_merge($data, [
            'slug' => $slug,
            'students_count' => 0,
            'is_featured' => (bool) ($data['is_featured'] ?? false),
        ]));

        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => 'create',
                'entity_type' => 'course',
                'entity_id' => $course->id,
                'performed_by' => $request->user()?->id,
                'new_values' => ['title' => $course->title, 'price' => $course->price, 'slug' => $course->slug],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content creation.
        }

        return response()->json([
            'message' => 'Course created successfully',
            'data' => $course,
        ], 201);
    }

    /**
     * Admin console list: every status (drafts included), unlike the public
     * index which only ever publishes `status = published` rows.
     *
     * GET /api/admin/courses
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $data = $request->validate([
            'q' => 'nullable|string|max:255',
            'category' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:draft,published,archived',
        ]);

        $query = \Modules\Learn\Entities\Course::query();

        if (!empty($data['q'])) {
            $query->where(function ($sub) use ($data) {
                $sub->where('title', 'ilike', "%{$data['q']}%")
                    ->orWhere('instructor_name', 'ilike', "%{$data['q']}%");
            });
        }
        if (!empty($data['category'])) {
            $query->where('category', $data['category']);
        }
        if (!empty($data['status'])) {
            $query->where('status', $data['status']);
        }

        $courses = $query->orderByDesc('created_at')
            ->paginate($request->get('per_page', 15), ['*'], 'page', $request->get('page', 1));

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

    /**
     * Admin console: edit a course in place (slug stays stable so existing
     * links and enrollments keep resolving).
     *
     * PUT /api/admin/courses/{id}
     */
    public function adminUpdate(Request $request, string $id): JsonResponse
    {
        $course = $this->findOrFailCourse($id);

        $data = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'sometimes|required|string|max:5000',
            'category' => 'sometimes|required|string|max:100',
            'course_type' => 'sometimes|required|string|in:theory,practical,both',
            'instructor_name' => 'sometimes|required|string|max:255',
            'price' => 'sometimes|required|numeric|min:0',
            'duration_hours' => 'nullable|numeric|min:0',
            'level' => 'nullable|string|max:50',
            'language' => 'nullable|string|max:50',
            'thumbnail_url' => 'nullable|url|max:500',
            'video_url' => 'nullable|url|max:500',
            'objectives' => 'nullable|array',
            'objectives.*' => 'string|max:255',
            'requirements' => 'nullable|string|max:5000',
            'is_featured' => 'nullable|boolean',
        ]);

        if (array_key_exists('is_featured', $data)) {
            $data['is_featured'] = (bool) $data['is_featured'];
        }

        $before = $course->only(array_keys($data));
        $course->update($data);

        $this->auditCourse('update', $request, $course, [
            'before' => $before,
            'after' => $course->only(array_keys($data)),
        ]);

        return response()->json([
            'message' => 'Course updated successfully',
            'data' => $course->fresh(),
        ]);
    }

    /**
     * Admin console: publish / unpublish / archive. Published is the only
     * status the public catalog, search, categories and instructor pages read.
     *
     * PUT /api/admin/courses/{id}/status
     */
    public function adminStatus(Request $request, string $id): JsonResponse
    {
        $course = $this->findOrFailCourse($id);

        $data = $request->validate([
            'status' => 'required|string|in:draft,published,archived',
        ]);

        $previous = $course->status;
        $course->status = $data['status'];

        if ($data['status'] === \Modules\Learn\Entities\Course::STATUS_PUBLISHED && !$course->published_at) {
            $course->published_at = now();
        }
        $course->save();

        $this->auditCourse('status', $request, $course, [
            'from' => $previous,
            'to' => $course->status,
        ]);

        return response()->json([
            'message' => 'Course status updated',
            'data' => $course->fresh(),
        ]);
    }

    /**
     * Admin console: soft-delete a course. Refused while learners are
     * enrolled - unpublish instead so their progress and certificates
     * survive.
     *
     * DELETE /api/admin/courses/{id}
     */
    public function adminDestroy(Request $request, string $id): JsonResponse
    {
        $course = $this->findOrFailCourse($id);

        $enrolled = \Modules\Learn\Entities\Enrollment::where('course_id', $course->id)->count();
        if ($enrolled > 0) {
            return response()->json([
                'message' => 'Cannot delete a course with enrolled learners. Unpublish it instead.',
                'error' => 'course_has_enrollments',
                'enrollments' => $enrolled,
            ], 422);
        }

        $course->delete();

        $this->auditCourse('delete', $request, $course, [
            'title' => $course->title,
            'slug' => $course->slug,
        ]);

        return response()->json(['message' => 'Course deleted']);
    }

    /**
     * Admin console: list lessons of a course in curriculum order.
     *
     * GET /api/admin/courses/{id}/lessons
     */
    public function adminLessons(Request $request, string $id): JsonResponse
    {
        $course = $this->findOrFailCourse($id);

        return response()->json([
            'data' => $course->lessons()->orderBy('lesson_order')->get(),
        ]);
    }

    /**
     * Admin console: add a lesson to a course. Appended to the end of the
     * curriculum unless an explicit lesson_order is given.
     *
     * POST /api/admin/courses/{id}/lessons
     */
    public function adminStoreLesson(Request $request, string $id): JsonResponse
    {
        $course = $this->findOrFailCourse($id);

        $data = $this->validateLesson($request);

        if (!isset($data['lesson_order'])) {
            $data['lesson_order'] = (int) \Modules\Learn\Entities\CourseLesson::where('course_id', $course->id)
                ->max('lesson_order') + 1;
        }

        $lesson = \Modules\Learn\Entities\CourseLesson::create(array_merge($data, [
            'course_id' => $course->id,
        ]));

        $this->auditLesson('lesson.create', $request, $course, $lesson);

        return response()->json([
            'message' => 'Lesson created',
            'data' => $lesson,
        ], 201);
    }

    /**
     * Admin console: edit a lesson (curriculum order included).
     *
     * PUT /api/admin/courses/{id}/lessons/{lessonId}
     */
    public function adminUpdateLesson(Request $request, string $id, string $lessonId): JsonResponse
    {
        $course = $this->findOrFailCourse($id);
        $lesson = $this->findOrFailLesson($course, $lessonId);

        $data = $this->validateLesson($request, updating: true);

        // Reordering: make room at the requested position by shifting the
        // lessons that currently sit there (and after) one step down.
        if (isset($data['lesson_order'])) {
            \Modules\Learn\Entities\CourseLesson::where('course_id', $course->id)
                ->where('id', '!=', $lesson->id)
                ->where('lesson_order', '>=', $data['lesson_order'])
                ->increment('lesson_order');
        }

        $lesson->update($data);

        $this->auditLesson('lesson.update', $request, $course, $lesson->fresh());

        return response()->json([
            'message' => 'Lesson updated',
            'data' => $lesson->fresh(),
        ]);
    }

    /**
     * Admin console: remove a lesson from a course.
     *
     * DELETE /api/admin/courses/{id}/lessons/{lessonId}
     */
    public function adminDestroyLesson(Request $request, string $id, string $lessonId): JsonResponse
    {
        $course = $this->findOrFailCourse($id);
        $lesson = $this->findOrFailLesson($course, $lessonId);

        $lesson->delete();

        $this->auditLesson('lesson.delete', $request, $course, $lesson);

        return response()->json(['message' => 'Lesson deleted']);
    }

    private function validateLesson(Request $request, bool $updating = false): array
    {
        $required = $updating ? ['sometimes', 'required'] : ['required'];

        return $request->validate([
            'title' => [...$required, 'string', 'max:255'],
            'content' => ['nullable', 'string', 'max:20000'],
            'video_url' => ['nullable', 'url', 'max:500'],
            'duration_minutes' => ['nullable', 'integer', 'min:0', 'max:100000'],
            'lesson_order' => ['nullable', 'integer', 'min:1', 'max:100000'],
            'resources' => ['nullable', 'array'],
            'resources.*.title' => ['required_with:resources', 'string', 'max:255'],
            'resources.*.url' => ['required_with:resources', 'url', 'max:500'],
            'is_free_preview' => ['nullable', 'boolean'],
        ]);
    }

    private function findOrFailLesson(\Modules\Learn\Entities\Course $course, string $lessonId): \Modules\Learn\Entities\CourseLesson
    {
        if (!\Illuminate\Support\Str::isUuid($lessonId)) {
            abort(404, 'Lesson not found');
        }

        $lesson = \Modules\Learn\Entities\CourseLesson::where('course_id', $course->id)->find($lessonId);
        if (!$lesson) {
            abort(404, 'Lesson not found');
        }

        return $lesson;
    }

    private function auditLesson(string $action, Request $request, \Modules\Learn\Entities\Course $course, \Modules\Learn\Entities\CourseLesson $lesson): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'course_lesson',
                'entity_id' => $lesson->id,
                'performed_by' => $request->user()?->id,
                'new_values' => [
                    'course_id' => $course->id,
                    'title' => $lesson->title,
                    'video_url' => $lesson->video_url,
                    'lesson_order' => $lesson->lesson_order,
                ],
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content management.
        }
    }

    private function findOrFailCourse(string $id): \Modules\Learn\Entities\Course
    {
        if (!\Illuminate\Support\Str::isUuid($id)) {
            abort(404, 'Course not found');
        }

        $course = \Modules\Learn\Entities\Course::find($id);
        if (!$course) {
            abort(404, 'Course not found');
        }

        return $course;
    }

    private function auditCourse(string $action, Request $request, \Modules\Learn\Entities\Course $course, array $payload): void
    {
        try {
            app(\Core\Services\Contracts\AuditServiceInterface::class)->log([
                'action' => $action,
                'entity_type' => 'course',
                'entity_id' => $course->id,
                'performed_by' => $request->user()?->id,
                'new_values' => $payload,
            ]);
        } catch (\Throwable) {
            // Audit failures must not break content management.
        }
    }
}
