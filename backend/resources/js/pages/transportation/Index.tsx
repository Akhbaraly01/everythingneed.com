import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { Plane, Car, Truck, Bike, Package, MapPin, Wallet } from 'lucide-react';

const SERVICES = [
    { name: 'Flights', href: '/flights', icon: Plane, desc: 'Search and book flights', color: 'bg-blue-500' },
    { name: 'Ride Booking', href: '/transportation/ride-booking', icon: Car, desc: 'Book a car ride', color: 'bg-green-500' },
    { name: 'Trucks & Lorries', href: '/transportation/custom-request?vehicle=truck', icon: Truck, desc: 'Heavy transport', color: 'bg-orange-500' },
    { name: 'Motorcycles', href: '/transportation/custom-request?vehicle=motorcycle', icon: Bike, desc: 'Quick delivery', color: 'bg-purple-500' },
    { name: 'Logistics', href: '/deliveries', icon: Package, desc: 'Track deliveries', color: 'bg-indigo-500' },
    { name: 'Custom Request', href: '/transportation/custom-request', icon: MapPin, desc: 'Request custom transport', color: 'bg-pink-500' },
    { name: 'Driver Earnings', href: '/transportation/driver/earnings', icon: Wallet, desc: 'Your completed-ride payouts', color: 'bg-emerald-600' },
];

export default function TransportationIndex() {
    return (
        <AppLayout title="Transportation">
            <Head title="Transportation" />
            <div className="space-y-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transportation</h1>
                    <p className="text-gray-500">Flights, rides, logistics and more</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {SERVICES.map((s) => (
                        <Link key={s.name} href={s.href} className="rounded-lg bg-white p-6 shadow hover:ring-2 hover:ring-blue-500 dark:bg-gray-800">
                            <div className={`h-12 w-12 rounded-lg ${s.color} flex items-center justify-center`}>
                                <s.icon className="h-6 w-6 text-white" />
                            </div>
                            <h3 className="mt-4 font-semibold text-gray-900 dark:text-white">{s.name}</h3>
                            <p className="text-sm text-gray-500">{s.desc}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
