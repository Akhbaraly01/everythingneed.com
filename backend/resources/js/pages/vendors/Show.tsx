import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Vendor, Product } from '@/types';
import { formatPrice } from '@/lib/currency';
import {Store, Star, CheckCircle} from 'lucide-react';
import Image from '@/components/shared/Image';

interface VendorShowProps {
    vendor: Vendor & { products?: Product[] };
}

export default function VendorShow({ vendor }: VendorShowProps) {
    return (
        <AppLayout>
            <Head title={vendor.store_name} />

            <div className="space-y-8">
                {/* Header */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex items-center gap-4">
                        <div className="rounded-full bg-indigo-100 p-4">
                            <Store className="h-8 w-8 text-indigo-600" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{vendor.store_name}</h1>
                                {vendor.is_verified && <CheckCircle className="h-5 w-5 text-green-500" />}
                            </div>
                            <p className="text-sm text-gray-500">{vendor.category}</p>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                {vendor.rating != null && (
                                    <span className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{vendor.rating}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    {vendor.description && (
                        <p className="mt-4 text-gray-600 dark:text-gray-400">{vendor.description}</p>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2 text-sm">
                        <Link href={`/vendors/${vendor.slug ?? vendor.id}/products`} className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                            All products
                        </Link>
                        <Link href={`/vendors/${vendor.slug ?? vendor.id}/services`} className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                            Services
                        </Link>
                        <Link href={`/vendors/${vendor.slug ?? vendor.id}/reviews`} className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">
                            Reviews
                        </Link>
                    </div>
                </div>

                {/* Products */}
                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        Products ({vendor.products?.length ?? 0})
                    </h2>
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {!vendor.products || vendor.products.length === 0 ? (
                            <p className="col-span-full py-8 text-center text-gray-500">No products yet.</p>
                        ) : (
                            vendor.products.filter((p) => p.is_active).map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug ?? product.id}`}
                                    className="group rounded-lg border border-gray-200 p-4 transition hover:shadow-md dark:border-gray-700"
                                >
                                    <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                                        {product.image_url ? (
                                            <Image src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-gray-400">No image</div>
                                        )}
                                    </div>
                                    <h3 className="mt-3 font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white">{product.name}</h3>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                                    {product.rating != null && (
                                        <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                                            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            {product.rating}
                                        </div>
                                    )}
                                </Link>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
