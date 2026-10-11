import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { BadgeCheck, Package, Star, ArrowLeft } from 'lucide-react';
import type { Product, Vendor } from '@/types';
import { formatPrice } from '@/lib/currency';
import { EmptyState } from '@/components/shared/Ui';
import Image from '@/components/shared/Image';

interface Pager<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

interface Props {
    vendor: Vendor;
    products: Pager<Product>;
}

export default function VendorProducts({ vendor, products }: Props) {
    const pagerLink = (page: number) => `/vendors/${vendor.slug ?? vendor.id}/products?page=${page}`;

    return (
        <AppLayout>
            <Head title={`${vendor.store_name} - products`} />

            <div className="mx-auto max-w-5xl space-y-6">
                <Link
                    href={`/vendors/${vendor.slug ?? vendor.id}`}
                    className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back to {vendor.store_name}
                </Link>

                <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                                {vendor.store_name}
                                {vendor.is_verified && <BadgeCheck className="h-6 w-6 text-green-500" />}
                            </h1>
                            <div className="mt-1 flex items-center gap-3 text-sm text-gray-500">
                                <span className="capitalize">{vendor.category}</span>
                                <span className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    {Number(vendor.rating ?? 0).toFixed(1)}
                                </span>
                                <span>{products.total} product{products.total !== 1 ? 's' : ''}</span>
                            </div>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <Link href={`/vendors/${vendor.slug ?? vendor.id}/services`} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Services</Link>
                            <Link href={`/vendors/${vendor.slug ?? vendor.id}/reviews`} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Reviews</Link>
                        </div>
                    </div>
                </div>

                {products.data.length === 0 ? (
                    <div className="rounded-lg bg-white p-8 shadow dark:bg-gray-800">
                        <EmptyState icon={<Package className="h-10 w-10" />} title="No products listed yet" />
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                        {products.data.map((p) => (
                            <Link
                                key={p.id}
                                href={`/products/${p.slug ?? p.id}`}
                                className="group rounded-lg bg-white p-3 shadow transition hover:shadow-md dark:bg-gray-800"
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
                                <p className="mt-2 line-clamp-2 text-sm font-medium text-gray-900 group-hover:text-indigo-600 dark:text-white">{p.name}</p>
                                <p className="text-sm font-semibold text-indigo-600">{formatPrice(p.price)}</p>
                            </Link>
                        ))}
                    </div>
                )}

                {products.last_page > 1 && (
                    <div className="flex items-center justify-center gap-3 text-sm">
                        {products.current_page > 1 && (
                            <Link href={pagerLink(products.current_page - 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Previous</Link>
                        )}
                        <span className="text-gray-500">Page {products.current_page} of {products.last_page}</span>
                        {products.current_page < products.last_page && (
                            <Link href={pagerLink(products.current_page + 1)} className="rounded-lg border border-gray-300 px-3 py-1.5 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700">Next</Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
