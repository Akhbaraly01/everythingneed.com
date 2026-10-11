<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Modules\Learn\Entities\Course;
use Modules\Learn\Entities\CourseLesson;
use Modules\Learn\Entities\Enrollment;
use Modules\Learn\Entities\Quiz;
use Modules\Learn\Entities\QuizAttempt;

class LearnPageController extends Controller
{
    public function index(Request $request): Response
    {
        // Public landing only ever shows published courses (L-B lifecycle).
        $query = Course::query()->published();

        if ($category = trim((string) $request->query('category'))) {
            $query->where('category', 'ilike', $category);
        }

        if ($level = trim((string) $request->query('level'))) {
            $query->where('level', 'ilike', $level);
        }

        if ($search = trim((string) $request->query('search'))) {
            $query->where(function ($q) use ($search) {
                $q->where('title', 'ilike', "%{$search}%")
                    ->orWhere('description', 'ilike', "%{$search}%");
            });
        }

        $courses = $query->orderByDesc('created_at')->paginate(20)->withQueryString()->through(
            fn (Course $course) => array_merge($course->toArray(), [
                'type' => ((float) $course->price) > 0 ? 'paid' : 'free',
            ])
        );

        $filters = $request->only(['category', 'level', 'search']);
        $filterSummary = collect($filters)
            ->filter(fn ($v) => trim((string) $v) !== '')
            ->implode(' · ');

        return Inertia::render('learn/Index', [
            'courses' => $courses,
            'filters' => $filters,
            'featured' => $this->courseRail(fn ($q) => $q->where('is_featured', true)->orderByDesc('rating')),
            'popular' => $this->courseRail(fn ($q) => $q->orderByDesc('students_count')),
            'latest' => $this->courseRail(fn ($q) => $q->orderByDesc('created_at')),
            'continueLearning' => $this->continueLearning($request),
            'recommended' => $this->recommended($request),
            'seo' => [
                'title' => $filterSummary !== ''
                    ? "Learn: {$filterSummary}"
                    : 'Learn New Skills & Advance Your Career',
                'description' => $filterSummary !== ''
                    ? "Browse published courses matching “{$filterSummary}”. Learn on EverythingNeed."
                    : 'Browse featured, popular and latest courses on EverythingNeed. Learn new skills and advance your career.',
                'canonical' => url('/learn'),
                'robots' => 'index,follow',
            ],
        ]);
    }

    /**
     * Spec 88/17: crawlable head data for the canonical course URL -
     * OG/Twitter tags describing the real course (title, instructor, rating).
     */
    private function courseSeo(Course $course): array
    {
        $description = trim((string) $course->description) !== ''
            ? \Illuminate\Support\Str::limit(strip_tags((string) $course->description), 160)
            : ($course->title.' — a course on EverythingNeed Learn.');

        $parts = [];
        if ($course->instructor_name) {
            $parts[] = 'Instructor: '.$course->instructor_name;
        }
        if ($course->category) {
            $parts[] = $course->category;
        }
        if ($course->students_count) {
            $parts[] = $course->students_count.' students enrolled';
        }
        if ($course->rating) {
            $parts[] = 'Rated '.$course->rating.' / 5';
        }
        if ($parts !== []) {
            $description .= ' · '.implode(' · ', $parts);
        }

        $canonical = route('learn.show', ['id' => $course->id]);
        $image = $course->thumbnail_url;
        if (is_string($image) && $image !== '' && str_starts_with($image, '/')) {
            $image = url($image);
        }

        return [
            'title' => $course->title,
            'description' => \Illuminate\Support\Str::limit($description, 300),
            'image' => $image,
            'canonical' => $canonical,
            'robots' => 'index,follow',
        ];
    }

