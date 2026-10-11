import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import type { Vendor } from '@/types';
import { Store, Star, CheckCircle } from 'lucide-react';

interface VendorsProps {
    vendors: {
        data: Vendor[];
        meta: { current_page: number; last_page: number; per_page: number; total: number };
    };
}

export default function Vendors({ vendors }: VendorsProps) {
    return (
        <AppLayout title="Vendors">
            <Head title="Vendors" />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {vendors.data.map((vendor) => (
                    <Link key={vendor.id} href={`/vendors/${vendor.slug ?? vendor.id}`} className="block rounded-lg bg-white p-6 shadow hover:shadow-md dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                            <div className="rounded-full bg-indigo-100 p-3"><Store className="h-6 w-6 text-indigo-600" /></div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{vendor.store_name}</h3>
                                <p className="text-sm text-gray-500">{vendor.category}</p>
                            </div>
                        </div>
                        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />{vendor.rating ?? 'N/A'}
                            {vendor.is_verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                    </Link>
                ))}
            </div>
        </AppLayout>
    );
}
