import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { FolderOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api, errorMessage } from '@/lib/api';

interface Category {
    name: string;
    slug: string;
    courses_count?: number;
}

export default function LearnCategories() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        api.get<{ data: Category[] }>('/api/course-categories')
            .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
            .catch((e) => setError(errorMessage(e, 'Failed to load categories')))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout>
            <Head title="Course Categories" />
            <div className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Categories</h1>

                {loading ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">Loading categories...</p>
                    </div>
                ) : error ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-gray-500">{error}</p>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FolderOpen className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No categories yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {categories.map((category) => (
                            <Link key={category.slug} href={`/learn/categories/${category.slug}`}
                                className="rounded-lg bg-white p-5 shadow hover:shadow-md dark:bg-gray-800">
                                <p className="font-semibold text-gray-900 dark:text-white">{category.name}</p>
                                <p className="mt-1 text-sm text-gray-500">
                                    {category.courses_count ?? 0} course{(category.courses_count ?? 0) === 1 ? '' : 's'}
                                </p>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
