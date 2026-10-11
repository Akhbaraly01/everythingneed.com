import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import type { Course } from '@/types';
import { Search } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { api, errorMessage, rows } from '@/lib/api';
import CourseCard from '@/components/learn/CourseCard';
import EmptyState from '@/components/shared/EmptyState';

export default function LearnSearch() {
    const [query, setQuery] = useState('');
    const [courses, setCourses] = useState<Course[]>([]);
    const [searched, setSearched] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const search = (e: FormEvent) => {
        e.preventDefault();
        const q = query.trim();
        if (q === '') return;
        setLoading(true);
        setError(null);
        api.get<{ data: Course[] }>(`/api/courses?q=${encodeURIComponent(q)}&per_page=24`)
            .then((res) => {
                setCourses(rows<Course>(res));
                setSearched(true);
            })
            .catch((e) => setError(errorMessage(e, 'Search failed')))
            .finally(() => setLoading(false));
    };

    return (
        <AppLayout>
            <Head title="Search Courses" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Search Courses</h1>

                <form onSubmit={search} className="flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Course title or topic..."
                            className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 dark:border-gray-600 dark:bg-gray-700"
                        />
                    </div>
                    <button type="submit" disabled={loading}
                        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50">
                        {loading ? 'Searching...' : 'Search'}
                    </button>
                </form>

                {error && <p className="text-sm text-red-600">{error}</p>}

                {searched && courses.length === 0 && !error && (
                    <EmptyState title={`No courses match “${query}”.`} />
                )}

                {courses.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {courses.map((course) => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
