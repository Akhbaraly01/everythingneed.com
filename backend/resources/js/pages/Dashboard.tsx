import HomeIndex, { type HomeSections } from '@/pages/Home/Index';
import type { MarketplaceProduct } from '@/components/Marketplace/ProductCard';

interface TopExpert {
    id: string | number;
    name: string;
    role: string;
    source: string;
    link: string;
}

interface DashboardProps {
    products?: {
        data: MarketplaceProduct[];
    };
    categories?: { id: string | number; name: string; slug?: string; icon?: string | null }[];
    learning?: MarketplaceProduct[];
    healthcareCards?: MarketplaceProduct[];
    topExperts?: TopExpert[];
    cartCount?: number;
    sections?: HomeSections;
}

export default function Dashboard({ products, categories, learning, healthcareCards, topExperts, cartCount = 0, sections }: DashboardProps) {
    return (
        <HomeIndex
            products={products}
            categories={categories}
            learning={learning}
            healthcareCards={healthcareCards}
            topExperts={topExperts}
            cartCount={cartCount}
            sections={sections}
        />
    );
}
