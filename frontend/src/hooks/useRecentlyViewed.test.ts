import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";

const STORAGE_KEY = "recently_viewed_products";

const makeProduct = (id: number) => ({
  id: `prod-${id}`,
  name: `Product ${id}`,
  image: `/img/${id}.jpg`,
  price: id * 10,
  category: "test",
});

describe("useRecentlyViewed", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("caps at 10 items and keeps most-recent first after viewing 12 products", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    // Simulate visiting 12 different product detail pages in order 1..12
    act(() => {
      for (let i = 1; i <= 12; i++) {
        result.current.addItem(makeProduct(i));
      }
    });

    const ids = result.current.recentlyViewed.map((p) => p.id);

    // Exactly 10 items
    expect(ids).toHaveLength(10);

    // Most-recent first: last viewed (12) should be at index 0, oldest kept (3) at the end
    expect(ids[0]).toBe("prod-12");
    expect(ids[ids.length - 1]).toBe("prod-3");

    // Earliest two (1, 2) must have been evicted
    expect(ids).not.toContain("prod-1");
    expect(ids).not.toContain("prod-2");

    // Order is strictly newest -> oldest: 12, 11, 10, ..., 3
    expect(ids).toEqual([
      "prod-12", "prod-11", "prod-10", "prod-9", "prod-8",
      "prod-7", "prod-6", "prod-5", "prod-4", "prod-3",
    ]);
  });

  it("dedupes by id and moves a re-viewed product to the front", () => {
    const { result } = renderHook(() => useRecentlyViewed());

    act(() => {
      result.current.addItem(makeProduct(1));
      result.current.addItem(makeProduct(2));
      result.current.addItem(makeProduct(3));
      // Re-view product 1
      result.current.addItem(makeProduct(1));
    });

    const ids = result.current.recentlyViewed.map((p) => p.id);
    expect(ids).toEqual(["prod-1", "prod-3", "prod-2"]);
    expect(ids).toHaveLength(3);
  });

  it("persists across hook re-mounts via localStorage (refresh / new session)", () => {
    // First "session": view 3 products
    const { result: first, unmount } = renderHook(() => useRecentlyViewed());
    act(() => {
      first.current.addItem(makeProduct(1));
      first.current.addItem(makeProduct(2));
      first.current.addItem(makeProduct(3));
    });
    unmount();

    // Verify persisted to localStorage
    const raw = localStorage.getItem(STORAGE_KEY);
    expect(raw).not.toBeNull();

    // Second "session": fresh hook should rehydrate in same order
    const { result: second } = renderHook(() => useRecentlyViewed());
    const ids = second.current.recentlyViewed.map((p) => p.id);
    expect(ids).toEqual(["prod-3", "prod-2", "prod-1"]);
  });
});
