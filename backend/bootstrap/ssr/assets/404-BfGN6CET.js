import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, Link } from "@inertiajs/react";
import "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "lucide-react";
import "clsx";
import "sonner";
function NotFound() {
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Page not found", children: [
    /* @__PURE__ */ jsx(Head, { title: "Page not found" }),
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-[60vh] flex-col items-center justify-center px-4 text-center", children: [
      /* @__PURE__ */ jsx("p", { className: "text-6xl font-bold text-muted-foreground", children: "404" }),
      /* @__PURE__ */ jsx("h1", { className: "mt-4 text-xl font-semibold", children: "Page not found" }),
      /* @__PURE__ */ jsx("p", { className: "mt-2 max-w-md text-sm text-muted-foreground", children: "The page you are looking for does not exist or may have been moved." }),
      /* @__PURE__ */ jsxs("div", { className: "mt-6 flex flex-wrap justify-center gap-2", children: [
        /* @__PURE__ */ jsx(Link, { href: "/", className: "rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground", children: "Go home" }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "rounded-md border px-4 py-2 text-sm", children: "Browse products" }),
        /* @__PURE__ */ jsx(Link, { href: "/help", className: "rounded-md border px-4 py-2 text-sm", children: "Help" })
      ] })
    ] })
  ] });
}
export {
  NotFound as default
};
