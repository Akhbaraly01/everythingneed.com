import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { ShoppingCart, ArrowRight, AlertTriangle, Minus, Plus, Trash2, Tag } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
function CartIndex() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState(null);
  const fetchCart = () => {
    api.get("/api/cart").then((res) => setCart(res.data)).catch(() => setCart(null)).finally(() => setLoading(false));
  };
  useEffect(() => {
    fetchCart();
  }, []);
  const updateQuantity = async (itemId, newQty) => {
    if (newQty < 1) return;
    try {
      await api.put(`/api/cart/items/${itemId}`, { quantity: newQty });
      fetchCart();
    } catch (e) {
      toast.error(errorMessage(e, "Could not update quantity"));
    }
  };
  const removeItem = async (itemId) => {
    try {
      await api.del(`/api/cart/items/${itemId}`);
      fetchCart();
    } catch (e) {
      toast.error(errorMessage(e, "Could not remove item"));
    }
  };
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMsg(null);
    try {
      const res = await api.post("/api/cart/coupon", { code: couponCode.trim() });
      setCouponMsg({ type: "success", text: res.message ?? "Coupon applied" });
      fetchCart();
    } catch (e) {
      setCouponMsg({ type: "error", text: errorMessage(e, "Invalid coupon") });
    }
  };
  const itemCount = (cart == null ? void 0 : cart.item_count) ?? 0;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Shopping Cart", children: [
    /* @__PURE__ */ jsx(Head, { title: "Shopping Cart" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading cart..." }) }) : itemCount === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-12 w-12 text-gray-400" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Your cart is empty" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Start adding items to your cart." }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: "/products",
          className: "mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500",
          children: [
            "Browse Products ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 lg:grid-cols-3", children: [
      /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-4", children: [
        /* @__PURE__ */ jsxs("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: [
          "Cart (",
          itemCount,
          " item",
          itemCount !== 1 ? "s" : "",
          ")"
        ] }),
        cart.cart.items.map((item) => {
          var _a, _b;
          return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
            /* @__PURE__ */ jsx("div", { className: "h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100", children: ((_a = item.product) == null ? void 0 : _a.image_url) ? /* @__PURE__ */ jsx("img", { src: item.product.image_url, alt: item.product.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-6 w-6" }) }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
              /* @__PURE__ */ jsx(
                Link,
                {
                  href: `/products/${item.product_id}`,
                  className: "font-medium text-gray-900 hover:text-indigo-600 dark:text-white",
                  children: ((_b = item.product) == null ? void 0 : _b.name) ?? "Product"
                }
              ),
              /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
                formatCurrency(item.unit_price),
                " each"
              ] }),
              (() => {
                var _a2;
                const available = (_a2 = cart.availability) == null ? void 0 : _a2[item.product_id];
                if (available === void 0 || available >= item.quantity) {
                  return null;
                }
                return /* @__PURE__ */ jsxs("p", { className: "mt-1 flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400", children: [
                  /* @__PURE__ */ jsx(AlertTriangle, { className: "h-3 w-3" }),
                  "Only ",
                  available,
                  " left - other carts are holding some stock"
                ] });
              })()
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(item.id, item.quantity - 1),
                  className: "rounded-lg border border-gray-300 p-1 hover:bg-gray-50 dark:border-gray-600",
                  children: /* @__PURE__ */ jsx(Minus, { className: "h-4 w-4" })
                }
              ),
              /* @__PURE__ */ jsx("span", { className: "w-8 text-center text-sm font-medium", children: item.quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(item.id, item.quantity + 1),
                  className: "rounded-lg border border-gray-300 p-1 hover:bg-gray-50 dark:border-gray-600",
                  children: /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" })
                }
              )
            ] }),
            /* @__PURE__ */ jsx("p", { className: "w-24 text-right font-semibold text-gray-900 dark:text-white", children: formatCurrency(item.unit_price * item.quantity) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => removeItem(item.id),
                className: "rounded-lg p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
              }
            )
          ] }, item.id);
        })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Order Summary" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Subtotal" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: formatCurrency(parseFloat(cart.subtotal)) })
          ] }),
          parseFloat(cart.discount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 text-green-600", children: [
              /* @__PURE__ */ jsx(Tag, { className: "h-3 w-3" }),
              "Discount"
            ] }),
            /* @__PURE__ */ jsxs("span", { className: "text-green-600", children: [
              "-",
              formatCurrency(parseFloat(cart.discount))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "pt-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "text",
                  value: couponCode,
                  onChange: (e) => setCouponCode(e.target.value),
                  placeholder: "Coupon code",
                  className: "flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                }
              ),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: applyCoupon,
                  className: "rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600",
                  children: "Apply"
                }
              )
            ] }),
            couponMsg && /* @__PURE__ */ jsx("p", { className: `mt-1 text-xs ${couponMsg.type === "success" ? "text-green-600" : "text-red-600"}`, children: couponMsg.text })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Shipping" }),
            /* @__PURE__ */ jsx("span", { className: parseFloat(cart.shipping ?? "0") === 0 ? "text-green-600" : "text-gray-900 dark:text-white", children: parseFloat(cart.shipping ?? "0") === 0 ? "Free" : formatCurrency(parseFloat(cart.shipping ?? "0")) })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200 pt-3 dark:border-gray-700", children: /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: "Total" }),
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: formatCurrency(parseFloat(cart.total)) })
          ] }) })
        ] }),
        /* @__PURE__ */ jsxs(
          Link,
          {
            href: "/orders/checkout",
            className: "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500",
            children: [
              "Proceed to Checkout ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
            ]
          }
        ),
        /* @__PURE__ */ jsx(
          Link,
          {
            href: "/products",
            className: "mt-3 flex w-full items-center justify-center rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300",
            children: "Continue Shopping"
          }
        )
      ] }) })
    ] }) })
  ] });
}
export {
  CartIndex as default
};
