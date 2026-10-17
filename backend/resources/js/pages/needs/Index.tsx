import { Head, Link, usePage } from '@inertiajs/react';
import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import SectionRail from '@/components/home/SectionRail';
import NeedCarousel from '@/components/Marketplace/NeedCarousel';
import { Search, ArrowRight, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';
import type { HomeSectionItem, NeedCategory } from '@/types';

interface NeedsSections {
    activeRequests?: HomeSectionItem[];
    nearbyServices?: HomeSectionItem[];
    featuredServices?: HomeSectionItem[];
    deals?: HomeSectionItem[];
    workers?: HomeSectionItem[];
    professionals?: HomeSectionItem[];
    transportation?: HomeSectionItem[];
    hotels?: HomeSectionItem[];
    construction?: HomeSectionItem[];
    agriculture?: HomeSectionItem[];
    food?: HomeSectionItem[];
    jobs?: HomeSectionItem[];
    realEstate?: HomeSectionItem[];
    pharmacy?: HomeSectionItem[];
    healthcare?: HomeSectionItem[];
    generalServices?: HomeSectionItem[];
}

interface NeedsIndexProps {
    categories?: NeedCategory[];
    nearbyCity?: string | null;
    sections?: NeedsSections;
}

const FALLBACK_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#6366F1', '#EC4899', '#14B8A6'];

/**
 * Spec S10 - /needs main page. Every rail is driven by real rows from the
 * server payload; empty rails hide themselves and the two navigation
 * sections fall back to honest link tiles (never fabricated listings).
 */
export default function NeedsIndex({ categories = [], nearbyCity = null, sections = {} }: NeedsIndexProps) {
    const { auth } = usePage().props as { auth?: { user?: { id: string } | null } };
    const [search, setSearch] = useState('');

    const filtered = useMemo(
        () => categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())),
        [categories, search],
    );

    const rails: { key: keyof NeedsSections; title: string; seeAll?: string }[] = [
        { key: 'activeRequests', title: 'Active requests' },
        { key: 'nearbyServices', title: nearbyCity ? `Nearby services in ${nearbyCity}` : 'Nearby services' },
        { key: 'featuredServices', title: 'Featured services', seeAll: '/building-services' },
        { key: 'deals', title: 'Deals', seeAll: '/deals' },
        { key: 'workers', title: 'Workers', seeAll: '/job-seekers' },
        { key: 'professionals', title: 'Professionals', seeAll: '/experts' },
        { key: 'transportation', title: 'Transportation', seeAll: '/transportation' },
        { key: 'hotels', title: 'Hotels', seeAll: '/hotels' },
        { key: 'construction', title: 'Construction', seeAll: '/building-services' },
        { key: 'agriculture', title: 'Agriculture', seeAll: '/agriculture' },
        { key: 'food', title: 'Food', seeAll: '/food' },
        { key: 'jobs', title: 'Jobs', seeAll: '/jobs' },
        { key: 'realEstate', title: 'Real estate', seeAll: '/properties' },
        { key: 'pharmacy', title: 'Pharmacy', seeAll: '/pharmacy' },
        { key: 'healthcare', title: 'Healthcare', seeAll: '/healthcare' },
        { key: 'generalServices', title: 'General services', seeAll: '/building-services' },
    ];

    const hasNearbyItems = (sections.nearbyServices?.length ?? 0) > 0;

    return (
        <MarketplaceLayout title="Needs">
            <Head title="Needs" />
            <div className="container mx-auto space-y-8 px-3 py-4">
                {/* Find a Need */}
                <section data-testid="need-section-find">
                    <h2 className="mb-3 text-base font-bold text-foreground md:text-lg">Find your need</h2>
                    <NeedCarousel />
                </section>

                {/* Submit a Need */}
                <section
                    data-testid="need-section-submit"
                    className="flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-card p-5 shadow-sm sm:flex-row sm:items-center"
                >
                    <div>
                        <h2 className="text-base font-bold text-foreground">Have something specific in mind?</h2>
                        <p className="text-sm text-muted-foreground">
                            Describe what you need and let providers come to you.
                        </p>
                    </div>
                    <Link
                        href="/needs/create"
                        className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                    >
                        Submit a need <ArrowRight className="h-4 w-4" />
                    </Link>
                </section>

                {/* Browse categories */}
                <section data-testid="need-section-browse-categories" className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                        <h2 className="text-base font-bold text-foreground md:text-lg">Browse categories</h2>
                        <a href="/needs/cost-guides" className="text-sm font-medium text-primary hover:underline">
                            Cost guides
                        </a>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search categories..."
                            className="h-10 w-full rounded-full border border-border bg-muted/50 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    {filtered.length === 0 ? (
                        <div className="rounded-lg border border-border bg-card p-10 text-center">
                            <h3 className="text-lg font-medium">No categories yet</h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Try a different search or submit a request.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {filtered.map((cat, i) => (
                                <Link
                                    key={cat.id}
                                    href={`/needs/${cat.slug}`}
                                    className="group rounded-xl border border-border bg-card p-6 shadow-sm transition hover:shadow-md"
                                >
                                    <div className="flex items-center gap-3">
                                        <span
                                            className="flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white"
                                            style={{ background: cat.color ?? FALLBACK_COLORS[i % FALLBACK_COLORS.length] }}
                                        >
                                            {cat.name[0]}
                                        </span>
                                        <div>
                                            <h3 className="font-semibold group-hover:text-primary">{cat.name}</h3>
                                            <p className="text-xs text-muted-foreground">View requests</p>
                                        </div>
                                    </div>
                                    {cat.description && (
                                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{cat.description}</p>
                                    )}
                                    <span className="mt-4 inline-flex items-center gap-1 text-sm text-primary">
                                        View <ArrowRight className="h-3 w-3" />
                                    </span>
                                </Link>
                            ))}
                        </div>
                    )}
                </section>

                {/* Spec S10 rails - real rows only */}
                {rails.map(({ key, title, seeAll }) => (
                    <SectionRail
                        key={key}
                        testId={`need-section-${key}`}
                        title={title}
                        items={sections[key]}
                        seeAllHref={seeAll}
                    />
                ))}

                {/* Nearby services honest prompts (spec S75 - never fabricated) */}
                {!hasNearbyItems && (
                    <section data-testid="need-section-nearby-empty" className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
                        <p className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {!auth?.user
                                ? 'Sign in and set your default address to see services near you.'
                                : nearbyCity
                                    ? `No available providers listed in ${nearbyCity} right now.`
                                    : 'Set your default delivery address to see services near you.'}
                        </p>
                    </section>
                )}
            </div>
        </MarketplaceLayout>
    );
}
