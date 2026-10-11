import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Pill, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function PharmacyCheckout() {
  const [items, setItems] = useState([]);
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    try {
      const stored = localStorage.getItem("pharmacy_cart");
      if (stored) setItems(JSON.parse(stored));
    } catch {
    }
  }, []);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const handleOrder = async () => {
    if (!address.trim() || items.length === 0) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/pharmacy/orders", {
        items: items.map((i) => ({ medicine_id: i.medicine_id, quantity: i.quantity })),
        delivery_address: address
      });
      localStorage.removeItem("pharmacy_cart");
      router.visit(`/pharmacy/orders/${res.data.id}`);
    } catch (e) {
      alert(errorMessage(e, "Failed to place order"));
    }
    setSubmitting(false);
  };
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs(AppLayout, { title: "Pharmacy Checkout", children: [
      /* @__PURE__ */ jsx(Head, { title: "Pharmacy Checkout" }),
      /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
        /* @__PURE__ */ jsx(Pill, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "Your pharmacy cart is empty." })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Pharmacy Checkout", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pharmacy Checkout" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl mx-auto space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Pharmacy Checkout" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-3", children: "Order Summary" }),
        items.map((item, idx) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm py-1", children: [
          /* @__PURE__ */ jsxs("span", { children: [
            item.quantity,
            "x ",
            item.name
          ] }),
          /* @__PURE__ */ jsx("span", { children: formatCurrency(item.price * item.quantity) })
        ] }, idx)),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 border-t pt-3 flex justify-between font-bold", children: [
          /* @__PURE__ */ jsx("span", { children: "Total" }),
          /* @__PURE__ */ jsx("span", { children: formatCurrency(subtotal) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Shipping Address *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: address,
            onChange: (e) => setAddress(e.target.value),
            rows: 3,
            required: true,
            placeholder: "Enter your delivery address...",
            className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: handleOrder,
          disabled: submitting || !address.trim(),
          className: "w-full flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
          children: [
            "Place Order ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
          ]
        }
      )
    ] })
  ] });
}
export {
  PharmacyCheckout as default
};
