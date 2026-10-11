import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, Package, Star, ArrowLeft, Store } from 'lucide-react';
import type { Product, Vendor } from '@/types';
import { formatPrice } from '@/lib/currency';
import { EmptyState } from '@/components/shared/Ui';
import Image from '@/components/shared/Image';

interface Props {
    product: Product;
    vendor: Vendor & { products?: Product[] };
}

export default function ProductVendor({ product, vendor }: Props) {
    const products = vendor.products ?? [];

    return (
        <AppLayout>
            <Head title={`${vendor.store_name} - seller of ${product.name}`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <Link
                    href={`/products/${product.slug}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {product.name}
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {vendor.store_name}
                                {vendor.is_verified && <BadgeCheck className="h-6 w-6 text-green-500" />}
                            </h1>
                            <p className="mt-1 text-sm capitalize text-gray-500">{vendor.category}</p>
                            {vendor.description && (
                                <p className="mt-3 max-w-2xl text-sm text-gray-600 dark:text-gray-300">{vendor.description}</p>
                            )}
                            <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                {Number(vendor.rating ?? 0).toFixed(1)} / 5
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <Link
                                href={`/vendors/${vendor.slug ?? vendor.id}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                                <Store className="h-4 w-4" /> Visit store
                            </Link>
                            <Link
                                href={`/vendors/${vendor.slug ?? vendor.id}/products`}
                                className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                            >
                                All products
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">More from this store</h2>
                    {products.length === 0 ? (
                        <div className="mt-4">
                            <EmptyState icon={<Package className="h-10 w-10" />} title="No other products listed" />
                        </div>
                    ) : (
                        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {products
                                .filter((p) => p.id !== product.id)
                                .map((p) => (
                                    <Link
                                        key={p.id}
                                        href={`/products/${p.slug ?? p.id}`}
                                        className="group rounded-lg border border-gray-100 p-3 transition hover:shadow-md dark:border-gray-700"
                                    >
                                        <div className="aspect-square overflow-hidden rounded-md bg-gray-100 dark:bg-gray-700">
                                            {p.image_url ? (
                                                <Image src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-gray-400">
                                                    <Package className="h-8 w-8" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white">
                                            {p.name}
                                        </p>
                                        <p className="text-sm font-semibold text-indigo-600">{formatPrice(p.price)}</p>
                                    </Link>
                                ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
