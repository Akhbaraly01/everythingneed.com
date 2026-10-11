import AppLayout from '@/layouts/AppLayout';
import { Head } from '@inertiajs/react';
import DealLanding, { DEAL_LANDINGS } from '@/components/Marketplace/DealLanding';

export default function DealLandingPage({ slug }: { slug: string }) {
    const config = DEAL_LANDINGS[slug];
    return (
        <AppLayout title={config?.title ?? 'Deals'}>
            <Head title={config ? `${config.title} | Deals` : 'Deals'} />
            <DealLanding slug={slug} />
        </AppLayout>
    );
}
