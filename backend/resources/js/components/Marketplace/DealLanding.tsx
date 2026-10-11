import { Link } from '@inertiajs/react';
import {
    Briefcase,
    Hotel,
    UtensilsCrossed,
    Building2,
    Sprout,
    Plane,
    Handshake,
    ListChecks,
    ArrowRight,
    LucideIcon,
} from 'lucide-react';

export interface DealLandingConfig {
    slug: string;
    title: string;
    description: string;
    icon: LucideIcon;
    color: string;
    verticalHref: string;
    ctaLabel: string;
    highlights: string[];
}

/**
 * Single reusable landing for /deals/{slug} verticals.
 * Config-driven â€” add a vertical by extending DEAL_LANDINGS + a web route.
 */
export const DEAL_LANDINGS: Record<string, DealLandingConfig> = {
    food: {
        slug: 'food',
        title: 'Food & Restaurants',
        description: 'Order from local restaurants, track delivery, and enjoy meals at home.',
        icon: UtensilsCrossed,
        color: 'from-orange-500 to-orange-600',
        verticalHref: '/food',
        ctaLabel: 'Browse Restaurants',
        highlights: ['Live restaurant menus', 'Order tracking', 'Delivery to your door'],
    },
    jobs: {
        slug: 'jobs',
        title: 'Jobs & Careers',
        description: 'Find open roles, apply in minutes, and manage your applications.',
        icon: Briefcase,
        color: 'from-blue-500 to-blue-600',
        verticalHref: '/jobs',
        ctaLabel: 'View Open Jobs',
        highlights: ['Fresh listings', 'Easy apply', 'Application status'],
    },
    hotels: {
        slug: 'hotels',
        title: 'Hotels & Stays',
        description: 'Search rooms, check availability, and book stays with instant confirmation.',
        icon: Hotel,
        color: 'from-purple-500 to-purple-600',
        verticalHref: '/hotels',
        ctaLabel: 'Search Hotels',
        highlights: ['Real availability', 'Secure booking', 'Manage reservations'],
    },
    'real-estate': {
        slug: 'real-estate',
        title: 'Real Estate',
        description: 'Browse properties for sale or rent and connect with agents.',
        icon: Building2,
        color: 'from-green-500 to-green-600',
        verticalHref: '/properties',
        ctaLabel: 'Browse Properties',
        highlights: ['Verified listings', 'Filter by type', 'Direct inquiries'],
    },
    tasks: {
        slug: 'tasks',
        title: 'Tasks & Gigs',
        description: 'Post a task or pick up gigs â€” get work done faster.',
        icon: ListChecks,
        color: 'from-indigo-500 to-indigo-600',
        verticalHref: '/tasks',
        ctaLabel: 'Open Task Center',
        highlights: ['Post a task', 'Worker submissions', 'Secure payments'],
    },
    transportation: {
        slug: 'transportation',
        title: 'Transportation & Rides',
        description: 'Book rides, flights, and transport services in one place.',
        icon: Plane,
        color: 'from-sky-500 to-sky-600',
        verticalHref: '/transportation',
        ctaLabel: 'Explore Transport',
        highlights: ['Rides & flights', 'Live booking', 'Trip history'],
    },
    agriculture: {
        slug: 'agriculture',
        title: 'Agriculture & Farming',
        description: 'Farm products, workers, and agri-services for growers and buyers.',
        icon: Sprout,
        color: 'from-emerald-500 to-emerald-600',
        verticalHref: '/agriculture',
        ctaLabel: 'Explore Agriculture',
        highlights: ['Fresh produce', 'Hire farm workers', 'Agri services'],
    },
    booking: {
        slug: 'booking',
        title: 'Bookings & Reservations',
        description: 'Hotels, appointments, and services â€” book anything from one hub.',
        icon: Handshake,
        color: 'from-amber-500 to-amber-600',
        verticalHref: '/bookings',
        ctaLabel: 'Manage Bookings',
        highlights: ['Unified bookings', 'Reminders', 'Easy reschedule'],
    },
};

export const DEAL_SLUGS = Object.keys(DEAL_LANDINGS);

interface DealLandingProps {
    slug: string;
}

export default function DealLanding({ slug }: DealLandingProps) {
    const config = DEAL_LANDINGS[slug];
    if (!config) {
        return (
            <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Deal category not found</h2>
                <Link href="/deals" className="mt-4 inline-block text-sm text-indigo-600 hover:underline">
                    Back to all deals
                </Link>
            </div>
        );
    }

    const Icon = config.icon;

    return (
        <div className="space-y-6">
            <section
                className={`rounded-xl bg-gradient-to-br ${config.color} p-8 text-white shadow-lg md:p-12`}
                data-testid="deal-landing-hero"
            >
                <div className="flex items-start gap-4">
                    <div className="rounded-lg bg-white/20 p-3">
                        <Icon className="h-8 w-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold md:text-3xl">{config.title}</h1>
                        <p className="mt-2 max-w-xl text-white/90">{config.description}</p>
                        <Link
                            href={config.verticalHref}
                            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 shadow hover:bg-gray-100"
                        >
                            {config.ctaLabel}
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-3">
                {config.highlights.map((h) => (
                    <div key={h} className="rounded-lg bg-white p-5 shadow dark:bg-gray-800">
                        <p className="font-medium text-gray-900 dark:text-white">{h}</p>
                    </div>
                ))}
            </section>

            <section className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Ready to start?</h2>
                        <p className="text-sm text-gray-500">Everything for {config.title.toLowerCase()} lives in one place.</p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={config.verticalHref}
                            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                        >
                            {config.ctaLabel}
                        </Link>
                        <Link
                            href="/deals"
                            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
                        >
                            All Deals
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
