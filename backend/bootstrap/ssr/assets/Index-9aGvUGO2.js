import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Search, ShoppingCart, Pill } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function PharmacyIndex() {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter] = useState("");
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (categoryFilter) params.set("category", categoryFilter);
    const qs = params.toString();
    api.get(`/api/medicines${qs ? `?${qs}` : ""}`).then((res) => setMedicines(res.data)).catch(() => setMedicines([])).finally(() => setLoading(false));
  }, [search, categoryFilter]);
  const addToCart = (med) => {
    if (med.requires_prescription) {
      alert("This medicine requires a valid prescription. Please upload a prescription first.");
      return;
    }
    try {
      const cart = JSON.parse(localStorage.getItem("pharmacy_cart") ?? "[]");
      const existing = cart.find((i) => i.medicine_id === med.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        cart.push({ medicine_id: med.id, name: med.name, price: med.price, quantity: 1, image_url: med.image_url });
      }
      localStorage.setItem("pharmacy_cart", JSON.stringify(cart));
      alert("Added to cart");
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Pharmacy", children: [
    /* @__PURE__ */ jsx(Head, { title: "Pharmacy" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Pharmacy" }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Order medicines and healthcare products" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "relative flex-1 max-w-md", children: [
          /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: search,
              onChange: (e) => setSearch(e.target.value),
              placeholder: "Search medicines...",
              className: "w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(Link, { href: "/pharmacy/cart", className: "inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50", children: [
          /* @__PURE__ */ jsx(ShoppingCart, { className: "h-4 w-4" }),
          " Cart"
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) }) : medicines.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Pill, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No medicines found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4", children: medicines.map((med) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("div", { className: "h-32 bg-gray-100 rounded-lg flex items-center justify-center dark:bg-gray-700", children: med.image_url ? /* @__PURE__ */ jsx("img", { src: med.image_url, alt: "", className: "h-full w-full object-cover rounded-lg" }) : /* @__PURE__ */ jsx(Pill, { className: "h-10 w-10 text-gray-400" }) }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
          /* @__PURE__ */ jsx("h3", { className: "font-semibold text-gray-900 dark:text-white", children: med.name }),
          med.category && /* @__PURE__ */ jsx("p", { className: "text-xs text-indigo-600", children: med.category }),
          med.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-gray-500 line-clamp-2", children: med.description }),
          med.requires_prescription && /* @__PURE__ */ jsx("p", { className: "mt-1 text-xs text-orange-600 font-medium", children: "Prescription required" }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex items-center justify-between", children: [
            /* @__PURE__ */ jsx("span", { className: "text-lg font-bold text-gray-900 dark:text-white", children: formatCurrency(med.price) }),
            /* @__PURE__ */ jsx(
              "button",
              {
                onClick: () => addToCart(med),
                disabled: med.stock_quantity <= 0,
                className: "rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
                children: med.stock_quantity > 0 ? "Add to Cart" : "Out of Stock"
              }
            )
          ] })
        ] })
      ] }, med.id)) })
    ] })
  ] });
}
export {
  PharmacyIndex as default
};
