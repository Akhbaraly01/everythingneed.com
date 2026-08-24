import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw } from 'lucide-react';

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product }: ProductShowProps) {
    return (
        <AppLayout>
            <Head title={product.name} />

            <div className="space-y-8">
                {/* Breadcrumb */}
                <nav className="flex text-sm text-gray-500">
                    <Link href="/products" className="hover:text-gray-700">Products</Link>
                    <span className="mx-2">/</span>
                    <Link href={`/products?category=${product.category}`} className="hover:text-gray-700">
                        {product.category}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-gray-900 dark:text-white">{product.name}</span>
                </nav>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Images */}
                    <div className="space-y-4">
                        <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                            )}
                        </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{product.name}</h1>
                            <div className="mt-2 flex items-center gap-2">
                                <div className="flex items-center">
                                    <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                                    <span className="ml-1 text-sm font-medium">{product.rating ?? 'N/A'}</span>
                                    <span className="ml-1 text-sm text-gray-500">({product.reviews_count ?? 0} reviews)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                {formatCurrency(product.price)}
                            </span>
                            {product.compare_price && (
                                <span className="text-xl text-gray-400 line-through">
                                    {formatCurrency(product.compare_price)}
                                </span>
                            )}
                        </div>

                        {product.description && (
                            <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
                        )}

                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Truck className="h-4 w-4" />
                                Free shipping on orders over $50
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <Shield className="h-4 w-4" />
                                Secure payment
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <RotateCcw className="h-4 w-4" />
                                30-day return policy
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500">
                                Add to Cart
                            </button>
                            <button className="rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                                <Heart className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>

                        <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-800">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Category:</span> {product.category}
                            </p>
                            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Stock:</span>{' '}
                                {product.stock_quantity > 0 ? `${product.stock_quantity} available` : 'Out of stock'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
