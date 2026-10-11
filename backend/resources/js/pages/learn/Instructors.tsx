import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { GraduationCap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';
import EmptyState from '@/components/shared/EmptyState';
import { ErrorState } from '@/components/shared/LoadingState';

interface Instructor {
    id: string;
    full_name: string;
    courses_count: number;
    students_count: number;
}

export default function LearnInstructors() {
    const [instructors, setInstructors] = useState<Instructor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Instructor[] }>('/api/learn/instructors')
            .then((res) => setInstructors(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load instructors')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Instructors">
            <Head title="Instructors" />
            <div className="mx-auto max-w-3xl space-y-6">
                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading instructors...</p>
                    </div>
                ) : error ? (
                    <ErrorState message={error} />
                ) : instructors.length === 0 ? (
                    <EmptyState icon={<GraduationCap className="h-10 w-10" />} title="No instructors yet." />
                ) : (
                    <div className="divide-y rounded-lg bg-white shadow dark:divide-gray-700 dark:bg-gray-800">
                        {instructors.map((instructor) => (
                            <Link key={instructor.id} href={`/learn/instructors/${encodeURIComponent(instructor.id)}`}
                                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                <div>
                                    <p className="text-sm font-medium text-gray-900 dark:text-white">{instructor.full_name}</p>
                                    <p className="text-xs text-gray-500">
                                        {instructor.courses_count} course{instructor.courses_count === 1 ? '' : 's'} · {instructor.students_count} students
                                    </p>
                                </div>
                                <span className="text-sm font-medium text-indigo-600">View →</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