    /** Small homepage rails; each query is isolated so one failure never breaks the page. */
    private function courseRail(callable $order): array
    {
        try {
            return Course::query()
                ->published()
                ->tap($order)
                ->limit(6)
                ->get(['id', 'title', 'category', 'price', 'thumbnail_url', 'rating', 'students_count'])
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /** Enrolled, unfinished courses ordered by recent activity. */
    private function continueLearning(Request $request): array
    {
        if (!$request->user()) {
            return [];
        }

        try {
            return Enrollment::with('course:id,title,thumbnail_url')
                ->where('user_id', $request->user()->id)
                ->where('progress', '<', 100)
                ->orderByDesc('last_active_at')
                ->orderByDesc('id')
                ->limit(6)
                ->get()
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    /** Same-category courses the learner has not enrolled in yet. */
    private function recommended(Request $request): array
    {
        if (!$request->user()) {
            return [];
        }

        try {
            $categories = Enrollment::with('course:id,category')
                ->where('user_id', $request->user()->id)
                ->get()
                ->pluck('course.category')
                ->filter()
                ->unique()
                ->values();

            if ($categories->isEmpty()) {
                return [];
            }

            $enrolled = Enrollment::where('user_id', $request->user()->id)->pluck('course_id');

            return Course::query()
                ->published()
                ->whereIn('category', $categories)
                ->whereNotIn('id', $enrolled)
                ->orderByDesc('rating')
                ->limit(6)
                ->get(['id', 'title', 'category', 'price', 'thumbnail_url', 'rating'])
                ->toArray();
        } catch (\Throwable) {
            return [];
        }
    }

    public function show(Request $request, string $id): Response
    {
        $course = $this->findViewableCourse($request, $id, withLessons: true);

        $quizRows = Quiz::where('course_id', $course->id)
            ->orderBy('created_at')
            ->get(['id', 'title', 'pass_score_percent']);

        $enrollment = $request->user()
            ? Enrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->first()
            : null;

        // Which quizzes this learner has already passed (certificate gate).
        $passedQuizIds = $request->user() && $quizRows->isNotEmpty()
            ? QuizAttempt::where('user_id', $request->user()->id)
                ->whereIn('quiz_id', $quizRows->pluck('id'))
                ->where('passed', true)
                ->distinct()
                ->pluck('quiz_id')
            : collect();

        $quizzes = $quizRows->map(fn (Quiz $quiz) => [
            'id' => $quiz->id,
            'title' => $quiz->title,
            'pass_score_percent' => $quiz->pass_score_percent,
            'passed' => $passedQuizIds->contains($quiz->id),
        ])->values()->all();

        return Inertia::render('learn/Show', [
            'course' => $course,
            'quizzes' => $quizzes,
            'enrollment' => $enrollment ? [
                'progress' => (int) $enrollment->progress,
                'completed_at' => $enrollment->completed_at,
            ] : null,
            'certificate_eligible' => $enrollment !== null && (int) $enrollment->progress === 100,
            'seo' => $this->courseSeo($course),
        ]);
    }

    public function lesson(Request $request, string $courseId, string $lessonId): Response
    {
        $course = $this->findViewableCourse($request, $courseId);
        $lesson = CourseLesson::where('course_id', $course->id)->findOrFail($lessonId);

        $orderedIds = CourseLesson::where('course_id', $course->id)
            ->orderBy('lesson_order')
            ->pluck('id')
            ->all();
        $position = array_search($lesson->id, $orderedIds, true);

        $enrollment = $request->user()
            ? Enrollment::where('user_id', $request->user()->id)->where('course_id', $course->id)->first()
            : null;

        return Inertia::render('learn/Lesson', [
            'course' => [
                'id' => $course->id,
                'title' => $course->title,
                'instructor' => $course->instructor_name,
                'total_lessons' => count($orderedIds),
            ],
            'lesson' => $lesson,
            'nextLessonId' => ($position !== false && isset($orderedIds[$position + 1])) ? $orderedIds[$position + 1] : null,
            'prevLessonId' => ($position !== false && $position > 0) ? $orderedIds[$position - 1] : null,
            'progress' => (int) ($enrollment->progress ?? 0),
            'is_enrolled' => $enrollment !== null,
        ]);
    }

    public function quiz(Request $request, string $courseId): Response
    {
        $course = $this->findViewableCourse($request, $courseId);
        $quiz = Quiz::where('course_id', $course->id)->orderByDesc('created_at')->first();

        if (!$quiz) {
            return Inertia::render('learn/Quiz', [
                'course' => ['id' => $course->id, 'title' => $course->title],
                'quiz' => null,
                'questions' => [],
            ]);
        }

        $public = $quiz->toPublicArray();

        return Inertia::render('learn/Quiz', [
            'course' => ['id' => $course->id, 'title' => $course->title],
            'quiz' => [
                'id' => $public['id'],
                'title' => $public['title'],
                'passing_score' => $public['pass_score_percent'],
            ],
            'questions' => $public['questions'],
        ]);
    }

    public function quizById(Request $request, string $courseId, string $quizId): Response
    {
        $course = $this->findViewableCourse($request, $courseId);
        $quiz = Quiz::where('course_id', $course->id)->findOrFail($quizId);

        $public = $quiz->toPublicArray();

        return Inertia::render('learn/Quiz', [
            'course' => ['id' => $course->id, 'title' => $course->title],
            'quiz' => [
                'id' => $public['id'],
                'title' => $public['title'],
                'passing_score' => $public['pass_score_percent'],
            ],
            'questions' => $public['questions'],
        ]);
    }

    /**
     * L-B lifecycle: unpublished courses 404 on every public Learn page,
     * except for course managers (preview) and already-enrolled learners.
     */
    private function findViewableCourse(Request $request, string $id, bool $withLessons = false): Course
    {
        $query = Course::query();
        if ($withLessons) {
            $query->with('lessons');
        }

        $course = $query->find($id);
        abort_if($course === null, 404, 'Course not found');

        if ($course->status !== Course::STATUS_PUBLISHED) {
            $user = $request->user();
            $canManage = $user !== null && $user->hasPermission('learn.courses.manage');
            $enrolled = $user !== null
                && Enrollment::where('user_id', $user->id)
                    ->where('course_id', $course->id)
                    ->exists();

            abort_if(!$canManage && !$enrolled, 404, 'Course not found');
        }

        return $course;
    }
}
