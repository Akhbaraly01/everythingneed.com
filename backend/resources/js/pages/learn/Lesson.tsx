import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import { api } from '@/lib/api';
import { CheckCircle, PlayCircle, ArrowRight, Lock, Clock } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Lesson {
    id: string;
    title: string;
    description?: string;
    content?: string;
    video_url?: string;
    duration_minutes?: number;
    order: number;
    is_free: boolean;
}

interface CourseLessonProps {
    course: { id: string; title: string; instructor?: string; total_lessons?: number };
    lesson: Lesson;
    nextLessonId?: string;
    prevLessonId?: string;
    progress: number;
    is_enrolled: boolean;
}

export default function CourseLesson({ course, lesson, nextLessonId, prevLessonId, progress, is_enrolled }: CourseLessonProps) {
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);

    const markComplete = async () => {
        setCompleting(true);
        try {
            await api.post(`/api/learn/courses/${course.id}/lessons/${lesson.id}/complete`);
            setCompleted(true);
        } catch {}
        setCompleting(false);
    };

    return (
        <AppLayout>
            <Head title={`${lesson.title} - ${course.title}`} />

            <div className="space-y-6">
                <Link href={`/learn/courses/${course.id}`} className="text-sm text-gray-500 hover:text-gray-700">
                    &larr; Back to course
                </Link>

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h1>
                        <p className="text-sm text-gray-500">by {course.instructor ?? 'Instructor'}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                        Lesson {lesson.order} of {course.total_lessons ?? '?'}
                    </div>
                </div>

                {/* Progress bar */}
                <div className="rounded-full bg-gray-200 h-2 dark:bg-gray-700">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>

                {/* Video / Content */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    {lesson.video_url ? (
                        <div className="aspect-video">
                            <iframe src={lesson.video_url} className="h-full w-full rounded-lg" allowFullScreen />
                        </div>
                    ) : lesson.content ? (
                        <div className="prose dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                    ) : (
                        <div className="flex h-48 items-center justify-center text-gray-400">
                            <PlayCircle className="h-12 w-12" />
                        </div>
                    )}
                </div>

                {/* Description */}
                {lesson.description && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h3 className="font-semibold text-gray-900 dark:text-white">About this lesson</h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{lesson.description}</p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                    {prevLessonId ? (
                        <Link href={`/learn/courses/${course.id}/lessons/${prevLessonId}`}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Previous Lesson
                        </Link>
                    ) : <div />}

                    {is_enrolled && (
                        completed ? (
                            <span className="flex items-center gap-2 text-green-600">
                                <CheckCircle className="h-5 w-5" /> Completed
                            </span>
                        ) : (
                            <button onClick={markComplete} disabled={completing}
                                className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-green-500 disabled:opacity-50">
                                <CheckCircle className="h-4 w-4" /> {completing ? 'Saving...' : 'Mark Complete'}
                            </button>
                        )
                    )}

                    {nextLessonId ? (
                        <Link href={`/learn/courses/${course.id}/lessons/${nextLessonId}`}
                            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500">
                            Next Lesson <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : is_enrolled ? (
                        <Link href={`/learn/courses/${course.id}/quiz`}
                            className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-purple-500">
                            Take Quiz <ArrowRight className="h-4 w-4" />
                        </Link>
                    ) : <div />}
                </div>
            </div>
        </AppLayout>
    );
}
