import {
    BookOpen,
    Building2,
    Bus,
    CheckSquare,
    Dumbbell,
    GraduationCap,
    HeartPulse,
    Hotel,
    Home,
    Package,
    Pill,
    Plane,
    Shirt,
    ShoppingBag,
    Smartphone,
    Sparkles,
    Tractor,
    Truck,
    UtensilsCrossed,
    Users,
    Wrench,
    type LucideIcon,
} from 'lucide-react';

/**
 * Storefront verticals.
 *
 * One catalogue that knows, per vertical: the icon, the gradient and the
 * page that actually serves it. The home category grid, the need carousel
 * and the search suggestions all resolve their links from here, so a
 * tile never points at a page that does not exist and never shows a
 * generic bag icon.
 */
export interface Vertical {
    /** Slug used by the database categories. */
    slug: string;
    /** Human name (English; the UI translates the label where it can). */
    name: string;
    icon: LucideIcon;
    gradient: string;
    /** Where the tile leads. */
    href: string;
    /** Short pitch for the tile / carousel subtitle. */
    blurb: string;
}

export const VERTICALS: Vertical[] = [
    { slug: 'electronics', name: 'Electronics', icon: Smartphone, gradient: 'from-blue-500 to-blue-600', href: '/products?category=electronics', blurb: 'Phones, laptops and gadgets' },
    { slug: 'clothing', name: 'Clothing', icon: Shirt, gradient: 'from-pink-500 to-rose-500', href: '/products?category=clothing', blurb: 'Fashion for every season' },
    { slug: 'home-garden', name: 'Home & Garden', icon: Home, gradient: 'from-amber-500 to-orange-500', href: '/products?category=home-garden', blurb: 'Furniture, tools and decor' },
    { slug: 'sports', name: 'Sports', icon: Dumbbell, gradient: 'from-green-500 to-emerald-500', href: '/products?category=sports', blurb: 'Gear, fitness and outdoor' },
    { slug: 'books', name: 'Books', icon: BookOpen, gradient: 'from-cyan-500 to-blue-500', href: '/products?category=books', blurb: 'Reading for every age' },
    { slug: 'health-beauty', name: 'Health & Beauty', icon: Sparkles, gradient: 'from-teal-500 to-emerald-500', href: '/products?category=health-beauty', blurb: 'Care, wellness and cosmetics' },
    { slug: 'learn', name: 'Learning', icon: GraduationCap, gradient: 'from-emerald-500 to-teal-500', href: '/learn', blurb: 'Courses, skills and certifications' },
    { slug: 'healthcare', name: 'Healthcare', icon: HeartPulse, gradient: 'from-rose-500 to-pink-500', href: '/healthcare', blurb: 'Doctors, labs and appointments' },
    { slug: 'pharmacy', name: 'Pharmacy', icon: Pill, gradient: 'from-blue-500 to-cyan-500', href: '/pharmacy', blurb: 'Medicines delivered to your door' },
    { slug: 'needs', name: 'Needs', icon: Users, gradient: 'from-purple-500 to-fuchsia-500', href: '/needs', blurb: 'Post it and get offers from providers' },
    { slug: 'hotels', name: 'Hotels', icon: Hotel, gradient: 'from-yellow-500 to-amber-500', href: '/hotels', blurb: 'Stays for every trip' },
    { slug: 'food', name: 'Food', icon: UtensilsCrossed, gradient: 'from-orange-500 to-red-500', href: '/food', blurb: 'Restaurants and delivery' },
    { slug: 'transportation', name: 'Transport', icon: Plane, gradient: 'from-sky-500 to-blue-600', href: '/flights', blurb: 'Flights, buses and rides' },
    { slug: 'jobs', name: 'Jobs', icon: Building2, gradient: 'from-indigo-500 to-violet-600', href: '/jobs', blurb: 'Work and hiring' },
    { slug: 'real-estate', name: 'Real Estate', icon: Building2, gradient: 'from-teal-600 to-cyan-700', href: '/properties', blurb: 'Homes, land and rentals' },
    { slug: 'building-services', name: 'Building Services', icon: Wrench, gradient: 'from-slate-500 to-gray-700', href: '/building-services', blurb: 'Engineers and materials' },
    { slug: 'services', name: 'Services', icon: CheckSquare, gradient: 'from-cyan-500 to-teal-600', href: '/services', blurb: 'Trusted local professionals' },
    { slug: 'tasks', name: 'Tasks', icon: CheckSquare, gradient: 'from-cyan-600 to-blue-700', href: '/tasks', blurb: 'Get things done' },
    { slug: 'agriculture', name: 'Agriculture', icon: Tractor, gradient: 'from-lime-600 to-green-700', href: '/agriculture', blurb: 'Farm equipment and workers' },
    { slug: 'product', name: 'Request Product', icon: Package, gradient: 'from-blue-500 to-indigo-600', href: '/needs/request?type=product', blurb: "Can't find it? We'll source it" },
    { slug: 'worker', name: 'Request Workers', icon: Wrench, gradient: 'from-amber-500 to-orange-600', href: '/needs/request?type=worker', blurb: 'Skilled hands for your project' },
    { slug: 'general', name: 'General Request', icon: Users, gradient: 'from-purple-500 to-violet-600', href: '/needs/request?type=general', blurb: 'Anything else you need' },
    { slug: 'transport', name: 'Transport', icon: Truck, gradient: 'from-sky-600 to-indigo-700', href: '/transportation', blurb: 'Move people and goods' },
    { slug: 'bus', name: 'Bus Travel', icon: Bus, gradient: 'from-amber-600 to-yellow-700', href: '/transportation', blurb: 'Comfortable long-distance trips' },
];

/** Slug lookup (exact, then a contains match). */
export function verticalFor(slug: string | null | undefined): Vertical | null {
    if (!slug) {
        return null;
    }

    const key = slug.toLowerCase().trim();

    return (
        VERTICALS.find((vertical) => vertical.slug === key) ??
        VERTICALS.find((vertical) => key.includes(vertical.slug)) ??
        null
    );
}

/** Icon for any category slug/name; falls back to a shopping bag. */
export function iconForSlug(slug: string | null | undefined, name?: string | null): LucideIcon {
    const direct = verticalFor(slug);

    if (direct) {
        return direct.icon;
    }

    const haystack = `${slug ?? ''} ${name ?? ''}`.toLowerCase();

    const match = VERTICALS.find((vertical) => haystack.includes(vertical.slug));

    return match?.icon ?? ShoppingBag;
}
