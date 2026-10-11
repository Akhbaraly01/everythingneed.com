import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { useEffect, useState } from 'react';
import { User, Star, BookOpen, Award } from 'lucide-react';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/LoadingState';
import SeoMeta, { type LearnSeo } from '@/components/learn/SeoMeta';

interface InstructorCourse {
    id: string;
    title: string;
    category: string;
    level?: string;
    price?: number;
    thumbnail_url?: string;
    rating?: number | null;
    students_count?: number;
    duration_hours?: number;
}

interface Instructor {
    id: string;
    full_name: string;
    bio?: string | null;
    avatar_url?: string | null;
    specialization?: string | null;
    courses_count: number;
    students_count: number;
    rating?: number | null;
    courses?: InstructorCourse[];
}

export default function InstructorProfile({ instructor_id, seo }: { instructor_id?: string; seo?: LearnSeo | null }) {
    const [instructor, setInstructor] = useState<Instructor | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [attempt, setAttempt] = useState(0);

    useEffect(() => {
        if (!instructor_id) {
            setLoading(false);
            setError('Instructor not found');
            return;
        }
        setLoading(true);
        setError(null);
        api.get<{ data: Instructor }>(`/api/learn/instructors/${instructor_id}`)
            .then((res) => setInstructor(res.data))
            .catch((e) => {
                setInstructor(null);
                setError(errorMessage(e, 'Failed to load this instructor'));
            })
            .finally(() => setLoading(false));
    }, [instructor_id, attempt]);

    if (loading) {
        return <AppLayout title="Instructor"><p className="p-12 text-center text-gray-500">Loading...</p></AppLayout>;
    }

    if (error || !instructor) {
        return (
            <AppLayout title="Instructor">
                <div className="mx-auto max-w-3xl">
                    <ErrorState message={error ?? 'Instructor not found'} onRetry={() => setAttempt((n) => n + 1)} />
                </div>
            </AppLayout>
        );
    }

    const courses = instructor.courses ?? [];

    // No AppLayout title: the profile header below already renders the one h1.
    return (
        <AppLayout>
            <Head title={seo?.title ?? instructor.full_name} />
            <SeoMeta seo={seo} />
            <div className="mx-auto max-w-3xl space-y-6">
                <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-6">
                        <div className="h-20 w-20 overflow-hidden rounded-full bg-blue-100 flex items-center justify-center">
                            {instructor.avatar_url ? (
                                <img src={instructor.avatar_url} alt={instructor.full_name} className="h-full w-full object-cover" />
                            ) : (
                                <User className="h-10 w-10 text-blue-600" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{instructor.full_name}</h1>
                            <p className="text-gray-500">{instructor.specialization ?? 'Instructor'}</p>
                            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm">
                                <span className="flex items-center gap-1 text-yellow-500"><Star className="h-4 w-4" /> {instructor.rating ?? 'New'}</span>
                                <span className="flex items-center gap-1 text-gray-500"><BookOpen className="h-4 w-4" /> {instructor.courses_count} courses</span>
                                <span className="flex items-center gap-1 text-gray-500"><Award className="h-4 w-4" /> {instructor.students_count} students</span>
                            </div>
                        </div>
                    </div>
                    {instructor.bio && (
                        <p className="mt-6 text-gray-600 dark:text-gray-400">{instructor.bio}</p>
                    )}
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Courses by {instructor.full_name}</h2>
                    {courses.length === 0 ? (
                        <EmptyState title="No published courses yet." />
                    ) : (
                        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            {courses.map((course) => (
                                <CourseCard key={course.id} course={course} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
