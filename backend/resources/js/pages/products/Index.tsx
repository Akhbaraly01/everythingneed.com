import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Heart, Star } from 'lucide-react';
import { useState } from 'react';

interface ProductsProps {
    products: {
        data: Product[];
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
        };
    };
    filters?: {
        category?: string;
        search?: string;
    };
}

export default function Products({ products, filters }: ProductsProps) {
    const [search, setSearch] = useState(filters?.search ?? '');

    return (
        <AppLayout title="Products">
            <Head title="Products" />

            <div className="space-y-6">
                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Search
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {['All', 'Electronics', 'Clothing', 'Home', 'Beauty'].map((cat) => (
                            <Link
                                key={cat}
                                href={cat === 'All' ? '/products' : `/products?category=${cat.toLowerCase()}`}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    (filters?.category ?? 'all') === cat.toLowerCase()
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.data.map((product) => (
                        <div
                            key={product.id}
                            className="group rounded-lg bg-white shadow transition hover:shadow-md dark:bg-gray-800"
                        >
                            <div className="relative aspect-square overflow-hidden rounded-t-lg bg-gray-100">
                                {product.image_url ? (
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-gray-400">
                                        No image
                                    </div>
                                )}
                                <button className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md opacity-0 transition group-hover:opacity-100">
                                    <Heart className="h-4 w-4 text-gray-600" />
                                </button>
                            </div>
                            <div className="p-4">
                                <Link href={`/products/${product.id}`}>
                                    <h3 className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">
                                        {product.name}
                                    </h3>
                                </Link>
                                <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600">{product.rating ?? 'N/A'}</span>
                                    <span className="text-xs text-gray-400">({product.reviews_count ?? 0})</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(product.price)}
                                        </span>
                                        {product.compare_price && (
                                            <span className="ml-2 text-sm text-gray-400 line-through">
                                                {formatCurrency(product.compare_price)}
                                            </span>
                                        )}
                                    </div>
                                    <button className="rounded-lg bg-indigo-600 p-2 text-white hover:bg-indigo-500">
                                        <ShoppingCart className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Pagination */}
                {products.meta.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: products.meta.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={`/products?page=${page}`}
                                className={`rounded-lg px-4 py-2 text-sm font-medium ${
                                    page === products.meta.current_page
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {page}
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
