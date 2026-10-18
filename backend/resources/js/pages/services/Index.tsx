import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/AppLayout';
import Image from '@/components/shared/Image';
import {
    Sparkles,
    Wrench,
    Hammer,
    Zap,
    Droplets,
    Scissors,
    PartyPopper,
    Truck,
    Briefcase,
    Car,
    ShoppingBag,
    MoreHorizontal,
    MapPin,
    Clock,
    ChevronLeft,
    ChevronRight,
    Search as SearchIcon,
    type LucideIcon,
} from 'lucide-react';

interface CategoryNode {
    id: string;
    name: string;
    slug: string;
    icon: string | null;
    color: string | null;
    sort_order: number;
    parent_id: string | null;
    services_count?: number;
    children?: CategoryNode[];
}

interface ServiceRow {
    id: string;
    name: string;
    category: string;
    categoryRef?: { id: string; name: string; slug: string } | null;
    description: string | null;
    image_url: string | null;
    provider: string | null;
    pricing_mode: string;
    base_price: string | number;
    currency: string;
    location: string | null;
    availability: { days?: string; hours?: string } | null;
    requires_booking: boolean;
}

interface Props {
    categories: CategoryNode[];
    services: { data: ServiceRow[]; current_page: number; last_page: number; total: number };
    filters: { category: string | null };
    activeCategory: CategoryNode | null;
}

const ICONS: Record<string, LucideIcon> = {
    sparkles: Sparkles,
    wrench: Wrench,
    hammer: Hammer,
    zap: Zap,
    droplets: Droplets,
    scissors: Scissors,
    party: PartyPopper,
    truck: Truck,
    briefcase: Briefcase,
    car: Car,
};

function iconFor(name: string | null | undefined): LucideIcon {
    if (!name) return ShoppingBag;
    const key = name.toLowerCase();
    const hit = Object.entries(ICONS).find(([k]) => key.includes(k));
    return hit ? hit[1] : ShoppingBag;
}

const money = (value: string | number, currency: string) => `${currency} ${Number(value).toFixed(2)}`;

