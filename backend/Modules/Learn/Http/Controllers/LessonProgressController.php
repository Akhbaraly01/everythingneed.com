<?php

namespace Modules\Learn\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Modules\Learn\Actions\CompleteLesson;
use Modules\Learn\Actions\IssueCertificate;
use Modules\Learn\Entities\UserCertificate;

class LessonProgressController extends Controller
{
    public function __construct(
        private CompleteLesson $completeLesson,
        private IssueCertificate $issueCertificate,
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
                'error' => 'Finish all lessons before claiming your certificate.',
            ], 422);
        }

        return response()->json([
            'message' => 'Certificate issued',
            'data' => $certificate,
        ], 201);
    }

    public function myCertificates(Request $request): JsonResponse
    {
        $certificates = UserCertificate::where('user_id', $request->user()->id)
            ->orderByDesc('issued_at')
            ->get();

        return response()->json(['data' => $certificates]);
    }
}
