import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Course } from '@/types';
import { BookOpen, Clock, Users, Star } from 'lucide-react';

interface LearnProps {
    courses: {
        data: Course[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
}

export default function Learn({ courses }: LearnProps) {
    return (
        <AppLayout title="Learn">
            <Head title="Learn" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <p className="text-gray-600 dark:text-gray-400">
                        {courses.meta.total} courses available
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.data.map((course) => (
                        <div key={course.id} className="rounded-lg bg-white shadow dark:bg-gray-800">
                            <div className="aspect-video bg-gray-100">
                                {course.thumbnail_url && (
                                    <img src={course.thumbnail_url} alt={course.title} className="h-full w-full object-cover rounded-t-lg" />
                                )}
                            </div>
                            <div className="p-4">
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-800">
                                        {course.category}
                                    </span>
                                    <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800">
                                        {course.level}
                                    </span>
                                </div>
                                <Link href={`/learn/${course.id}`}>
                                    <h3 className="mt-2 font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">
                                        {course.title}
                                    </h3>
                                </Link>
                                <p className="mt-1 text-sm text-gray-500 line-clamp-2">{course.description}</p>
                                <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
                                    <div className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {course.duration_hours ?? 0}h
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {course.students_count ?? 0}
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Star className="h-3 w-3" />
                                        {course.rating ?? 'N/A'}
                                    </div>
                                </div>
                                <div className="mt-4 flex items-center justify-between">
                                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                                        {course.type === 'free' ? 'Free' : `$${course.price}`}
                                    </span>
                                    <Link
                                        href={`/learn/${course.id}/enroll`}
                                        method="post"
                                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
                                    >
                                        Enroll
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
