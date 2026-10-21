import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api, ApiError, errorMessage } from '@/lib/api';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import {ShoppingCart, Star, Search} from 'lucide-react';
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
        sort?: string;
    };
}

export default function Products({ products, filters }: ProductsProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } | null };
    const [search, setSearch] = useState(filters?.search ?? '');
    const [cartMessage, setCartMessage] = useState<string | null>(null);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/products', { search: search || undefined, category: filters?.category }, { preserveState: true });
    };

    const handleAddToCart = async (productId: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // The cart API is behind auth:sanctum - guests get a sign-in prompt
        // instead of a generic failure toast.
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        try {
            await api.post('/api/cart/items', { product_id: productId, quantity: 1 });
            setCartMessage('Added to cart!');
            setTimeout(() => setCartMessage(null), 2000);
        } catch (err) {
            if (err instanceof ApiError && err.status === 401) {
                router.visit('/login');
                return;
            }
            toast.error(errorMessage(err, 'Could not add to cart. Please try again.'));
        }
    };

    return (
        <AppLayout title="Products">
            <Head title="Products" />

            <div className="space-y-6">
                {/* Cart toast */}
                {cartMessage && (
                    <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
                        {cartMessage}
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search products..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500">
                            Search
                        </button>
                    </form>
                    <div className="flex gap-2 overflow-x-auto pb-1 max-w-full" style={{ scrollbarWidth: 'none' }}>
                        {['All', 'Electronics', 'Clothing', 'Home', 'Beauty'].map((cat) => (
                            <Link
                                key={cat}
                                href={cat === 'All' ? '/products' : `/products?category=${cat.toLowerCase()}${search ? `&search=${search}` : ''}`}
                                className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
                                    (filters?.category ?? 'all') === cat.toLowerCase() || (cat === 'All' && !filters?.category)
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                }`}
                            >
                                {cat}
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Product count + server-side sort */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-gray-500">{products.meta.total} product{products.meta.total !== 1 ? 's' : ''} found</p>
                    <div className="flex items-center gap-2">
                        <label htmlFor="product-sort" className="text-sm text-gray-500">Sort:</label>
                        <select
                            id="product-sort"
                            value={filters?.sort ?? 'newest'}
                            onChange={(e) =>
                                router.get(
                                    '/products',
                                    {
                                        ...(filters?.search ? { search: filters.search } : {}),
                                        ...(filters?.category ? { category: filters.category } : {}),
                                        ...(e.target.value !== 'newest' ? { sort: e.target.value } : {}),
                                    },
                                    { preserveState: true },
                                )
                            }
                            className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        >
                            <option value="newest">Newest</option>
                            <option value="price_asc">Price: Low to High</option>
                            <option value="price_desc">Price: High to Low</option>
                            <option value="rating">Top Rated</option>
                            <option value="popular">Most Popular</option>
                            <option value="name_asc">Name: A-Z</option>
                        </select>
                    </div>
                </div>

                {/* Product Grid */}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {products.data.map((product) => (
                        <Link
                            key={product.id}
                            href={`/products/${product.slug ?? product.id}`}
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
                                <button
                                    onClick={(e) => handleAddToCart(product.id, e)}
                                    aria-label={`Add ${product.name} to cart`}
                                    className="absolute right-2 top-2 rounded-full bg-white p-2 shadow-md opacity-70 transition hover:bg-indigo-50 hover:opacity-100 focus:opacity-100 focus-visible:opacity-100"
                                    title="Add to cart"
                                >
                                    <ShoppingCart className="h-4 w-4 text-indigo-600" />
                                </button>
                            </div>
                            <div className="p-4">
                                <h3 className="text-sm font-semibold text-gray-900 hover:text-indigo-600 dark:text-white">
                                    {product.name}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500">{product.category}</p>
                                <div className="mt-2 flex items-center gap-1">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="text-xs text-gray-600">{product.rating ?? 'N/A'}</span>
                                    <span className="text-xs text-gray-400">({product.reviews_count ?? 0})</span>
                                </div>
                                <div className="mt-3 flex items-center justify-between">
                                    <div>
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            {formatPrice(product.price)}
                                        </span>
                                        {product.compare_price && (
                                            <span className="ml-2 text-sm text-gray-400 line-through">
                                                {formatPrice(product.compare_price)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Pagination */}
                {products.meta.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from({ length: products.meta.last_page }, (_, i) => i + 1).map((page) => (
                            <Link
                                key={page}
                                href={`/products?page=${page}${filters?.category ? `&category=${filters.category}` : ''}${filters?.search ? `&search=${filters.search}` : ''}`}
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
