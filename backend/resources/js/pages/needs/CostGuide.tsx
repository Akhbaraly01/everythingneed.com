import AppLayout from '@/layouts/AppLayout';
import { Head, Link } from '@inertiajs/react';
import { api, errorMessage } from '@/lib/api';
import { Button } from '@/components/shared/Button';
import { useEffect, useState } from 'react';
import { ArrowLeft, ChevronDown, RefreshCcw } from 'lucide-react';

interface CostGuide {
    id: string;
    slug: string;
    title: string;
    summary: string;
    price_min: string | null;
    price_max: string | null;
    price_avg: string | null;
    currency: string;
    pricing_unit: string;
    factors: { label: string; impact?: string }[] | null;
    faqs: { question: string; answer: string }[] | null;
    source_note: string | null;
    category?: { id: string; name: string; slug: string } | null;
    created_at: string;
}

export default function CostGuideDetail({ slug }: { slug: string }) {
    const [guide, setGuide] = useState<CostGuide | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    useEffect(() => {
        api.get<{ data: CostGuide }>(`/api/need-cost-guides/${slug}`)
            .then((res) => setGuide(res.data))
            .catch((e) => setError(errorMessage(e, 'Guide not found')))
            .finally(() => setLoading(false));
    }, [slug]);

    const money = (v: string | null) => (v == null ? null : `$${Number(v).toLocaleString()}`);

    return (
        <AppLayout title={guide?.title || 'Cost Guide'}>
            <Head title={guide?.title || 'Cost Guide'} />
            <div className="mx-auto max-w-3xl space-y-6">
                <Link href="/needs/cost-guides" className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    <ArrowLeft className="h-4 w-4" /> All cost guides
                </Link>

                {loading ? (
                    <p className="text-gray-500">Loading...</p>
                ) : error || !guide ? (
                    <div className="rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800">
                        <p className="text-red-600 font-medium">{error || 'Guide not found'}</p>
                        <Button onClick={() => window.location.reload()} variant="ghost" size="sm" className="mt-4 gap-2" iconLeft={<RefreshCcw className="h-4 w-4" />}>
                            Retry
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                            {guide.category && (
                                <Link href={`/needs?category=${guide.category.slug}`} className="text-xs font-medium text-blue-600 hover:underline">
                                    {guide.category.name}
                                </Link>
                            )}
                            <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{guide.title}</h1>
                            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{guide.summary}</p>

                            <div className="mt-4 grid grid-cols-3 gap-3 border-t border-gray-100 pt-4 dark:border-gray-700">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-400">Low</p>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{money(guide.price_min) ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-400">Average</p>
                                    <p className="mt-1 text-lg font-bold text-blue-600">{money(guide.price_avg) ?? '—'}</p>
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-gray-400">High</p>
                                    <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{money(guide.price_max) ?? '—'}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-400">Per {guide.pricing_unit} · {guide.currency}</p>

                            <div className="mt-5">
                                <Button onClick={() => { window.location.href = '/needs/request'; }} size="sm">
                                    Post a request in {guide.category?.name || 'this category'}
                                </Button>
                            </div>
                        </div>

                        {guide.factors && guide.factors.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white">What affects the price</h2>
                                <ul className="mt-3 space-y-2">
                                    {guide.factors.map((f, i) => (
                                        <li key={i} className="flex items-center justify-between text-sm">
                                            <span className="text-gray-700 dark:text-gray-200">{f.label}</span>
                                            {f.impact && (
                                                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                                                    f.impact === 'high' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                    : f.impact === 'medium' ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                                                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                    {f.impact} impact
                                                </span>
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {guide.faqs && guide.faqs.length > 0 && (
                            <div className="rounded-lg bg-white p-6 shadow dark:bg-gray-800">
                                <h2 className="font-semibold text-gray-900 dark:text-white">Frequently asked questions</h2>
                                <div className="mt-3 divide-y divide-gray-100 dark:divide-gray-700">
                                    {guide.faqs.map((f, i) => (
                                        <div key={i}>
                                            <button
                                                type="button"
                                                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                                                className="flex w-full items-center justify-between py-3 text-left text-sm font-medium text-gray-900 dark:text-white"
                                            >
                                                {f.question}
                                                <ChevronDown className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                                            </button>
                                            {openFaq === i && (
                                                <p className="pb-3 text-sm text-gray-600 dark:text-gray-300">{f.answer}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {guide.source_note && (
                            <p className="text-xs text-gray-400">{guide.source_note}</p>
                        )}
                    </>
                )}
            </div>
        </AppLayout>
    );
}
