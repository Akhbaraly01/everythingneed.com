import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BookOpen, Award, Clock, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';

interface EnrolledCourse {
    id: string;
    title: string;
    instructor?: string;
    image_url?: string;
    enrolled_at: string;
    progress: number;
    completed_lessons: number;
    total_lessons: number;
}

export default function MyLearning() {
    const [courses, setCourses] = useState<EnrolledCourse[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: EnrolledCourse[] }>('/api/my-courses')
            .then((res) => setCourses(res.data))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="My Learning">
            <Head title="My Learning" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Learning</h1>
                    <Link href="/learn" className="text-sm text-indigo-600 hover:text-indigo-500">Browse more courses &rarr;</Link>
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : courses.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No courses yet</h3>
                        <Link href="/learn" className="mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">
                            Browse Courses
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((course) => (
                            <Link key={course.id} href={`/learn/courses/${course.id}`}
                                className="group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="h-40 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    {course.image_url ? (
                                        <img src={course.image_url} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        <BookOpen className="h-12 w-12 text-indigo-400" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{course.title}</h3>
                                    <p className="text-sm text-gray-500">{course.instructor}</p>

                                    {/* Progress bar */}
                                    <div className="mt-3">
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-gray-500">{course.completed_lessons}/{course.total_lessons} lessons</span>
                                            <span className="font-medium text-indigo-600">{course.progress}%</span>
                                        </div>
                                        <div className="mt-1 rounded-full bg-gray-200 h-1.5 dark:bg-gray-700">
                                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${course.progress}%` }} />
                                        </div>
                                    </div>

                                    {course.progress === 100 && (
                                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-green-600">
                                            <Award className="h-3 w-3" /> Completed
                                        </div>
                                    )}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
