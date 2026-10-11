import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function ReviewsIndex() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState(0);
  useEffect(() => {
    const params = ratingFilter ? `?rating=${ratingFilter}` : "";
    api.get(`/api/reviews${params}`).then((res) => setReviews(res.data)).catch(() => setReviews([])).finally(() => setLoading(false));
  }, [ratingFilter]);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Reviews", children: [
    /* @__PURE__ */ jsx(Head, { title: "Reviews" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Reviews" }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
        /* @__PURE__ */ jsx("button", { onClick: () => setRatingFilter(0), className: `rounded-full px-3 py-1 text-sm ${!ratingFilter ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: "All" }),
        [5, 4, 3, 2, 1].map((r) => /* @__PURE__ */ jsxs("button", { onClick: () => setRatingFilter(r), className: `flex items-center gap-1 rounded-full px-3 py-1 text-sm ${ratingFilter === r ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700"}`, children: [
          r,
          " ",
          /* @__PURE__ */ jsx(Star, { className: "h-3 w-3" })
        ] }, r))
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : reviews.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Star, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "No reviews found" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-4", children: reviews.map((r) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: r.user_name }),
            /* @__PURE__ */ jsx("div", { className: "flex items-center gap-1", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(Star, { className: `h-3 w-3 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}` }, i)) })
          ] }),
          r.entity_type && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-gray-100 px-2 py-0.5 text-xs dark:bg-gray-700", children: r.entity_type })
        ] }),
        r.comment && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-600 dark:text-gray-400", children: r.comment })
      ] }, r.id)) })
    ] })
  ] });
}
export {
  ReviewsIndex as default
};
