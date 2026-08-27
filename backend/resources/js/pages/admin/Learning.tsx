import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Course {
    id: string;
    title: string;
    instructor?: string;
    status: string;
    enrolled_count: number;
    price: number;
}

export default function AdminLearning() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Course[] }>('/api/courses')
            .then((res) => setCourses(res.data))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Learning Admin">
            <Head title="Learning Admin" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Learning Management</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : courses.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No courses</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800">
                        <table className="w-full text-left text-sm">
                            <thead className="border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700">
                                <tr>
                                    <th className="px-4 py-3">Course</th>
                                    <th className="px-4 py-3">Instructor</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Enrolled</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y dark:divide-gray-700">
                                {courses.map((c) => (
                                    <tr key={c.id}>
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.title}</td>
                                        <td className="px-4 py-3 text-sm text-gray-500">{c.instructor}</td>
                                        <td className="px-4 py-3 font-semibold">${c.price}</td>
                                        <td className="px-4 py-3">{c.enrolled_count}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
