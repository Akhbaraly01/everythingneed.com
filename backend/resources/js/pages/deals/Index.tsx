import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Briefcase, Hotel, UtensilsCrossed, Building2, Sprout, HardHat, Plane, Truck, Handshake } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';

const dealCategories = [
    { name: 'Tasks & Gigs', href: '/tasks', icon: Briefcase, color: 'text-blue-600', desc: 'Find freelancers or get tasks done' },
    { name: 'Hotels', href: '/hotels', icon: Hotel, color: 'text-purple-600', desc: 'Book hotel rooms' },
    { name: 'Food', href: '/food', icon: UtensilsCrossed, color: 'text-orange-600', desc: 'Order from restaurants' },
    { name: 'Real Estate', href: '/properties', icon: Building2, color: 'text-green-600', desc: 'Properties for sale or rent' },
    { name: 'Agriculture', href: '/agriculture', icon: Sprout, color: 'text-emerald-600', desc: 'Agricultural products' },
    { name: 'Building Services', href: '/building-services', icon: HardHat, color: 'text-yellow-600', desc: 'Construction & maintenance' },
    { name: 'Flights', href: '/flights', icon: Plane, color: 'text-sky-600', desc: 'Search and book flights' },
    { name: 'Job Seekers', href: '/job-seekers', icon: Truck, color: 'text-red-600', desc: 'Find workers or jobs' },
    { name: 'Needs & Services', href: '/needs', icon: Handshake, color: 'text-indigo-600', desc: 'Submit service requests' },
];

// Gold vertical landings (deals/{slug}): same destinations, editorial guides.
const dealLandings = [
    { name: 'Food deals guide', href: '/deals/food' },
    { name: 'Jobs deals guide', href: '/deals/jobs' },
    { name: 'Hotels deals guide', href: '/deals/hotels' },
    { name: 'Real-estate deals guide', href: '/deals/real-estate' },
    { name: 'Tasks deals guide', href: '/deals/tasks' },
    { name: 'Transport deals guide', href: '/deals/transportation' },
    { name: 'Agriculture deals guide', href: '/deals/agriculture' },
    { name: 'Booking deals guide', href: '/deals/booking' },
];

interface NeedCategory {
    id: string;
    name: string;
    slug: string;
}

export default function DealsIndex() {
    const [live, setLive] = useState<Array<{ id: string; slug?: string | null; name: string; price?: number | null }>>([]);

    // Live deal items below the hub (the grid above is the directory).
    useEffect(() => {
        api.get<{ data: Array<{ id: string; slug?: string | null; name: string; price?: number | null }> }>('/api/deals?per_page=6')
            .then((res) => setLive(Array.isArray(res.data) ? res.data : []))
            .catch(() => setLive([]));
    }, []);

    // Deal-category taxonomy (same NeedCategory tree the request form uses).
    const [cats, setCats] = useState<NeedCategory[]>([]);
    useEffect(() => {
        api.get<{ data: NeedCategory[] }>('/api/need-categories')
            .then((res) => setCats(Array.isArray(res.data) ? res.data : []))
            .catch(() => setCats([]));
    }, []);

    return (
        <AppLayout title="Deals">
            <Head title="Deals" />
            <div className="space-y-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Deals & Services</h1>
                <p className="text-sm text-gray-500">Explore all available services and deals</p>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {dealCategories.map((cat) => (
                        <Link key={cat.href} href={cat.href}
                            className="group rounded-lg bg-white p-6 shadow transition hover:shadow-lg dark:bg-gray-800">
                            <cat.icon className={`h-10 w-10 ${cat.color}`} />
                            <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 dark:text-white">{cat.name}</h2>
                            <p className="mt-1 text-sm text-gray-500">{cat.desc}</p>
                        </Link>
                    ))}
                </div>

                {live.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Latest deals</h2>
                        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {live.map((deal) => (
                                <Link
                                    key={deal.id}
                                    href={`/deals/${deal.slug || deal.id}`}
                                    className="rounded-lg bg-white p-4 shadow transition hover:shadow-lg dark:bg-gray-800"
                                >
                                    <p className="font-semibold text-gray-900 dark:text-white">{deal.name}</p>
                                    {deal.price != null && (
                                        <p className="mt-1 font-bold text-indigo-600">{formatPrice(deal.price)}</p>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {cats.length > 0 && (
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Shop by category</h2>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {cats.map((c) => (
                                <Link
                                    key={c.id}
                                    href={`/deals/category/${c.slug}`}
                                    className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                >
                                    {c.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Deal guides</h2>
                    <p className="mt-1 text-sm text-gray-500">Editorial walkthroughs for each vertical</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                        {dealLandings.map((l) => (
                            <Link
                                key={l.href}
                                href={l.href}
                                className="rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-700 hover:border-indigo-300 hover:text-indigo-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            >
                                {l.name}
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
