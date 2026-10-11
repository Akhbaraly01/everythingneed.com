import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import Image from '@/components/shared/Image';

interface CategoryDetailProps {
    category_id: string;
}

interface Category {
    id: string;
    name: string;
    description?: string;
    parent_id?: string;
}

interface Product {
    id: string;
    slug?: string;
    name: string;
    price: number;
    image_url?: string;
    vendor_name?: string;
}

export default function CategoriesShow({ category_id }: CategoryDetailProps) {
    const [category, setCategory] = useState<Category | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get<{ data: Category }>(`/api/categories/${category_id}`)
            .then((catRes) => {
                const cat = catRes.data;
                setCategory(cat);
                return api.get<{ data: Product[] }>(
                    `/api/products?category=${encodeURIComponent(cat?.name ?? '')}&per_page=20`,
                );
            })
            .then((prodRes) => setProducts(prodRes.data ?? []))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [category_id]);

    return (
        <AppLayout title={category?.name ?? 'Category'}>
            <Head title={category?.name ?? 'Category'} />
            <div className="space-y-6">
                <Link href="/categories" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                    <ArrowLeft className="h-4 w-4" /> All Categories
                </Link>

                {loading ? <p className="text-gray-500">Loading...</p> : category && (
                    <>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{category.name}</h1>
                            {category.description && <p className="text-sm text-gray-500">{category.description}</p>}
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {products.map((p) => (
                                <Link key={p.id} href={`/products/${p.slug ?? p.id}`} className="rounded-lg bg-white p-4 shadow transition hover:shadow-md dark:bg-gray-800">
                                    <div className="h-32 rounded-lg bg-gray-100 dark:bg-gray-700">
                                        {p.image_url && <Image src={p.image_url} alt="" className="h-full w-full rounded-lg object-cover" />}
                                    </div>
                                    <p className="mt-2 font-medium text-gray-900 dark:text-white">{p.name}</p>
                                    <p className="text-lg font-bold text-indigo-600">{formatPrice(p.price)}</p>
                                    {p.vendor_name && <p className="text-xs text-gray-400">by {p.vendor_name}</p>}
                                </Link>
                            ))}
                        </div>
                        {products.length === 0 && <p className="text-gray-500">No products in this category yet.</p>}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
