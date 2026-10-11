import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { useState } from "react";
import { Pill, FileUp, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function PrescriptionUpload() {
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a prescription file");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("prescription", file);
      fd.append("notes", notes);
      const res = await api.post("/api/pharmacy/prescriptions", fd);
      router.visit(`/pharmacy/orders/${res.data.id}`);
    } catch (err) {
      setError(errorMessage(err, "Upload failed"));
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Upload Prescription", children: [
    /* @__PURE__ */ jsx(Head, { title: "Upload Prescription" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "mx-auto max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Pill, { className: "h-6 w-6" }),
        " Upload Prescription"
      ] }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Upload your prescription to order prescription medicines" }),
      error && /* @__PURE__ */ jsx("div", { className: "rounded bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20", children: error }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsxs("div", { className: "rounded-lg border-2 border-dashed p-8 text-center dark:border-gray-600", children: [
          /* @__PURE__ */ jsx(FileUp, { className: "mx-auto h-10 w-10 text-gray-400" }),
          /* @__PURE__ */ jsx("input", { type: "file", accept: "image/*,.pdf", onChange: (e) => {
            var _a;
            return setFile(((_a = e.target.files) == null ? void 0 : _a[0]) || null);
          }, className: "mt-4 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100" }),
          file && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-green-600", children: file.name })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium mb-1 dark:text-gray-300", children: "Notes" }),
          /* @__PURE__ */ jsx("textarea", { value: notes, onChange: (e) => setNotes(e.target.value), rows: 3, placeholder: "Any additional notes for the pharmacist...", className: "w-full rounded-lg border px-3 py-2 dark:border-gray-600 dark:bg-gray-700" })
        ] })
      ] }),
      /* @__PURE__ */ jsxs("button", { type: "submit", disabled: submitting, className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2", children: [
        submitting ? "Uploading..." : "Upload Prescription",
        " ",
        /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
      ] })
    ] })
  ] });
}
export {
  PrescriptionUpload as default
};
