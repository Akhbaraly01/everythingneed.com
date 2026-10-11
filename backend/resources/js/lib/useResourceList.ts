import { useCallback, useEffect, useState } from 'react';
import { api, errorMessage, rows } from '@/lib/api';
import { toast } from 'sonner';

export interface ResourceMeta {
    current_page: number;
    last_page: number;
    total: number;
}

interface Options {
    perPage?: number;
    initialSearch?: string;
}

interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    total: number;
}

/**
 * Shared admin list behavior (W3): search + pagination + reload against
 * the conventional admin JSON APIs (?search=&page=&per_page=, Laravel
 * paginator envelope). Pages keep their row rendering; DataTable renders.
 */
export function useResourceList<T>(baseUrl: string, opts?: Options) {
    const perPage = opts?.perPage ?? 25;
    const [items, setItems] = useState<T[]>([]);
    const [meta, setMeta] = useState<ResourceMeta | null>(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(opts?.initialSearch ?? '');
    const [query, setQuery] = useState(opts?.initialSearch ?? '');
    const [page, setPage] = useState(1);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: String(page), per_page: String(perPage) });
            if (query) params.set('search', query);
            const res = await api.get<{ data: T[] | Paginated<T>; meta?: ResourceMeta }>(
                `${baseUrl}?${params}`,
            );
            setItems(rows<T>(res));
            const d = res.data;
            if (Array.isArray(d)) {
                setMeta(res.meta ?? null);
            } else {
                setMeta({ current_page: d.current_page, last_page: d.last_page, total: d.total });
            }
        } catch (e) {
            setItems([]);
            setMeta(null);
            toast.error(errorMessage(e, 'Failed to load'));
        } finally {
            setLoading(false);
        }
    }, [baseUrl, page, perPage, query]);

    useEffect(() => {
        void load();
    }, [load]);

    const submitSearch = useCallback(() => {
        setPage(1);
        setQuery(search.trim());
    }, [search]);

    return { items, setItems, meta, loading, search, setSearch, submitSearch, page, setPage, reload: load };
}
