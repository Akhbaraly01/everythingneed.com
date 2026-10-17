import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Award } from 'lucide-react';
import { useEffect, useState } from 'react';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState, { ErrorState } from '@/components/shared/LoadingState';

interface EnrollmentRow {
    id: string;
    user_id: string;
    course_id: string;
    progress: number;
    created_at?: string;
    enrolled_at?: string;
    /** Merged by LearnService::getUserEnrollments (top level, not on course). */
    lessons_count?: number;
    completed_lessons?: number;
    is_completed?: boolean;
    course?: {
        id?: string;
        title?: string;
        instructor_name?: string;
        instructor?: string;
        thumbnail_url?: string;
        image_url?: string;
    };
}

interface EnrolledCourse {
    id: string;
    course_id: string;
    title: string;
    instructor?: string;
    image_url?: string;
    enrolled_at: string;
    progress: number;
    completed_lessons: number;
    total_lessons: number;
}

function mapEnrollment(row: EnrollmentRow): EnrolledCourse {
    const course = row.course ?? {};
    const totalLessons = Number(row.lessons_count ?? 0);
    return {
        id: row.course_id,
        course_id: row.course_id,
        title: course.title ?? 'Course',
        instructor: course.instructor_name ?? course.instructor,
        image_url: course.thumbnail_url ?? course.image_url,
        enrolled_at: (row.enrolled_at ?? row.created_at ?? '') as string,
        progress: Number(row.progress ?? 0),
        completed_lessons: Number(row.completed_lessons ?? 0),
        total_lessons: totalLessons,
    };
}

export default function MyLearning() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        setLoading(true);
        setError(null);
        api.get<{ data: EnrollmentRow[] }>('/api/my-courses')
            .then((res) => setCourses((res.data ?? []).map(mapEnrollment)))
            .catch((e) => {
                setCourses([]);
                setError(errorMessage(e, 'Failed to load your courses'));
            })
            .finally(() => setLoading(false));
    }, [attempt]);

    return (
        <AppLayout>
            <Head title="My Learning" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Learning</h1>
                    <div className="flex items-center gap-4">
                        <Link href="/learn/quiz-results" className="text-sm text-indigo-600 hover:text-indigo-500">Quiz results</Link>
                        <Link href="/learn" className="text-sm text-indigo-600 hover:text-indigo-500">Browse more courses &rarr;</Link>
                    </div>
                </div>

                {loading ? (
                    <LoadingState message="Loading..." />
                ) : error ? (
                    <ErrorState message={error} onRetry={() => setAttempt((n) => n + 1)} />
                ) : courses.length === 0 ? (
                    <EmptyState
                        title="No courses yet"
                        hint="Enroll in a course to start learning."
                    >
                        <Link href="/learn" className="mt-2 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Courses
                        </Link>
                    </EmptyState>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <CourseCard
                                key={course.id}
                                hidePrice
                                course={{
                                    id: course.course_id,
                                    title: course.title,
                                    instructor: course.instructor,
                                    image_url: course.image_url,
                                }}
                                progress={course.progress}
                                extra={
                                    <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                                        <span>{course.completed_lessons}/{course.total_lessons} lessons</span>
                                        {course.progress === 100 && (
                                            <span className="inline-flex items-center gap-1 text-green-600">
                                                <Award className="h-3 w-3" /> Completed
                                            </span>
                                        )}
                                    </div>
                                }
                            />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
