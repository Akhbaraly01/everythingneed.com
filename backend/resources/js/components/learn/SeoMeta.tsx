import { Head } from '@inertiajs/react';

/**
 * Spec 88/17: crawlable head metadata for Learn pages. The server emits the
 * canonical tags in app.blade.php for non-JS crawlers; this component keeps
 * the Inertia-rendered document consistent during client-side navigation.
 * Document <title> stays owned by the page/layout (Head title prop) to avoid
 * duplicate-title ordering issues — only description/OG/Twitter live here.
 */
export interface LearnSeo {
    title: string;
    description: string;
    image?: string | null;
    canonical?: string | null;
    robots?: string | null;
}

export default function SeoMeta({ seo }: { seo?: LearnSeo | null }) {
    if (!seo) {
        return null;
    }

    return (
        <Head>
            <meta name="description" content={seo.description} />
            {seo.robots ? <meta name="robots" content={seo.robots} /> : null}
            {seo.canonical ? <link rel="canonical" href={seo.canonical} /> : null}
            <meta property="og:type" content="website" />
            <meta property="og:title" content={seo.title} />
            <meta property="og:description" content={seo.description} />
            {seo.canonical ? <meta property="og:url" content={seo.canonical} /> : null}
            {seo.image ? <meta property="og:image" content={seo.image} /> : null}
            <meta name="twitter:card" content={seo.image ? 'summary_large_image' : 'summary'} />
            <meta name="twitter:title" content={seo.title} />
            <meta name="twitter:description" content={seo.description} />
        </Head>
    );
}
