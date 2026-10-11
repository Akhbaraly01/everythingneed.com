import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage, A as ApiError } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Star, Truck, Shield, RotateCcw, Minus, Plus, Check, ShoppingCart, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import { u as useRecentlyViewed } from "./useRecentlyViewed-CNoHSyHD.js";
import "clsx";
import "sonner";
function ProductShow({ product }) {
  const { auth } = usePage().props;
  const isLoggedIn = Boolean((auth == null ? void 0 : auth.id) ?? (auth == null ? void 0 : auth.user));
  const { addItem: recordView } = useRecentlyViewed();
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  useEffect(() => {
    var _a;
    recordView({
      id: product.id,
      name: product.name,
      image: product.image_url ?? ((_a = product.images) == null ? void 0 : _a[0]) ?? "",
      price: product.price,
      category: product.category
    });
  }, [product, recordView]);
  const handleAddToCart = async () => {
    if (!isLoggedIn) {
      router.visit("/login");
      return;
    }
    setAdding(true);
    try {
      await api.post("/api/cart/items", {
        product_id: product.id,
        quantity
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 2e3);
    } catch (e) {
      alert(errorMessage(e, "Failed to add to cart"));
    } finally {
      setAdding(false);
    }
  };
  const handleWishlist = async () => {
    if (!isLoggedIn) {
      router.visit("/login");
      return;
    }
    try {
      await api.post("/api/wishlist", { product_id: product.id });
      alert("Added to wishlist");
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) alert("Already in wishlist");
      else alert(errorMessage(e, "Wishlist failed"));
    }
  };
  const handleCompare = async () => {
    if (!isLoggedIn) {
      router.visit("/login");
      return;
    }
    try {
      await api.post("/api/compare", { product_id: product.id });
      window.dispatchEvent(new CustomEvent("everythingneed:compare-updated"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        window.dispatchEvent(new CustomEvent("everythingneed:compare-updated"));
      } else alert(errorMessage(e, "Compare failed"));
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: product.name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsxs("nav", { className: "flex text-sm text-gray-500", children: [
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "hover:text-gray-700", children: "Products" }),
        /* @__PURE__ */ jsx("span", { className: "mx-2", children: "/" }),
        /* @__PURE__ */ jsx(Link, { href: `/products?category=${product.category}`, className: "hover:text-gray-700", children: product.category }),
        /* @__PURE__ */ jsx("span", { className: "mx-2", children: "/" }),
        /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: product.name })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
          /* @__PURE__ */ jsx("div", { className: "aspect-square overflow-hidden rounded-lg bg-gray-100", children: product.image_url ? /* @__PURE__ */ jsx("img", { src: product.image_url, alt: product.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: "No image" }) }),
          product.images && product.images.length > 1 && /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 gap-2", children: product.images.slice(0, 4).map((img, i) => /* @__PURE__ */ jsx("div", { className: "aspect-square overflow-hidden rounded-lg bg-gray-100", children: /* @__PURE__ */ jsx("img", { src: img, alt: "", className: "h-full w-full object-cover" }) }, i)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: product.name }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 flex items-center gap-2", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-5 w-5 fill-yellow-400 text-yellow-400" }),
              /* @__PURE__ */ jsx("span", { className: "ml-1 text-sm font-medium", children: product.rating ?? "N/A" }),
              /* @__PURE__ */ jsxs("span", { className: "ml-1 text-sm text-gray-500", children: [
                "(",
                product.reviews_count ?? 0,
                " reviews)"
              ] })
            ] }) }),
            product.vendor && /* @__PURE__ */ jsxs(Link, { href: `/vendors/${product.vendor_id}`, className: "mt-1 inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-500", children: [
              product.vendor.store_name,
              product.vendor.is_verified && /* @__PURE__ */ jsx("span", { className: "text-green-500", children: "✓" })
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-3", children: [
            /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatCurrency(product.price) }),
            product.compare_price && /* @__PURE__ */ jsx("span", { className: "text-xl text-gray-400 line-through", children: formatCurrency(product.compare_price) })
          ] }),
          product.description && /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-400", children: product.description }),
          /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsx(Truck, { className: "h-4 w-4" }),
              "Free shipping on orders over $50"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsx(Shield, { className: "h-4 w-4" }),
              "Secure payment"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsx(RotateCcw, { className: "h-4 w-4" }),
              "30-day return policy"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-lg border border-gray-300 dark:border-gray-600", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuantity(Math.max(1, quantity - 1)),
                  className: "p-3 hover:bg-gray-50 dark:hover:bg-gray-700",
                  children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "w-12 text-center font-medium", children: quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => setQuantity(quantity + 1),
                  className: "p-3 hover:bg-gray-50 dark:hover:bg-gray-700",
                  children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleAddToCart,
                disabled: adding || product.stock_quantity <= 0,
                className: `flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-lg font-semibold text-white transition ${added ? "bg-green-600" : "bg-indigo-600 hover:bg-indigo-500"} disabled:opacity-50`,
                children: added ? /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(Check, { className: "h-5 w-5" }),
                  " Added!"
                ] }) : adding ? "Adding..." : product.stock_quantity <= 0 ? "Out of Stock" : /* @__PURE__ */ jsxs(Fragment, { children: [
                  /* @__PURE__ */ jsx(ShoppingCart, { className: "h-5 w-5" }),
                  " Add to Cart"
                ] })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleWishlist,
                title: "Add to wishlist",
                className: "rounded-lg border border-gray-300 p-3 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700",
                children: /* @__PURE__ */ jsx(Heart, { className: "h-6 w-6 text-gray-600 dark:text-gray-400" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: handleCompare,
                title: "Add to compare",
                className: "rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-gray-300",
                children: "Compare"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-gray-50 p-4 dark:bg-gray-800", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Category:" }),
              " ",
              product.category
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "mt-1 text-sm text-gray-600 dark:text-gray-400", children: [
              /* @__PURE__ */ jsx("span", { className: "font-medium", children: "Stock:" }),
              " ",
              product.stock_quantity > 0 ? `${product.stock_quantity} available` : "Out of stock"
            ] })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  ProductShow as default
};
