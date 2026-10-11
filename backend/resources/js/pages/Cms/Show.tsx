import MarketplaceLayout from '@/layouts/MarketplaceLayout';
import BlockRenderer, { type CmsBlock } from '@/components/cms/BlockRenderer';
import { Head } from '@inertiajs/react';

interface CmsSeo {
    title: string;
    description: string;
    image?: string | null;
    canonical: string;
    robots: string;
    published_at?: string | null;
    updated_at?: string | null;
}

interface CmsPageProps {
    page: {
        id: string;
        title: string;
        slug: string;
        description?: string | null;
        status: string;
        template?: string;
        menu_placement?: string | null;
        blocks: CmsBlock[];
    };
    seo: CmsSeo;
}

/**
 * Public renderer for admin-created pages: /p/{slug} (spec S99).
 * SEO metadata (title/description/canonical/OG/Twitter/robots) is emitted
 * from the server-provided `seo` object (spec S88).
 */
export default function CmsShow({ page, seo }: CmsPageProps) {
    const blocks = page.blocks ?? [];

    return (
        <MarketplaceLayout title={`${seo.title} — EverythingNeed`}>
            <Head>
                <meta name="description" content={seo.description} />
                <meta name="robots" content={seo.robots} />
                <link rel="canonical" href={seo.canonical} />
                <meta property="og:type" content="website" />
                <meta property="og:title" content={seo.title} />
                <meta property="og:description" content={seo.description} />
                <meta property="og:url" content={seo.canonical} />
                {seo.image ? <meta property="og:image" content={seo.image} /> : null}
                <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
                <meta name="twitter:title" content={seo.title} />
                <meta name="twitter:description" content={seo.description} />
            </Head>

            <article className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
                <header className="space-y-2">
                    <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">{page.title}</h1>
                    {page.description && <p className="max-w-3xl text-gray-600 dark:text-gray-400">{page.description}</p>}
                </header>

                {blocks.map((block, index) => (
                    <BlockRenderer key={block.id ?? `${block.type}-${index}`} block={block} />
                ))}

                {blocks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-gray-300 p-12 text-center text-gray-500 dark:border-gray-700 dark:text-gray-400">
                        This page has no content yet.
                    </div>
                )}
            </article>
        </MarketplaceLayout>
    );
}
