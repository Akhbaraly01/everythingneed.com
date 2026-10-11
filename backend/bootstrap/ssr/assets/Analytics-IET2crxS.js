import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Package, ShoppingCart, DollarSign, TrendingUp } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function VendorAnalytics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const num = (v) => Number(v ?? 0);
    const load = async () => {
      var _a, _b, _c, _d;
      try {
        const [earnings, ordersRes, productsRes] = await Promise.all([
          api.get("/api/vendor/earnings"),
          api.get("/api/vendor/orders?per_page=50"),
          api.get("/api/products?per_page=100")
        ]);
        const orders = ordersRes.data ?? [];
        const pending = orders.filter((o) => ["pending", "confirmed", "processing"].includes(String(o.status ?? ""))).length;
        setStats({
          total_products: Number(((_a = productsRes.meta) == null ? void 0 : _a.total) ?? ((_b = productsRes.data) == null ? void 0 : _b.length) ?? 0),
          total_orders: Number(((_c = ordersRes.meta) == null ? void 0 : _c.total) ?? orders.length),
          total_revenue: num((_d = earnings.data) == null ? void 0 : _d.total_earned),
          pending_orders: pending,
          recent_orders: orders.slice(0, 5).map((o) => ({
            id: String(o.id),
            reference: String(o.id).slice(0, 8),
            total: num(o.total ?? o.total_price ?? o.amount),
            status: String(o.status ?? "pending"),
            created_at: String(o.created_at ?? "")
          })),
          top_products: [...productsRes.data ?? []].sort((a, b) => num(b.rating) - num(a.rating)).slice(0, 5).map((p) => ({ id: String(p.id), name: p.name, sold: 0, revenue: 0 }))
        });
      } catch {
        setStats(null);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Vendor Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!stats) return /* @__PURE__ */ jsx(AppLayout, { title: "Vendor Analytics", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Failed to load" }) });
  const cards = [
    { label: "Products", value: stats.total_products, icon: Package, color: "text-blue-600" },
    { label: "Orders", value: stats.total_orders, icon: ShoppingCart, color: "text-green-600" },
    { label: "Revenue", value: formatCurrency(stats.total_revenue), icon: DollarSign, color: "text-yellow-600" },
    { label: "Pending Orders", value: stats.pending_orders, icon: TrendingUp, color: "text-orange-600" }
  ];
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Vendor Analytics", children: [
    /* @__PURE__ */ jsx(Head, { title: "Vendor Analytics" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Analytics" }),
      /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4", children: cards.map((c) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: c.label }),
        /* @__PURE__ */ jsx("p", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: c.value })
      ] }, c.label)) }),
      /* @__PURE__ */ jsxs("div", { className: "grid gap-6 lg:grid-cols-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Recent Orders" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: stats.recent_orders.map((o) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: o.reference }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(o.total) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs bg-gray-100 rounded px-2 py-0.5 dark:bg-gray-700", children: o.status })
          ] }, o.id)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
          /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Top Products" }),
          /* @__PURE__ */ jsx("div", { className: "mt-4 space-y-3", children: stats.top_products.length === 0 || stats.top_products.every((p) => p.sold === 0 && p.revenue === 0) ? /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Sales insights appear after your first orders." }) : stats.top_products.map((p) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-700 dark:text-gray-300", children: p.name }),
            /* @__PURE__ */ jsxs("span", { children: [
              p.sold,
              " sold"
            ] }),
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: formatCurrency(p.revenue) })
          ] }, p.id)) })
        ] })
      ] })
    ] })
  ] });
}
export {
  VendorAnalytics as default
};
