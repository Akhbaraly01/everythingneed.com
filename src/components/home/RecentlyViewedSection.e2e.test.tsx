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

describe("RecentlyViewedSection — empty state & corrupted storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders nothing when storage is empty", () => {
    const { container } = render(<HomeSim />);
    expect(container.querySelector("section")).toBeNull();
    expect(screen.queryByText("Recently Viewed")).not.toBeInTheDocument();
  });

  it("gracefully handles corrupted localStorage and repopulates with correct eviction", async () => {
    // Corrupt the storage entry
    localStorage.setItem(STORAGE_KEY, "{not json");

    // Should not throw and should show no section initially
    const { unmount: u0 } = render(<HomeSim />);
    expect(screen.queryByText("Recently Viewed")).not.toBeInTheDocument();
    u0();

    // Now simulate visiting 12 products — eviction should still work correctly
    for (let i = 1; i <= 12; i++) {
      const { unmount } = render(<ProductDetailSim product={makeProduct(i)} />);
      await act(async () => {});
      unmount();
    }

    render(<HomeSim />);
    expect(screen.getByText("Recently Viewed")).toBeInTheDocument();
    const names = screen.getAllByText(/^Product \d+$/).map((el) => el.textContent);
    expect(names).toHaveLength(10);
    expect(names[0]).toBe("Product 12");
    expect(names[9]).toBe("Product 3");
  });

  it("clearing localStorage mid-session resets to empty on next mount", async () => {
    const { unmount } = render(<ProductDetailSim product={makeProduct(1)} />);
    await act(async () => {});
    unmount();

    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")).toHaveLength(1);

    // User clears storage (e.g. devtools / privacy reset)
    localStorage.clear();

    render(<HomeSim />);
    expect(screen.queryByText("Recently Viewed")).not.toBeInTheDocument();
  });
});

describe("RecentlyViewedSection — duplicates during 12 visits", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("dedupes revisits and keeps newest-first recency order", async () => {
    // Visit order: 1,2,3,4,5,2,6,7,3,8,9,1,10,11,12
    // Expected newest-first unique sequence (most recent action wins):
    // 12,11,10,1,9,8,3,7,6,2,5,4  -> truncated to 10
    const visitOrder = [1, 2, 3, 4, 5, 2, 6, 7, 3, 8, 9, 1, 10, 11, 12];

    for (const i of visitOrder) {
      const { unmount } = render(<ProductDetailSim product={makeProduct(i)} />);
      await act(async () => {});
      unmount();
    }

    render(<HomeSim />);
    const names = screen.getAllByText(/^Product \d+$/).map((el) => el.textContent);

    // Exactly 10, no duplicates
    expect(names).toHaveLength(10);
    expect(new Set(names).size).toBe(10);

    // Correct newest-first recency order, truncated at 10
    expect(names).toEqual([
      "Product 12", "Product 11", "Product 10", "Product 1", "Product 9",
      "Product 8", "Product 3", "Product 7", "Product 6", "Product 2",
    ]);
  });
});

describe("RecentlyViewedSection — persistence across hard reload", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("survives a simulated hard reload and still shows 10 items in order", async () => {
    // Session 1: visit 12 products
    for (let i = 1; i <= 12; i++) {
      const { unmount } = render(<ProductDetailSim product={makeProduct(i)} />);
      await act(async () => {});
      unmount();
    }

    // Simulate hard reload by tearing everything down. localStorage persists.
    // (No unmount call needed — we never mounted Home in session 1.)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    expect(stored).toHaveLength(10);

    // Session 2: brand new mount of Home, no prior React state
    render(<HomeSim />);

    expect(screen.getByText("Recently Viewed")).toBeInTheDocument();
    const names = screen.getAllByText(/^Product \d+$/).map((el) => el.textContent);
    expect(names).toEqual([
      "Product 12", "Product 11", "Product 10", "Product 9", "Product 8",
      "Product 7", "Product 6", "Product 5", "Product 4", "Product 3",
    ]);
  });
});

