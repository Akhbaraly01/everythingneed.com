import { useEffect, useRef, useState } from 'react';
import { Link } from '@inertiajs/react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import { useLanguage } from '@/lib/use-language';
import {
    Camera,
    Loader2,
    ShoppingBag,
    GraduationCap,
    BedDouble,
    Briefcase,
    UtensilsCrossed,
    Wrench,
    Search,
} from 'lucide-react';

interface SearchResults {
    products?: Array<{ id: string; name: string; price: string | number }>;
    services?: Array<{ id: string; title?: string; name?: string; budget?: string | number }>;
    courses?: Array<{ id: string; title: string; price: string | number }>;
    restaurants?: Array<{ id: string; name: string; cuisine_type: string }>;
    hotels?: Array<{ id: string; name: string; city?: string }>;
    jobs?: Array<{ id: string; title: string; company: string }>;
}

const GROUPS = [
    { key: 'products', label: 'Products', icon: ShoppingBag, href: (id: string) => `/products/${id}` },
    { key: 'services', label: 'Services', icon: Wrench, href: (id: string) => `/needs/requests/${id}` },
    { key: 'courses', label: 'Courses', icon: GraduationCap, href: (id: string) => `/learn/${id}` },
    { key: 'hotels', label: 'Hotels', icon: BedDouble, href: (id: string) => `/hotels/${id}` },
    { key: 'jobs', label: 'Jobs', icon: Briefcase, href: (id: string) => `/jobs/${id}` },
    { key: 'restaurants', label: 'Food', icon: UtensilsCrossed, href: (id: string) => `/food/${id}` },
] as const;

interface Props {
    /** Where the query is sent on submit (defaults to the search page). */
    onSubmit?: (query: string) => void;
    /** Camera (picture search) target. */
    imageSearchHref?: string;
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
    imageSearchHref = '/scan',
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

                <Link
                    href={imageSearchHref}
                    role="button"
                    tabIndex={0}
                    aria-label={t('nav.searchByImage', { defaultValue: 'Search by image' })}
                    className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:inline-flex"
                >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                </Link>

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
                                    {group.map((row: Record<string, unknown>) => {
                                        const id = String(row.id);
                                        const title = String(
                                            row.name ?? row.title ?? t('search.untitled', { defaultValue: 'Untitled' }),
                                        );
                                        const price = row.price ?? row.budget;
                                        return (
                                            <Link
                                                key={id}
                                                href={hrefFor(key, id)}
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

function hrefFor(group: string, _id: string): string {
    const found = GROUPS.find((g) => g.key === group);
    return found ? found.href(_id) : '/';
}
