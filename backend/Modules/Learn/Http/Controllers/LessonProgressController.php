<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Learn\Actions\CompleteLesson;
use Modules\Learn\Actions\ComputeCourseProgress;
use Modules\Learn\Actions\IssueCertificate;
use Modules\Users\Entities\UserCertificate;

class LessonProgressController extends Controller
{
    public function __construct(
        private CompleteLesson $completeLesson,
        private IssueCertificate $issueCertificate,
        private ComputeCourseProgress $computeProgress,
    ) {}

    public function complete(Request $request, string $courseId, string $lessonId): JsonResponse
    {
        $validated = $request->validate([
            'watch_time_seconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
        ]);

        try {
            $enrollment = $this->completeLesson->execute(
                $request->user()->id,
                $courseId,
                $lessonId,
                $validated,
            );
        } catch (\Core\Exceptions\NotFoundException $e) {
            return response()->json(['message' => 'Enrollment or lesson not found'], 404);
        }

        return response()->json([
            'message' => 'Lesson completed',
            'data' => [
                'progress' => $enrollment->progress,
                'completed_at' => $enrollment->completed_at,
                'course_completed' => $enrollment->progress === 100,
            ],
        ]);
    }

    public function issueCertificate(Request $request, string $courseId): JsonResponse
    {
        try {
            $certificate = $this->issueCertificate->execute(
                $request->user()->id,
                $courseId,
            );
        } catch (\Core\Exceptions\NotFoundException) {
            return response()->json(['message' => 'You are not enrolled in this course'], 404);
        } catch (\Core\Exceptions\ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'error' => $this->certificateRequirement($request->user()->id, $courseId),
            ], 422);
        }

        return response()->json([
            'message' => 'Certificate issued',
            'data' => $certificate,
        ], 201);
    }

    /**
     * Honest copy for the certificate gate: name the remaining lessons and
     * quizzes instead of a generic "finish everything" line.
     */
    private function certificateRequirement(string $userId, string $courseId): string
    {
        $detail = ($this->computeProgress)->execute($userId, $courseId);
        $parts = [];

        if ($detail['lessons_completed'] < $detail['lessons_total']) {
            $missing = $detail['lessons_total'] - $detail['lessons_completed'];
            $parts[] = "finish {$missing} more lesson" . ($missing === 1 ? '' : 's');
        }

        if ($detail['quizzes_passed'] < $detail['quizzes_total']) {
            $missing = $detail['quizzes_total'] - $detail['quizzes_passed'];
            $parts[] = "pass {$missing} more quiz" . ($missing === 1 ? '' : 's');
        }

        if ($parts === []) {
            return 'Finish the course before claiming your certificate.';
        }

        return 'You still need to ' . implode(' and ', $parts) . ' before claiming your certificate.';
    }

    public function myCertificates(Request $request): JsonResponse
    {
        $certificates = UserCertificate::where('user_id', $request->user()->id)
            ->orderByDesc('issued_at')
            ->get();

        return response()->json(['data' => $certificates]);
    }

    /** One of the current user's certificates (own records only). */
    public function showCertificate(Request $request, string $id): JsonResponse
    {
        $certificate = UserCertificate::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        return response()->json(['data' => $certificate]);
    }

    /**
     * Public verification (spec 20): anyone with the code can confirm the
     * credential without an account.
     */
    public function verifyCertificate(string $code): JsonResponse
    {
        $certificate = UserCertificate::where('certificate_number', $code)->first();

        if (!$certificate) {
            return response()->json(['data' => ['valid' => false]], 404);
        }

        return response()->json(['data' => [
            'valid' => true,
            'certificate_number' => $certificate->certificate_number,
            'course_title' => $certificate->course_title,
            'instructor_name' => $certificate->instructor_name,
            'holder_name' => $certificate->user?->name,
            'issued_at' => $certificate->issued_at,
        ]]);
    }

    /** Download the certificate as a printable file (own records only). */    public function downloadCertificate(Request $request, string $id)
    {
        $certificate = UserCertificate::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->first();

        if (!$certificate) {
            return response()->json(['message' => 'Certificate not found'], 404);
        }

        $html = view('certificates.download', ['certificate' => $certificate])->render();

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="certificate-'.$certificate->certificate_number.'.html"',
        ]);
    }

    /** The current user's note on a lesson (spec 18; owner-scoped). */
    public function note(Request $request, string $lessonId): JsonResponse
    {
        $lesson = \Modules\Learn\Entities\CourseLesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $note = \Modules\Learn\Entities\LessonNote::where('user_id', $request->user()->id)
            ->where('lesson_id', $lessonId)
            ->first();

        return response()->json(['data' => $note]);
    }

    /** Create or replace the current user's note on a lesson. */
    public function saveNote(Request $request, string $lessonId): JsonResponse
    {
        $validated = $request->validate([
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $lesson = \Modules\Learn\Entities\CourseLesson::find($lessonId);
        if (!$lesson) {
            return response()->json(['message' => 'Lesson not found'], 404);
        }

        $note = \Modules\Learn\Entities\LessonNote::updateOrCreate(
            ['user_id' => $request->user()->id, 'lesson_id' => $lessonId],
            ['course_id' => $lesson->course_id, 'body' => $validated['body']]
        );

        return response()->json(['data' => $note]);
    }
}
