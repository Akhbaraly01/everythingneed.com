import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { useEffect } from "react";
import RecentlyViewedSection from "@/components/home/RecentlyViewedSection";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

/**
 * End-to-end style test:
 * Simulates a user visiting 12 different product detail pages (each one fires
 * the same `useRecentlyViewed.addItem` effect that ProductDetail uses), then
 * "returns home" by rendering the actual <RecentlyViewedSection /> and asserts
 * that exactly 10 items are displayed in most-recent-first order.
 */

const STORAGE_KEY = "recently_viewed_products";

// Mimics ProductDetail's effect: on mount, push the product into recently viewed.
const ProductDetailSim = ({ product }: { product: any }) => {
  const { addItem } = useRecentlyViewed();
  useEffect(() => {
    addItem(product);
  }, [product.id]);
  return <div data-testid={`product-${product.id}`}>{product.name}</div>;
};

const HomeSim = () => (
  <MemoryRouter>
    <CurrencyProvider>
      <RecentlyViewedSection />
    </CurrencyProvider>
  </MemoryRouter>
);

const makeProduct = (i: number) => ({
  id: `p-${i}`,
  name: `Product ${i}`,
  image: `/img/${i}.jpg`,
  price: i * 10,
  category: "Electronics",
});

describe("RecentlyViewedSection — E2E (12 visits → home)", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows exactly 10 cards in most-recent-first order after visiting 12 products", async () => {
    // Visit 12 product pages sequentially. Each render triggers addItem in an effect.
    for (let i = 1; i <= 12; i++) {
      const { unmount } = render(<ProductDetailSim product={makeProduct(i)} />);
      // Let effects flush
      await act(async () => {});
      unmount(); // "navigate away" before the next product
    }

    // Now "return home" — render the real RecentlyViewedSection.
    render(<HomeSim />);

    // Section heading is present
    expect(screen.getByText("Recently Viewed")).toBeInTheDocument();

    // Exactly 10 product cards rendered
    const renderedNames = screen.getAllByText(/^Product \d+$/);
    expect(renderedNames).toHaveLength(10);

    // Most-recent first: 12, 11, 10, ..., 3
    const names = renderedNames.map((el) => el.textContent);
    expect(names).toEqual([
      "Product 12", "Product 11", "Product 10", "Product 9", "Product 8",
      "Product 7", "Product 6", "Product 5", "Product 4", "Product 3",
    ]);

    // Earliest two were evicted
    expect(screen.queryByText("Product 1")).not.toBeInTheDocument();
    expect(screen.queryByText("Product 2")).not.toBeInTheDocument();

    // Underlying storage matches
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(10);
    expect(stored[0].id).toBe("p-12");
    expect(stored[9].id).toBe("p-3");
  });
});
