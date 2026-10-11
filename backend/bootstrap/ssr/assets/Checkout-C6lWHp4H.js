import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, router, Head, Link } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CheckCircle, ShoppingCart, ArrowRight, ArrowLeft, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function CheckoutPage() {
  const { auth } = usePage().props;
  const [step, setStep] = useState("details");
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState(null);
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState("card");
  useEffect(() => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    api.get("/api/cart").then((res) => setCart(res.data)).catch(() => setCart(null)).finally(() => setLoading(false));
  }, [auth == null ? void 0 : auth.user]);
  const placeOrder = async () => {
    if (!address.trim()) return;
    setSubmitting(true);
    try {
      const res = await api.post("/api/product-orders", {
        items: cart.cart.items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity
        })),
        coupon_code: cart.cart.coupon_code || void 0,
        shipping_address: address,
        shipping_city: city || void 0,
        shipping_country: country || void 0,
        phone: phone || void 0,
        notes: notes || void 0
      });
      const placed = res.data;
      setOrder(placed);
      try {
        await api.post("/api/payments/charge", {
          order_id: placed.id,
          // Server-computed order total (includes shipping) is authoritative.
          amount: placed.total_amount,
          method
        });
      } catch {
      }
      try {
        await api.del("/api/cart");
      } catch {
      }
      setStep("done");
    } catch (e) {
      alert(errorMessage(e, "Failed to place order"));
    } finally {
      setSubmitting(false);
    }
  };
  const itemCount = (cart == null ? void 0 : cart.item_count) ?? 0;
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Checkout", children: [
    /* @__PURE__ */ jsx(Head, { title: "Checkout" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("div", { className: "flex items-center justify-center gap-4 text-sm", children: ["details", "payment", "done"].map((s, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: `flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${step === s ? "bg-indigo-600 text-white" : ["details", "payment", "done"].indexOf(step) > i ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"}`, children: ["details", "payment", "done"].indexOf(step) > i ? /* @__PURE__ */ jsx(CheckCircle, { className: "h-4 w-4" }) : i + 1 }),
        /* @__PURE__ */ jsx("span", { className: step === s ? "font-medium text-gray-900 dark:text-white" : "text-gray-500", children: s === "details" ? "Delivery" : s === "payment" ? "Payment" : "Done" }),
        i < 2 && /* @__PURE__ */ jsx("div", { className: "h-px w-12 bg-gray-300" })
      ] }, s)) }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading cart..." }) }) : itemCount === 0 && step !== "done" ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "Your cart is empty" }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "mt-4 inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Browse Products" })
      ] }) : /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-1 gap-8 lg:grid-cols-3", children: [
        /* @__PURE__ */ jsxs("div", { className: "lg:col-span-2 space-y-6", children: [
          step === "details" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Delivery Details" }),
            /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-4", children: [
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Address *" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: address,
                    onChange: (e) => setAddress(e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700",
                    placeholder: "123 Main St"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "City" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: city,
                      onChange: (e) => setCity(e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                    }
                  )
                ] }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Country" }),
                  /* @__PURE__ */ jsx(
                    "input",
                    {
                      type: "text",
                      value: country,
                      onChange: (e) => setCountry(e.target.value),
                      className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone" }),
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "text",
                    value: phone,
                    onChange: (e) => setPhone(e.target.value),
                    className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                  }
                )
              ] }),
              /* @__PURE__ */ jsxs("div", { children: [
                /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Notes" }),
                /* @__PURE__ */ jsx(
                  "textarea",
                  {
                    value: notes,
                    onChange: (e) => setNotes(e.target.value),
                    rows: 2,
                    className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: () => address.trim() && setStep("payment"),
                disabled: !address.trim(),
                className: "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
                children: [
                  "Continue to Payment ",
                  /* @__PURE__ */ jsx(ArrowRight, { className: "h-5 w-5" })
                ]
              }
            )
          ] }),
          step === "payment" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
            /* @__PURE__ */ jsx("h2", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Payment Method" }),
            /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: [
              { value: "card", label: "Credit/Debit Card" },
              { value: "mobile_money", label: "Mobile Money" },
              { value: "bank_transfer", label: "Bank Transfer" }
            ].map((opt) => /* @__PURE__ */ jsxs("label", { className: "flex items-center gap-3 rounded-lg border border-gray-200 p-3 cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700", children: [
              /* @__PURE__ */ jsx("input", { type: "radio", name: "method", value: opt.value, checked: method === opt.value, onChange: (e) => setMethod(e.target.value), className: "text-indigo-600" }),
              /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-gray-900 dark:text-white", children: opt.label })
            ] }, opt.value)) }),
            /* @__PURE__ */ jsx("p", { className: "mt-4 rounded-lg bg-yellow-50 p-3 text-xs text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300", children: "Test mode — no real payment will be charged." }),
            /* @__PURE__ */ jsxs("div", { className: "mt-6 flex gap-3", children: [
              /* @__PURE__ */ jsxs("button", { onClick: () => setStep("details"), className: "flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600", children: [
                /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
                " Back"
              ] }),
              /* @__PURE__ */ jsxs(
                "button",
                {
                  onClick: placeOrder,
                  disabled: submitting,
                  className: "flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
                  children: [
                    /* @__PURE__ */ jsx(CreditCard, { className: "h-5 w-5" }),
                    submitting ? "Placing Order..." : `Pay ${cart ? formatCurrency(parseFloat(cart.total)) : ""}`
                  ]
                }
              )
            ] })
          ] }),
          step === "done" && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
            /* @__PURE__ */ jsx(CheckCircle, { className: "mx-auto h-16 w-16 text-green-500" }),
            /* @__PURE__ */ jsx("h2", { className: "mt-4 text-2xl font-bold text-gray-900 dark:text-white", children: "Order Placed!" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 text-gray-500", children: [
              "Order #",
              order == null ? void 0 : order.order_number
            ] }),
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: [
              "Total: ",
              order ? formatCurrency(order.total_amount) : ""
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "mt-8 flex justify-center gap-4", children: [
              /* @__PURE__ */ jsx(Link, { href: `/orders/${order == null ? void 0 : order.id}`, className: "rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Track Order" }),
              /* @__PURE__ */ jsx(Link, { href: "/orders", className: "rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600", children: "View All Orders" }),
              /* @__PURE__ */ jsx(Link, { href: "/products", className: "rounded-lg border border-gray-300 px-6 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-600", children: "Continue Shopping" })
            ] })
          ] })
        ] }),
        cart && cart.cart.items.length > 0 && /* @__PURE__ */ jsx("div", { className: "lg:col-span-1", children: /* @__PURE__ */ jsxs("div", { className: "sticky top-24 rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900 dark:text-white", children: "Order Summary" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 divide-y dark:divide-gray-700", children: cart.cart.items.map((item) => {
            var _a, _b;
            return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 py-3", children: [
              /* @__PURE__ */ jsx("div", { className: "h-12 w-12 shrink-0 overflow-hidden rounded bg-gray-100", children: ((_a = item.product) == null ? void 0 : _a.image_url) ? /* @__PURE__ */ jsx("img", { src: item.product.image_url, alt: "", className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4" }) }) }),
              /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                /* @__PURE__ */ jsx("p", { className: "truncate text-sm font-medium text-gray-900 dark:text-white", children: ((_b = item.product) == null ? void 0 : _b.name) ?? "Product" }),
                /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                  "Qty: ",
                  item.quantity
                ] })
              ] }),
              /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold text-gray-900 dark:text-white", children: formatCurrency(item.unit_price * item.quantity) })
            ] }, item.id);
          }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-2 border-t border-gray-200 pt-4 dark:border-gray-700", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Subtotal" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(parseFloat(cart.subtotal)) })
            ] }),
            parseFloat(cart.discount) > 0 && /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm text-green-600", children: [
              /* @__PURE__ */ jsx("span", { children: "Discount" }),
              /* @__PURE__ */ jsxs("span", { children: [
                "-",
                formatCurrency(parseFloat(cart.discount))
              ] })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Shipping" }),
              /* @__PURE__ */ jsx("span", { className: parseFloat(cart.shipping ?? "0") === 0 ? "text-green-600" : "", children: parseFloat(cart.shipping ?? "0") === 0 ? "Free" : formatCurrency(parseFloat(cart.shipping ?? "0")) })
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-lg font-bold", children: [
              /* @__PURE__ */ jsx("span", { children: "Total" }),
              /* @__PURE__ */ jsx("span", { children: formatCurrency(parseFloat(cart.total)) })
            ] })
          ] })
        ] }) })
      ] })
    ] })
  ] });
}
export {
  CheckoutPage as default
};
