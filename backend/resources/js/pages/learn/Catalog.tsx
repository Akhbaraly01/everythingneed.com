import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import { api } from '@/lib/api';
import { BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';
import LoadingState from '@/components/shared/LoadingState';

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
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<string[]>([]);

    useEffect(() => {
        api.get<{ data: Array<{ name: string }> }>('/api/course-categories')
            .then((res) => setCategories((res.data ?? []).map((c) => c.name).filter(Boolean)))
            .catch(() => setCategories([]));
    }, []);

    useEffect(() => {
        const params = new URLSearchParams();
        if (categoryFilter) params.set('category', categoryFilter);
        if (search.trim()) params.set('q', search.trim());
        const qs = params.toString();
        setLoading(true);
        api.get<{ data: Course[] }>(`/api/courses${qs ? `?${qs}` : ''}`)
            .then((res) => setCourses(res.data ?? []))
            .catch(() => setCourses([]))
            .finally(() => setLoading(false));
    }, [categoryFilter, search]);

    return (
        <AppLayout>
            <Head title="Course Catalog" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Catalog</h1>
                    <p className="text-sm text-gray-500">Browse all available courses</p>
                </div>

                <div>
                    <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search courses..."
                        className="w-full max-w-sm rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    <button onClick={() => setCategoryFilter('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${!categoryFilter ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>All</button>
                    {categories.map((c) => (
                        <button key={c} onClick={() => setCategoryFilter(c)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${categoryFilter === c ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 dark:bg-gray-700'}`}>{c}</button>
                    ))}
                </div>

                {loading ? (
                    <LoadingState message="Loading courses..." />
                ) : courses.length === 0 ? (
                    <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No courses found" />
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {courses.map((c) => (
                            <CourseCard key={c.id} course={c} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