function ServiceTile({ category, active }: { category: CategoryNode; active: boolean }) {
    const Icon = iconFor(category.icon);
    return (
        <Link
            href={`/services?category=${encodeURIComponent(category.slug)}`}
            data-testid={`service-tile-${category.slug}`}
            className="group flex flex-col items-center gap-2"
        >
            <span
                className={`relative flex h-14 w-14 items-center justify-center rounded-2xl transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg md:h-16 md:w-16 ${
                    active ? 'ring-2 ring-offset-2 ring-indigo-500' : ''
                }`}
                style={{ background: category.color ? `linear-gradient(135deg, ${category.color}, ${category.color}cc)` : undefined }}
            >
                {!category.color && <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600" />}
                <Icon className="relative z-10 h-6 w-6 text-white md:h-7 md:w-7" />
            </span>
            <span className="line-clamp-1 text-center text-xs font-medium text-foreground/80 transition-colors group-hover:text-foreground md:text-sm">
                {category.name}
            </span>
            {typeof category.services_count === 'number' && category.services_count > 0 && (
                <span className="-mt-1 text-[10px] text-muted-foreground">{category.services_count} services</span>
            )}
        </Link>
    );
}

export default function ServicesIndex({ categories, services, filters, activeCategory }: Props) {
    const [showAll, setShowAll] = useState(false);

    const roots = categories;
    const quick = roots.slice(0, 7);
    const selectedRoot = activeCategory
        ? activeCategory.parent_id
            ? roots.find((r) => r.id === activeCategory.parent_id) ?? null
            : activeCategory
        : null;

    return (
        <AppLayout title="Services">
            <Head title="Services" />
            <div className="mx-auto max-w-6xl px-4 py-8">
                <div className="mb-8 rounded-2xl bg-gradient-to-r from-indigo-700 to-blue-600 p-8 text-white">
                    <div className="flex items-center gap-3">
                        <Sparkles className="h-9 w-9" />
                        <h1 className="text-3xl font-bold">Services</h1>
                    </div>
                    <p className="mt-2 max-w-xl text-sm text-indigo-100">
                        Book trusted professionals for your home, business and events - every service below is created
                        and managed by the EverythingNeed team.
                    </p>
                </div>

                <div data-testid="service-icon-grid" className="mb-6">
                    <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-4">
                        {quick.map((category) => (
                            <ServiceTile
                                key={category.id}
                                category={category}
                                active={activeCategory?.id === category.id || selectedRoot?.id === category.id}
                            />
                        ))}
                        {roots.length > 7 && (
                            <button
                                type="button"
                                data-testid="service-see-more"
                                onClick={() => setShowAll((v) => !v)}
                                aria-expanded={showAll}
                                className="group flex flex-col items-center gap-1.5"
                            >
                                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg md:h-14 md:w-14">
                                    <MoreHorizontal className="h-5 w-5 text-white md:h-6 md:w-6" />
                                </span>
                                <span className="text-xs font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                                    {showAll ? 'Less' : 'See more'}
                                </span>
                            </button>
                        )}
                    </div>

                    {showAll && (
                        <div className="mt-4 grid grid-cols-4 gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
                            {roots.map((category) => (
                                <ServiceTile
                                    key={category.id}
                                    category={category}
                                    active={activeCategory?.id === category.id || selectedRoot?.id === category.id}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {selectedRoot && (
                    <div className="mb-6 flex flex-wrap items-center gap-2">
                        <Link
                            href="/services"
                            className="rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted"
                        >
                            All services
                        </Link>
                        <span className="rounded-full bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white">
                            {selectedRoot.name}
                        </span>
                        {(selectedRoot.children ?? []).map((child) => (
                            <Link
                                key={child.id}
                                href={`/services?category=${encodeURIComponent(child.slug)}`}
                                data-testid={`service-chip-${child.slug}`}
                                className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                                    activeCategory?.id === child.id
                                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-200'
                                        : 'border-border text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {child.name}
                            </Link>
                        ))}
                    </div>
                )}

                <div className="mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {activeCategory ? activeCategory.name : 'All services'}
                        <span className="ml-2 text-sm font-normal text-gray-500">
                            {services.total} {services.total === 1 ? 'service' : 'services'}
                        </span>
                    </h2>
                </div>

                {services.data.length === 0 ? (
                    <div
                        data-testid="services-empty"
                        className="rounded-xl border border-dashed border-gray-300 p-16 text-center dark:border-gray-600"
                    >
                        <SearchIcon className="mx-auto mb-3 h-10 w-10 text-gray-300" />
                        <p className="font-medium text-gray-900 dark:text-white">No services here yet</p>
                        <p className="text-sm text-gray-500">
                            This category has no live services yet - check back soon or explore another category.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                        {services.data.map((service) => (
                            <Link
                                key={service.id}
                                href={`/services/${service.id}`}
                                data-testid="service-card"
                                className="overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                            >
                                <div className="flex h-36 items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-indigo-900/30 dark:to-blue-900/20">
                                    {service.image_url ? (
                                        <Image src={service.image_url} alt={service.name} className="h-full w-full object-cover" />
                                    ) : (
                                        <Sparkles className="h-12 w-12 text-indigo-500/60" />
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="line-clamp-1 font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                                    <p className="mt-1 text-xs text-indigo-600 dark:text-indigo-400">
                                        {service.categoryRef?.name ?? service.category}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 h-8 text-xs text-gray-500">{service.description}</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="font-bold text-indigo-700 dark:text-indigo-300">
                                            {money(service.base_price, service.currency || 'USD')}
                                            <span className="ml-1 text-xs font-normal text-gray-400">/ {service.pricing_mode}</span>
                                        </span>
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-gray-400">
                                        {service.location && (
                                            <span className="inline-flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> {service.location}
                                            </span>
                                        )}
                                        {service.availability?.days && (
                                            <span className="inline-flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {service.availability.days}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}

                {services.last_page > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-3">
                        {services.current_page > 1 && (
                            <Link
                                href={`/services?${filters.category ? `category=${encodeURIComponent(filters.category)}&` : ''}page=${services.current_page - 1}`}
                                preserveState
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Link>
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Page {services.current_page} of {services.last_page}
                        </span>
                        {services.current_page < services.last_page && (
                            <Link
                                href={`/services?${filters.category ? `category=${encodeURIComponent(filters.category)}&` : ''}page=${services.current_page + 1}`}
                                preserveState
                                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-300 dark:border-gray-600 dark:text-white"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
