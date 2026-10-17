import ProductCard, { type MarketplaceProduct } from '@/components/Marketplace/ProductCard';

interface ProductGridProps {
    products: MarketplaceProduct[];
    /** Stable prefix so interleaved batches never emit duplicate React keys. */
    keyPrefix?: string;
    testId?: string;
}

/**
 * Responsive Home product grid (Home rebuild): 2 cols mobile,
 * 3 cols tablet, 5 cols desktop. Cards are the shared ProductCard —
 * wishlist + Add to Cart behaviour stays exactly as everywhere else.
 */
export default function ProductGrid({ products, keyPrefix = 'grid', testId }: ProductGridProps) {
    if (products.length === 0) {
        return null;
    }

    return (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5" data-testid={testId}>
            {products.map((product, index) => (
                <ProductCard key={`${keyPrefix}-${product.id}-${index}`} product={product} />
            ))}
        </div>
    );
}
