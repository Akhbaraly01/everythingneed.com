import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { Star, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function ReviewCreate() {
  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const [form, setForm] = useState({ rating: 5, title: "", comment: "", reviewable_type: params.get("type") || "product", reviewable_id: params.get("id") || "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.reviewable_id) {
      setError("Missing target ID");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api.post("/api/reviews", form);
      router.visit(`/reviews`);
    } catch (err) {
      setError(errorMessage(err, "Failed to submit review"));
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Write a Review", children: [
    /* @__PURE__ */ jsx(Head, { title: "Write a Review" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Write a Review" }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-2 dark:text-gray-300", children: "Rating" }),
          /* @__PURE__ */ jsx("div", { className: "flex gap-1", children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ jsx("button", { type: "button", onClick: () => setForm({ ...form, rating: n }), className: `p-1 ${n <= form.rating ? "text-yellow-400" : "text-gray-300"}`, children: /* @__PURE__ */ jsx(Star, { className: `h-8 w-8 ${n <= form.rating ? "fill-yellow-400" : ""}` }) }, n)) })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Title" }),
          /* @__PURE__ */ jsx("input", { value: form.title, onChange: (e) => setForm({ ...form, title: e.target.value }), placeholder: "Summary of your experience", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Comment" }),
          /* @__PURE__ */ jsx("textarea", { required: true, value: form.comment, onChange: (e) => setForm({ ...form, comment: e.target.value }), rows: 4, placeholder: "Share your experience...", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Submitting..." : "Submit Review",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  ReviewCreate as default
};
