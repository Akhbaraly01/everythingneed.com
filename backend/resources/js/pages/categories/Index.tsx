import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { FolderTree } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Category {
    id: string;
    name: string;
    slug?: string;
    description?: string;
    children?: Category[];
    products_count?: number;
}

export default function CategoriesIndex() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Category[] }>('/api/categories/tree')
            .then((res) => setCategories(res.data))
            .catch(() => api.get<{ data: Category[] }>('/api/categories').then((r) => setCategories(r.data)).catch(() => setCategories([])))
            .finally(() => setLoading(false));
    }, []);

    return (
        <AppLayout title="Categories">
            <Head title="Categories" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : categories.length === 0 ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <FolderTree className="mx-auto h-12 w-12 text-gray-400" />
                        <p className="mt-4 text-gray-500">No categories found</p>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {categories.map((cat) => (
                            <Link key={cat.id} href={`/categories/${cat.id}`}
                                className="rounded-lg bg-white p-6 shadow transition hover:shadow-md dark:bg-gray-800">
                                <h3 className="font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">{cat.name}</h3>
                                {cat.description && <p className="mt-2 text-sm text-gray-500 line-clamp-2">{cat.description}</p>}
                                {cat.products_count != null && <p className="mt-2 text-xs text-gray-400">{cat.products_count} products</p>}
                                {cat.children && cat.children.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-1">
                                        {cat.children.slice(0, 5).map((child) => (
                                            <span key={child.id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400">{child.name}</span>
                                        ))}
                                    </div>
                                )}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
