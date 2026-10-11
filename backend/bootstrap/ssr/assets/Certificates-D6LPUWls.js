import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { a as formatDateTime } from "./PushNotificationPrompt-DvDsnr4H.js";
import { Award, Download } from "lucide-react";
import { useState, useEffect } from "react";
import "clsx";
import "sonner";
function MyCertificates({ certificates: initialCertificates }) {
  const [certificates, setCertificates] = useState(initialCertificates ?? []);
  const [loading, setLoading] = useState(!initialCertificates);
  useEffect(() => {
    if (initialCertificates) return;
    api.get("/api/learn/my-certificates").then((res) => setCertificates(res.data ?? [])).catch(() => setCertificates([])).finally(() => setLoading(false));
  }, [initialCertificates]);
  const handleDownload = (certId) => {
    const card = document.getElementById(`certificate-${certId}`);
    if (!card) return;
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(
      `<html><head><title>Certificate</title></head><body>${card.outerHTML}</body></html>`
    );
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };
  if (loading) {
    return /* @__PURE__ */ jsxs(AppLayout, { title: "My Certificates", children: [
      /* @__PURE__ */ jsx(Head, { title: "My Certificates" }),
      /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." })
    ] });
  }
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Certificates", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Certificates" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Certificates" }),
      certificates.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(Award, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No certificates yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Complete courses and pass quizzes to earn certificates." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "grid gap-4 sm:grid-cols-2", children: certificates.map((cert) => {
        var _a;
        return /* @__PURE__ */ jsxs("div", { id: `certificate-${cert.id}`, className: "rounded-lg border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 shadow dark:from-indigo-900/20 dark:to-gray-800 dark:border-indigo-800", children: [
          /* @__PURE__ */ jsx(Award, { className: "h-10 w-10 text-indigo-600" }),
          /* @__PURE__ */ jsx("p", { className: "mt-3 font-bold text-gray-900 dark:text-white", children: ((_a = cert.course) == null ? void 0 : _a.title) ?? "Course" }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Certificate #",
            cert.certificate_number
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            "Issued: ",
            formatDateTime(cert.issued_at)
          ] }),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: () => handleDownload(cert.id),
              className: "mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-300 px-4 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100",
              children: [
                /* @__PURE__ */ jsx(Download, { className: "h-4 w-4" }),
                " Download"
              ]
            }
          )
        ] }, cert.id);
      }) })
    ] })
  ] });
}
export {
  MyCertificates as default
};
