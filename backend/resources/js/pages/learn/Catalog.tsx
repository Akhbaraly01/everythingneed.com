import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { BookOpen, Star, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Course {
    id: string;
    title: string;
    instructor?: string;
    description?: string;
    price: number;
    image_url?: string;
    category?: string;
    lessons_count?: number;
    enrolled_count?: number;
    rating?: number;
}

export default function LearnCatalog() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoryFilter, setCategoryFilter] = useState('');

    useEffect(() => {
        const params = categoryFilter ? `?category=${encodeURIComponent(categoryFilter)}` : '';
        api.get<{ data: Course[] }>(`/api/courses${params}`)
            .then((res) => setCourses(res.data))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, [categoryFilter]);

    const categories = ['Web Development', 'Mobile Development', 'Data Science', 'Business', 'Design', 'Marketing'];

    return (
        <AppLayout title="Course Catalog">
            <Head title="Course Catalog" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Catalog</h1>
                    <p className="text-sm text-gray-500">Browse all available courses</p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setCategoryFilter('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>All</button>
                    {categories.map((c) => (
                        <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${categoryFilter === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>{c}</button>
                    ))}
                </div>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800"><p className="text-gray-500">Loading...</p></div>
                ) : courses.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">No courses found</h3>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((c) => (
                            <Link key={c.id} href={`/learn/${c.id}`} className="group overflow-hidden rounded-lg bg-white shadow transition hover:shadow-lg dark:bg-gray-800">
                                <div className="h-40 bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                    {c.image_url ? <img src={c.image_url} alt="" className="h-full w-full object-cover" /> : <BookOpen className="h-12 w-12 text-indigo-400" />}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{c.title}</h3>
                                    <p className="text-sm text-gray-500">{c.instructor}</p>
                                    {c.category && <p className="mt-1 text-xs text-indigo-600">{c.category}</p>}
                                    <div className="mt-2 flex items-center justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatCurrency(c.price)}</span>
                                        {c.rating && <span className="flex items-center gap-1 text-xs text-yellow-600"><Star className="h-3 w-3 fill-yellow-400" />{c.rating}</span>}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
