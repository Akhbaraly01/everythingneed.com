import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { TestTube, FileText, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function LabBooking({ test_id }) {
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    preferred_date: "",
    preferred_time: "",
    notes: ""
  });
  useEffect(() => {
    if (test_id) {
      api.get(`/api/health/labs/${test_id}`).then((res) => setTest(res.data)).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [test_id]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post("/api/health/labs/book", {
        test_id,
        ...form
      });
      router.visit(`/healthcare/lab-confirmation?id=${res.data.id}`);
    } catch {
      setSubmitting(false);
    }
  };
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Book Lab Test", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!test) return /* @__PURE__ */ jsx(AppLayout, { title: "Book Lab Test", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Test not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: `Book ${test.name}`, children: [
    /* @__PURE__ */ jsx(Head, { title: `Book ${test.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 mb-4", children: [
          /* @__PURE__ */ jsx(TestTube, { className: "h-6 w-6 text-blue-600" }),
          /* @__PURE__ */ jsx("h1", { className: "text-xl font-bold text-gray-900 dark:text-white", children: test.name })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 dark:text-gray-400 mb-4", children: test.description }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4 text-sm", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-3 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Price" }),
            /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900 dark:text-white", children: [
              "$",
              test.price
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-3 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Results In" }),
            /* @__PURE__ */ jsx("p", { className: "font-semibold text-gray-900 dark:text-white", children: test.result_time })
          ] })
        ] }),
        test.preparation_instructions && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded bg-yellow-50 p-4 dark:bg-yellow-900/20", children: [
          /* @__PURE__ */ jsxs("h3", { className: "font-medium text-yellow-800 dark:text-yellow-200 flex items-center gap-2", children: [
            /* @__PURE__ */ jsx(FileText, { className: "h-4 w-4" }),
            " Preparation Instructions"
          ] }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-yellow-700 dark:text-yellow-300", children: test.preparation_instructions })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Schedule Appointment" }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Preferred Date" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "date",
              required: true,
              value: form.preferred_date,
              onChange: (e) => setForm({ ...form, preferred_date: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Preferred Time" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "time",
              required: true,
              value: form.preferred_time,
              onChange: (e) => setForm({ ...form, preferred_time: e.target.value }),
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1", children: "Notes" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.notes,
              onChange: (e) => setForm({ ...form, notes: e.target.value }),
              rows: 3,
              className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700",
              placeholder: "Any special requirements..."
            }
          )
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "submit",
            disabled: submitting,
            className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2",
            children: [
              submitting ? "Booking..." : "Book Lab Test",
              " ",
              /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  LabBooking as default
};
