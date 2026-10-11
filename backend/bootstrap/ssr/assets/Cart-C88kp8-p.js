import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function FoodCartPage() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("food_cart");
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch {
    }
    setLoading(false);
  }, []);
  const updateQty = (itemId, qty) => {
    if (!cart || qty < 1) return;
    const updated = { ...cart, items: cart.items.map((i) => i.id === itemId ? { ...i, quantity: qty } : i) };
    updated.subtotal = updated.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    setCart(updated);
    localStorage.setItem("food_cart", JSON.stringify(updated));
  };
  const removeItem = (itemId) => {
    if (!cart) return;
    const updated = { ...cart, items: cart.items.filter((i) => i.id !== itemId) };
    updated.subtotal = updated.items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
    if (updated.items.length === 0) {
      localStorage.removeItem("food_cart");
      setCart(null);
    } else {
      setCart(updated);
      localStorage.setItem("food_cart", JSON.stringify(updated));
    }
  };
  const placeOrder = async () => {
    if (!cart || cart.items.length === 0) return;
    try {
      await api.post(`/api/restaurants/${cart.restaurant_id}/order`, {
        items: cart.items.map((i) => ({ menu_item_id: i.menu_item_id, quantity: i.quantity, special_instructions: i.special_instructions })),
        delivery_address: "Delivery address"
      });
      localStorage.removeItem("food_cart");
      router.visit("/food");
    } catch (e) {
      alert(errorMessage(e, "Failed to place order"));
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Food Cart", children: [
    /* @__PURE__ */ jsx(Head, { title: "Food Cart" }),
    /* @__PURE__ */ jsx("div", { className: "space-y-6", children: loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : !cart || cart.items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
      /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-12 w-12 text-gray-400" }),
      /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Your food cart is empty" }),
      /* @__PURE__ */ jsx(Link, { href: "/food", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Restaurants" })
    ] }) : /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-4", children: [
      /* @__PURE__ */ jsxs("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [
        "Order from ",
        cart.restaurant_name
      ] }),
      cart.items.map((item) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: ((_a = item.menu_item) == null ? void 0 : _a.name) ?? "Item" }),
            item.special_instructions && /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: item.special_instructions })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => updateQty(item.id, item.quantity - 1), className: "rounded border p-1 hover:bg-gray-50 dark:border-gray-600", children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsx("span", { className: "w-6 text-center text-sm", children: item.quantity }),
            /* @__PURE__ */ jsx("button", { onClick: () => updateQty(item.id, item.quantity + 1), className: "rounded border p-1 hover:bg-gray-50 dark:border-gray-600", children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "w-20 text-right font-semibold", children: formatCurrency(item.unit_price * item.quantity) }),
          /* @__PURE__ */ jsx("button", { onClick: () => removeItem(item.id), className: "text-red-500 hover:text-red-700", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, item.id);
      }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsx("span", { children: formatCurrency(cart.subtotal) })
        ] }),
        /* @__PURE__ */ jsxs("button", { onClick: placeOrder, className: "mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500", children: [
          "Place Order ",
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
        ] })
      ] })
    ] }) })
  ] });
}
export {
  FoodCartPage as default
};
