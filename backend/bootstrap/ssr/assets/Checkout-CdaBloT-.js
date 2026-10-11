import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function FoodCheckout() {
  const [cartItems, setCartItems] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ delivery_address: "", phone: "", notes: "" });
  useEffect(() => {
    api.get("/api/food/cart").then((res) => {
      var _a, _b;
      setCartItems(((_a = res.data) == null ? void 0 : _a.items) || []);
      setRestaurant(((_b = res.data) == null ? void 0 : _b.restaurant) || null);
    }).catch(() => {
    }).finally(() => setLoading(false));
  }, []);
  const subtotal = cartItems.reduce((sum, i) => sum + i.menu_item.price * i.quantity, 0);
  const deliveryFee = (restaurant == null ? void 0 : restaurant.delivery_fee) || 0;
  const total = subtotal + deliveryFee;
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/food/orders", {
        restaurant_id: restaurant == null ? void 0 : restaurant.id,
        items: cartItems.map((i) => ({ menu_item_id: i.menu_item.id || i.id, quantity: i.quantity, special_instructions: i.special_instructions })),
        ...form
      });
      router.visit(`/food/orders/${res.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Food Checkout", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (cartItems.length === 0) return /* @__PURE__ */ jsx(AppLayout, { title: "Food Checkout", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Your cart is empty" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Food Checkout", children: [
    /* @__PURE__ */ jsx(Head, { title: "Food Checkout" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Checkout" }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Delivery Details" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Delivery Address" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: form.delivery_address,
              onChange: (e) => setForm({ ...form, delivery_address: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Full delivery address"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Phone" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              required: true,
              value: form.phone,
              onChange: (e) => setForm({ ...form, phone: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Contact phone number"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Special Instructions" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.notes,
              onChange: (e) => setForm({ ...form, notes: e.target.value }),
              rows: 2,
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Any special instructions for delivery..."
            }
          )
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white mb-4", children: "Order Summary" }),
        /* @__PURE__ */ jsx("div", { className: "divide-y dark:divide-gray-700", children: cartItems.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-3", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: item.menu_item.name }),
            /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
              "Qty: ",
              item.quantity
            ] })
          ] }),
          /* @__PURE__ */ jsxs("span", { className: "font-semibold text-gray-900 dark:text-white", children: [
            "$",
            (item.menu_item.price * item.quantity).toFixed(2)
          ] })
        ] }, item.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2 border-t pt-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Subtotal" }),
            /* @__PURE__ */ jsxs("span", { className: "text-gray-900 dark:text-white", children: [
              "$",
              subtotal.toFixed(2)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Delivery Fee" }),
            /* @__PURE__ */ jsxs("span", { className: "text-gray-900 dark:text-white", children: [
              "$",
              deliveryFee.toFixed(2)
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between font-semibold", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-900 dark:text-white", children: "Total" }),
            /* @__PURE__ */ jsxs("span", { className: "text-gray-900 dark:text-white", children: [
              "$",
              total.toFixed(2)
            ] })
          ] })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "submit",
          disabled: submitting,
          className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2",
          children: [
            submitting ? "Placing Order..." : "Place Order",
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] })
  ] });
}
export {
  FoodCheckout as default
};
