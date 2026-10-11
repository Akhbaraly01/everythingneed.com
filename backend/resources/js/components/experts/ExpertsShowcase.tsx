import { useEffect, useState } from 'react';
import { Link } from '@inertiajs/react';
import { Star, Users, Calendar, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';

export interface ShowcaseExpert {
    id: string | number;
    name: string;
    role: string;
    link: string;
    rating?: number;
    source?: string;
}

interface ExpertsApiResponse {
    data: {
        id: string;
        full_name?: string;
        name?: string;
        specialization?: string;
        role?: string;
        rating?: number | string;
    }[];
}

interface ExpertsShowcaseProps {
    experts?: ShowcaseExpert[];
    title?: string;
    limit?: number;
    viewAllHref?: string;
}

const SOURCE_FALLBACK_LINK: Record<string, string> = {
    healthcare: '/healthcare/doctors',
    learning: '/learn',
    needs: '/experts',
};

export default function ExpertsShowcase({
    experts,
    title = 'Top Experts',
    limit = 8,
    viewAllHref = '/experts',
}: ExpertsShowcaseProps) {
    const [fetched, setFetched] = useState<ShowcaseExpert[]>([]);

    useEffect(() => {
        if (experts && experts.length > 0) return;
        api.get<ExpertsApiResponse>('/api/experts', { params: { per_page: limit, available: true } })
            .then((res) => {
                setFetched(
                    (res.data ?? []).map((e) => ({
                        id: e.id,
                        name: e.full_name ?? e.name ?? 'Expert',
                        role: e.specialization ?? e.role ?? 'Professional',
                        link: `/experts/${e.id}`,
                        rating: typeof e.rating === 'string' ? Number(e.rating) : e.rating,
                        source: 'healthcare',
                    })),
                );
            })
            .catch(() => setFetched([]));
    }, [experts, limit]);

    const list = (experts && experts.length > 0 ? experts : fetched).slice(0, limit);

    if (list.length === 0) return null;

    return (
        <section>
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <h2 className="text-lg font-bold">{title}</h2>
                </div>
                <Link
                    href={viewAllHref}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                    View All <ArrowRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {list.map((expert) => (
                    <div
                        key={`${expert.source ?? 'expert'}-${expert.id}`}
                        className="rounded-xl border border-border bg-card p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg"
                    >
                        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                            {expert.name
                                .split(' ')
                                .map((n) => n[0])
                                .join('')
                                .slice(0, 2)}
                        </div>
                        <p className="line-clamp-1 text-sm font-semibold">{expert.name}</p>
                        <p className="line-clamp-1 text-xs text-muted-foreground">{expert.role}</p>

                        {expert.rating !== undefined && (
                            <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {Number(expert.rating).toFixed(1)}
                                <span className="mx-1">{'\u00b7'}</span>
                                <Users className="h-3 w-3" />
                            </div>
                        )}

                        <div className="mt-3 flex gap-1">
                            <Link
                                href={expert.link}
                                className="flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground"
                            >
                                <Calendar className="h-3 w-3" /> Book
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}

export { SOURCE_FALLBACK_LINK };
