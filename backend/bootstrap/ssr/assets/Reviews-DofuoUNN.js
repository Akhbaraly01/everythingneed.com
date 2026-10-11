import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { Star, Trash2 } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api.get("/api/reviews/mine").then((res) => setReviews(res.data)).catch(() => setReviews([])).finally(() => setLoading(false));
  }, []);
  const handleDelete = async (id) => {
    if (!confirm("Delete this review?")) return;
    try {
      await api.del(`/api/reviews/${id}`);
      setReviews((prev) => prev.filter((r) => r.id !== id));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Reviews", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Reviews" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-6 w-6 text-yellow-500" }),
        " My Reviews"
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : reviews.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Star, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-500", children: "You haven't written any reviews yet" })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: reviews.map((r) => /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex justify-between", children: [
          /* @__PURE__ */ jsx("div", { className: "flex text-yellow-400", children: Array.from({ length: 5 }).map((_, i) => /* @__PURE__ */ jsx(Star, { className: `h-4 w-4 ${i < r.rating ? "fill-yellow-400" : ""}` }, i)) }),
          /* @__PURE__ */ jsx("button", { onClick: () => handleDelete(r.id), className: "text-red-500 hover:text-red-700", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] }),
        r.title && /* @__PURE__ */ jsx("p", { className: "font-semibold mt-2 dark:text-white", children: r.title }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-600 dark:text-gray-400 mt-1", children: r.comment }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-400 mt-2", children: [
          r.reviewable_type,
          " • ",
          new Date(r.created_at).toLocaleDateString()
        ] })
      ] }, r.id)) })
    ] })
  ] });
}
export {
  AccountReviews as default
};
