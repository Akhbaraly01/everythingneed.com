import { Link, usePage } from '@inertiajs/react';

const TABS = [
    { label: 'Dashboard', href: '/vendor/dashboard' },
    { label: 'Products', href: '/vendor/products' },
    { label: 'Orders', href: '/vendor/orders' },
    { label: 'Services', href: '/vendor/services' },
    { label: 'Bookings', href: '/vendor/bookings' },
    { label: 'Reviews', href: '/vendor/reviews' },
    { label: 'Profile', href: '/vendor/profile' },
    { label: 'Earnings', href: '/vendor/earnings' },
    { label: 'Payouts', href: '/vendor/payouts' },
    { label: 'Settings', href: '/vendor/settings' },
];

/** Spec §34: one tab bar shared by every vendor workspace page. */
export default function VendorTabs() {
    const { url } = usePage();
    const current = url.split('?')[0];

    return (
        <nav className="flex flex-wrap gap-1 overflow-x-auto rounded-lg bg-white p-1.5 shadow dark:bg-gray-800">
            {TABS.map((tab) => {
                const active = current === tab.href || (tab.href !== '/vendor/dashboard' && current.startsWith(tab.href));
                return (
                    <Link
                        key={tab.href}
                        href={tab.href}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium whitespace-nowrap transition ${
                            active
                                ? 'bg-indigo-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                        }`}
                    >
                        {tab.label}
                    </Link>
                );
            })}
        </nav>
    );
}
