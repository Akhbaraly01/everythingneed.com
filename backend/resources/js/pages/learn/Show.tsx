import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router } from '@inertiajs/react';
import type { Course, CourseLesson } from '@/types';
import { BookOpen, Clock, Users, Star, Play, CheckCircle } from 'lucide-react';

interface CourseShowProps {
    course: Course & { lessons?: CourseLesson[] };
}

export default function CourseShow({ course }: CourseShowProps) {
    const handleEnroll = () => {
        router.post(`/api/courses/${course.id}/enroll`, {}, {
            preserveScroll: true,
            onSuccess: () => router.reload(),
        });
    };

    return (
        <AppLayout>
            <Head title={course.title} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/2">
                            {course.thumbnail_url ? (
                                <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">
                                    <BookOpen className="h-12 w-12" />
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">{course.category}</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">{course.level}</span>
                                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800">{course.type}</span>
                            </div>
                            <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">{course.title}</h1>
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                                {course.duration_hours && <span className="flex items-center gap-1"><Clock className="h-4 w-4" />{course.duration_hours}h total</span>}
                                {course.students_count != null && <span className="flex items-center gap-1"><Users className="h-4 w-4" />{course.students_count} students</span>}
                                {course.rating != null && (
                                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{course.rating}</span>
                                )}
                            </div>
                            {course.description && (
                                <p className="mt-4 text-gray-600 dark:text-gray-400">{course.description}</p>
                            )}
                            <div className="mt-6 flex items-center gap-4">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {course.type === 'free' ? 'Free' : `$${course.price}`}
                                </span>
                                <button
                                    onClick={handleEnroll}
                                    className="rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500"
                                >
                                    Enroll Now
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Curriculum */}
                {course.lessons && course.lessons.length > 0 && (
                    <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Curriculum</h2>
                        <p className="mt-1 text-sm text-gray-500">{course.lessons.length} lessons</p>
                        <div className="mt-6 divide-y dark:divide-gray-700">
                            {course.lessons
                                .sort((a, b) => a.lesson_order - b.lesson_order)
                                .map((lesson, index) => (
                                    <div key={lesson.id} className="flex items-center gap-4 py-4">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-800">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{lesson.title}</h3>
                                            {lesson.duration_minutes && (
                                                <p className="text-xs text-gray-500">{lesson.duration_minutes} min</p>
                                            )}
                                        </div>
                                        {lesson.video_url && (
                                            <Play className="h-5 w-5 text-gray-400" />
                                        )}
                                    </div>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
