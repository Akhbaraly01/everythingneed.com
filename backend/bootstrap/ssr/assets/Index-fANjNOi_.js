import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { CreditCard, Check } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function SubscriptionsIndex() {
  const { auth } = usePage().props;
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(null);
  useEffect(() => {
    api.get("/api/plans").then((res) => setPlans(res.data)).catch(() => setPlans([])).finally(() => setLoading(false));
  }, []);
  const handleSubscribe = async (planId) => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    setSubscribing(planId);
    try {
      await api.post("/api/subscribe", { plan_id: planId });
      alert("Subscribed successfully!");
    } catch (e) {
      alert(errorMessage(e, "Failed"));
    }
    setSubscribing(null);
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Subscriptions", children: [
    /* @__PURE__ */ jsx(Head, { title: "Subscriptions" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Subscription Plans" }),
      /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: "Choose a plan that works for you" }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : plans.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(CreditCard, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No plans available" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3", children: plans.map((plan) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h3", { className: "text-lg font-bold text-gray-900 dark:text-white", children: plan.name }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: plan.description }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4", children: [
          /* @__PURE__ */ jsx("span", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: formatCurrency(plan.price) }),
          /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
            "/",
            plan.interval
          ] })
        ] }),
        /* @__PURE__ */ jsx("ul", { className: "mt-4 space-y-2", children: (plan.features ?? []).map((f, i) => /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400", children: [
          /* @__PURE__ */ jsx(Check, { className: "h-4 w-4 text-green-500" }),
          " ",
          f
        ] }, i)) }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => handleSubscribe(plan.id),
            disabled: subscribing === plan.id,
            className: "mt-6 w-full rounded-lg bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: subscribing === plan.id ? "Subscribing..." : "Subscribe"
          }
        )
      ] }, plan.id)) })
    ] })
  ] });
}
export {
  SubscriptionsIndex as default
};
