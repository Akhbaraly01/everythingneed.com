import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useLanguage } from '@/lib/use-language';
import PictureSearch from '@/components/shared/PictureSearch';
import {
    Loader2,
    ShoppingBag,
    GraduationCap,
    BedDouble,
    Briefcase,
    UtensilsCrossed,
    Wrench,
    Search,
    LayoutGrid,
    ClipboardList,
    Stethoscope,
    Store,
    Home,
    Sprout,
    Hammer,
} from 'lucide-react';

interface SearchRow {
    id?: string | number;
    name?: string;
    title?: string;
    price?: string | number;
    budget?: string | number;
    /** Canonical destination computed by the server (SearchService::discover). */
    url?: string;
    type?: string;
}

interface SearchResults {
    products?: SearchRow[];
    categories?: SearchRow[];
    services?: SearchRow[];
    needs?: SearchRow[];
    doctors?: SearchRow[];
    experts?: SearchRow[];
    vendors?: SearchRow[];
    courses?: SearchRow[];
    jobs?: SearchRow[];
    hotels?: SearchRow[];
    restaurants?: SearchRow[];
    properties?: SearchRow[];
    agriculture?: SearchRow[];
    building?: SearchRow[];
}

/**
 * Suggestion groups. The destination always comes from the server row
 * (`url`); the fallback below is only used for rows the server did not
 * stamp, so the client never invents a route.
 */
const GROUPS = [
    { key: 'products', label: 'Products', icon: ShoppingBag, fallback: (id: string) => `/products/${id}` },
    { key: 'categories', label: 'Categories', icon: LayoutGrid, fallback: (id: string) => `/categories/${id}` },
    { key: 'services', label: 'Services', icon: Wrench, fallback: (_id: string) => '/needs' },
    { key: 'needs', label: 'Needs', icon: ClipboardList, fallback: (id: string) => `/needs/requests/${id}` },
    { key: 'doctors', label: 'Doctors', icon: Stethoscope, fallback: (id: string) => `/healthcare/doctors/${id}` },
    { key: 'experts', label: 'Experts', icon: GraduationCap, fallback: (id: string) => `/experts/${id}` },
    { key: 'vendors', label: 'Vendors', icon: Store, fallback: (id: string) => `/stores/${id}` },
    { key: 'courses', label: 'Courses', icon: GraduationCap, fallback: (id: string) => `/learn/${id}` },
    { key: 'jobs', label: 'Jobs', icon: Briefcase, fallback: (id: string) => `/jobs/${id}` },
    { key: 'hotels', label: 'Hotels', icon: BedDouble, fallback: (id: string) => `/hotels/${id}` },
    { key: 'restaurants', label: 'Food', icon: UtensilsCrossed, fallback: (id: string) => `/food/${id}` },
    { key: 'properties', label: 'Properties', icon: Home, fallback: (id: string) => `/real-estate/${id}` },
    { key: 'agriculture', label: 'Agriculture', icon: Sprout, fallback: (_id: string) => '/agriculture/products' },
    { key: 'building', label: 'Building services', icon: Hammer, fallback: (_id: string) => '/building-services' },
] as const;

interface Props {
    /** Where the query is sent on submit (defaults to the search page). */
    onSubmit?: (query: string) => void;
    className?: string;
}

/**
 * Marketplace search bar (Alibaba pattern).
 *
 * A rounded capsule with the keyword field (combobox semantics for
 * assistive tech), the picture-search button and the search button. The
 * grouped suggestion list is wired to the same combobox contract
 * (aria-expanded / aria-controls / listbox + options).
 */
