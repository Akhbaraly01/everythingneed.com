import { useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import { api } from "@/lib/api";
import { formatPrice } from "@/lib/currency";
import { useLanguage } from "@/lib/use-language";
import { Search, Loader2, ShoppingBag, GraduationCap, BedDouble, Briefcase, UtensilsCrossed, Wrench } from "lucide-react";

interface SearchResults {
    products?: Array<{ id: string; name: string; price: string | number }>;
    services?: Array<{ id: string; title?: string; name?: string; budget?: string | number }>;
    courses?: Array<{ id: string; title: string; price: string | number }>;
    restaurants?: Array<{ id: string; name: string; cuisine_type: string }>;
    hotels?: Array<{ id: string; name: string; city?: string }>;
    jobs?: Array<{ id: string; title: string; company: string }>;
}

const GROUPS = [
    { key: "products", label: "Products", icon: ShoppingBag, href: (id: string) => `/products/${id}` },
    { key: "services", label: "Services", icon: Wrench, href: (id: string) => `/needs/requests/${id}` },
    { key: "courses", label: "Courses", icon: GraduationCap, href: (id: string) => `/learn/${id}` },
    { key: "hotels", label: "Hotels", icon: BedDouble, href: (id: string) => `/hotels/${id}` },
    { key: "jobs", label: "Jobs", icon: Briefcase, href: (id: string) => `/jobs/${id}` },
    { key: "restaurants", label: "Food", icon: UtensilsCrossed, href: (id: string) => `/food/${id}` },
] as const;

export default function GlobalSearch() {
    const { t } = useLanguage();
    const [q, setQ] = useState("");
    const [results, setResults] = useState<SearchResults | null>(null);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);
    const boxRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    useEffect(() => {
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (q.trim().length < 2) {
            setResults(null);
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

    return (
        <div ref={boxRef} className="relative w-full max-w-md">
            <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    onFocus={() => q.length >= 2 && setOpen(true)}
                    placeholder={t('nav.searchPlaceholder')}
                    className="w-full rounded-full border border-gray-300 bg-white py-2 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                {loading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                )}
            </div>

            {open && q.trim().length >= 2 && (
                <div className="absolute left-0 right-0 z-40 mt-1 max-h-96 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
                    {total === 0 && !loading ? (
                        <p className="px-4 py-6 text-center text-sm text-gray-400">
                            {t('search.noMatches', { q, defaultValue: `No matches for “${q}”` })}
                        </p>
                    ) : (
                        GROUPS.map(({ key, label, icon: Icon }) => {
                            const group = results?.[key as keyof SearchResults];
                            if (!group?.length) return null;

                            return (
                                <div key={key} className="border-b border-gray-100 py-1 last:border-0 dark:border-gray-700">
                                    <p className="flex items-center gap-1.5 px-3 pt-2 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                                        <Icon className="h-3 w-3" /> {t(`search.${key}`, { defaultValue: label })}
                                    </p>
                                    {group.map((row: Record<string, unknown>) => {
                                        const id = String(row.id);
                                        const title = String(row.name ?? row.title ?? t('search.untitled', { defaultValue: 'Untitled' }));
                                        const price = row.price ?? row.budget;
                                        return (
                                            <Link
                                                key={id}
                                                href={hrefFor(key, id)}
                                                onClick={() => setOpen(false)}
                                                className="flex items-center justify-between px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/60"
                                            >
                                                <span className="truncate text-gray-800 dark:text-gray-200">{title}</span>
                                                {price != null && (
                                                    <span className="ml-3 shrink-0 text-xs text-indigo-600">
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
    return found ? found.href(_id) : "/";
}
