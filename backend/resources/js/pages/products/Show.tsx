import AppLayout from '@/layouts/AppLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { api } from '@/lib/api';
import type { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ShoppingCart, Heart, Star, Truck, Shield, RotateCcw, Minus, Plus, Check } from 'lucide-react';
import { useState } from 'react';

interface ProductShowProps {
    product: Product;
}

export default function ProductShow({ product }: ProductShowProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } } };
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [added, setAdded] = useState(false);

    const handleAddToCart = async () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        setAdding(true);
        try {
            await api.post('/api/cart/items', {
                product_id: product.id,
                quantity,
            });
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        } catch (e: any) {
            alert(e.message ?? 'Failed to add to cart');
        } finally {
            setAdding(false);
        }
    };

    const handleWishlist = () => {
        if (!auth?.user) {
            router.visit('/login');
            return;
        }
        api.post('/api/wishlist', { product_id: product.id }).catch(() => {});
    };

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
                        {product.images && product.images.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {product.images.slice(0, 4).map((img, i) => (
                                    <div key={i} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                        <img src={img} alt="" className="h-full w-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
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
                            {product.vendor && (
                                <Link href={`/vendors/${product.vendor_id}`} className="mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500">
                                    {product.vendor.store_name}
                                    {product.vendor.is_verified && <span className="text-green-500">✓</span>}
                                </Link>
                            )}
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

                        {/* Quantity + Add to Cart */}
                        <div className="flex items-center gap-4">
                            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Minus className="h-4 w-4" />
                                </button>
                                <span className="w-12 text-center font-medium">{quantity}</span>
                                <button
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                disabled={adding || product.stock_quantity <= 0}
                                className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold text-white transition ${
                                    added ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'
                                } disabled:opacity-50`}
                            >
                                {added ? (
                                    <><Check className="h-5 w-5" /> Added!</>
                                ) : adding ? (
                                    'Adding...'
                                ) : product.stock_quantity <= 0 ? (
                                    'Out of Stock'
                                ) : (
                                    <><ShoppingCart className="h-5 w-5" /> Add to Cart</>
                                )}
                            </button>
                            <button
                                onClick={handleWishlist}
                                className="rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
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
