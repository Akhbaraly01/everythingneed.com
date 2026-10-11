import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Enrollment } from '@/types';
import { BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

export default function LearnProgress() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Enrollment[] }>('/api/my-courses')
            .then((res) => setEnrollments(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load progress')))
            .finally(() => setLoading(false));
    }, []);

    const total = enrollments.length;
    const completed = enrollments.filter((e) => e.is_completed).length;
    const average = total === 0 ? 0 : Math.round(enrollments.reduce((sum, e) => sum + (e.progress ?? 0), 0) / total);

    return (
        <AppLayout>
            <Head title="My Progress" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                    <BarChart3 className="h-6 w-6" /> My Progress
                </h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading progress...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : total === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">You have not enrolled in any course yet.</p>
                        <Link href="/learn/courses" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse courses
                        </Link>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-3 gap-4">
                            {[
                                { label: 'Enrolled', value: total },
                                { label: 'Completed', value: completed },
                                { label: 'Avg. progress', value: `${average}%` },
                            ].map((stat) => (
                                <div key={stat.label} className="rounded-lg bg-white p-4 text-center shadow dark:bg-gray-800">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                                    <p className="text-xs text-gray-500">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-3">
                            {enrollments.map((enrollment) => (
                                <Link key={enrollment.id} href={`/learn/${enrollment.course_id}`}
                                    className="block rounded-lg bg-white p-4 shadow hover:shadow-md dark:bg-gray-800">
                                    <div className="flex items-center justify-between">
                                        <p className="font-medium text-gray-900 dark:text-white">
                                            {enrollment.course?.title ?? 'Course'}
                                        </p>
                                        <span className="text-sm font-semibold text-indigo-600">{enrollment.progress ?? 0}%</span>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                        <div className="h-full rounded-full bg-indigo-600" style={{ width: `${enrollment.progress ?? 0}%` }} />
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500">
                                        {enrollment.completed_lessons ?? 0} of {enrollment.lessons_count ?? 0} lessons complete
                                    </p>
                                </Link>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}
