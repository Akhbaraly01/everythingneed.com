import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function PharmacyCart() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pharmacy_cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {
    }
  }, []);
  const updateQty = (medicineId, qty) => {
    if (qty < 1) return;
    const updated = items.map((i) => i.medicine_id === medicineId ? { ...i, quantity: qty } : i);
    setItems(updated);
    localStorage.setItem("pharmacy_cart", JSON.stringify(updated));
  };
  const removeItem = (medicineId) => {
    const updated = items.filter((i) => i.medicine_id !== medicineId);
    setItems(updated);
    if (updated.length === 0) localStorage.removeItem("pharmacy_cart");
    else localStorage.setItem("pharmacy_cart", JSON.stringify(updated));
  };
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const handleCheckout = async () => {
    if (items.length === 0) return;
    try {
      const res = await api.post("/api/pharmacy/orders", {
        items: items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity }))
      });
      localStorage.removeItem("pharmacy_cart");
      router.visit(`/pharmacy/orders/${res.data.id}`);
    } catch (e) {
      alert(errorMessage(e, "Failed to place order"));
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Pharmacy Cart", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pharmacy Cart" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsx(Link, { href: "/pharmacy", className: "text-sm text-gray-500 hover:text-gray-700", children: "← Back to Pharmacy" }),
      items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Your cart is empty" }),
        /* @__PURE__ */ jsx(Link, { href: "/pharmacy", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Medicines" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
        items.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4 rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("div", { className: "h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-gray-100", children: item.image_url ? /* @__PURE__ */ jsx("img", { src: item.image_url, alt: "", className: "h-full w-full object-cover" }) : null }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: item.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              formatCurrency(item.price),
              " each"
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("button", { onClick: () => updateQty(item.medicine_id, item.quantity - 1), className: "rounded border p-1", children: /* @__PURE__ */ jsx(Minus, { className: "h-3 w-3" }) }),
            /* @__PURE__ */ jsx("span", { className: "w-6 text-center text-sm", children: item.quantity }),
            /* @__PURE__ */ jsx("button", { onClick: () => updateQty(item.medicine_id, item.quantity + 1), className: "rounded border p-1", children: /* @__PURE__ */ jsx(Plus, { className: "h-3 w-3" }) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "w-20 text-right font-semibold", children: formatCurrency(item.price * item.quantity) }),
          /* @__PURE__ */ jsx("button", { onClick: () => removeItem(item.medicine_id), className: "text-red-500 hover:text-red-700", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }, item.medicine_id)),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("span", { children: formatCurrency(subtotal) })
          ] }),
          /* @__PURE__ */ jsxs("button", { onClick: handleCheckout, className: "mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500", children: [
            "Place Order ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
          ] })
        ] })
      ] })
    ] })
  ] });
}
export {
  PharmacyCart as default
};