export default function GlobalSearch({
    onSubmit,
    className = '',
}: Props) {
    const { t } = useLanguage();
    const [q, setQ] = useState('');
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const activeIndex = useRef(-1);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onClick);
        return () => document.removeEventListener('mousedown', onClick);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.trim().length < 2) {
            setResults(null);
            setOpen(false);
            return;
        }
        debounceRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await api.get<{ data: SearchResults }>(
                    `/api/search?q=${encodeURIComponent(q.trim())}`,
                );
                setResults(res.data);
                setOpen(true);
            } catch {
                setResults(null);
            } finally {
                setLoading(false);
            }
        }, 250);
    }, [q]);

    const total = results
        ? Object.values(results).reduce((n, g) => n + (g?.length ?? 0), 0)
        : 0;

    const submit = (value: string) => {
        const query = value.trim();
        setOpen(false);
        onSubmit?.(query);
    };

    const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>): void => {
        if (event.key === 'Enter') {
            event.preventDefault();
            submit(q);
            return;
        }

        if (!open || total === 0) {
            return;
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault();
            const options = listRef.current?.querySelectorAll<HTMLElement>('[role="option"]') ?? [];

            if (options.length === 0) {
                return;
            }

            const delta = event.key === 'ArrowDown' ? 1 : -1;
            activeIndex.current =
                (activeIndex.current + delta + options.length + 1) % (options.length + 1);
            options.forEach((option, index) => {
                option.classList.toggle('bg-muted', index === activeIndex.current - 1);
            });
        }
    };

    return (
        <div ref={boxRef} className={`relative min-w-0 flex-1 ${className}`}>
            <form
                role="search"
                className="flex items-center gap-1 rounded-full border-2 border-primary/40 bg-background pl-4 pr-1 transition-colors focus-within:border-primary"
                onSubmit={(e) => {
                    e.preventDefault();
                    submit(q);
                }}
            >
                <Search
                    className="pointer-events-none hidden h-4 w-4 shrink-0 text-muted-foreground sm:block"
                    aria-hidden="true"
                />
                <input
                    id="search-words"
                    name="searchWords"
                    type="text"
                    role="combobox"
                    autoComplete="off"
                    maxLength={50}
                    aria-expanded={open}
                    aria-controls="search-suggestions"
                    aria-autocomplete="list"
                    aria-haspopup="listbox"
                    aria-label={t('nav.searchLabel', {
                        defaultValue: 'You can type an item name or keyword to search.',
                    })}
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => q.length >= 2 && setOpen(true)}
                    onKeyDown={onKeyDown}
                    placeholder={t('nav.searchPlaceholder', {
                        defaultValue: 'Search everything...',
                    })}
                    className="h-10 w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                />

                {loading && (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" aria-hidden="true" />
                )}

                <PictureSearch />

                <button
                    type="submit"
                    role="button"
                    tabIndex={0}
                    aria-label={t('nav.searchSubmit', {
                        defaultValue: 'You can click this button to search.',
                    })}
                    className="flex h-8 shrink-0 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                >
                    <Search className="h-3.5 w-3.5" aria-hidden="true" />
                    <span className="hidden lg:inline">{t('nav.search', { defaultValue: 'Search' })}</span>
                </button>
            </form>

            {open && q.trim().length >= 2 && (
                <div
                    id="search-suggestions"
                    ref={listRef}
                    role="listbox"
                    aria-label={t('nav.searchLabel', { defaultValue: 'Search suggestions' })}
                    className="absolute left-0 right-0 z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-border bg-card shadow-xl"
                >
                    {total === 0 && !loading ? (
                        <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                            {t('search.noMatches', { q, defaultValue: `No matches for “${q}”` })}
                        </p>
                    ) : (
                        GROUPS.map(({ key, label, icon: Icon }) => {
                            const group = results?.[key as keyof SearchResults];
                            if (!group?.length) return null;

                            return (
                                <div key={key} className="border-b border-border/60 py-1 last:border-0">
                                    <p className="flex items-center gap-1.5 px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                        <Icon className="h-3 w-3" /> {t(`search.${key}`, { defaultValue: label })}
                                    </p>
                                    {group.map((row: SearchRow, index: number) => {
                                        const id = String(row.id ?? `${key}-${index}`);
                                        const title = String(
                                            row.name ?? row.title ?? t('search.untitled', { defaultValue: 'Untitled' }),
                                        );
                                        const price = row.price ?? row.budget;
                                        return (
                                            <Link
                                                key={id}
                                                href={hrefFor(key, row)}
                                                role="option"
                                                aria-selected={false}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-muted"
                                            >
                                                <span className="truncate text-foreground">{title}</span>
                                                {price != null && (
                                                    <span className="ml-3 shrink-0 text-xs text-primary">
                                                        {formatPrice(Number(price))}
                                                    </span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

function hrefFor(group: string, row: SearchRow): string {
    if (typeof row.url === 'string' && row.url !== '') {
        return row.url;
    }

    const found = GROUPS.find((g) => g.key === group);
    return found ? found.fallback(String(row.id ?? '')) : '/';
}
