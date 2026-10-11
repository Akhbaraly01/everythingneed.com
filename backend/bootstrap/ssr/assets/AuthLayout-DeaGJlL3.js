import { jsxs, jsx } from "react/jsx-runtime";
import { Link } from "@inertiajs/react";
function AuthLayout({ children, title, description }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex min-h-screen flex-col bg-background", children: [
    /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-4 py-4", children: [
      /* @__PURE__ */ jsx(Link, { href: "/dashboard", className: "inline-flex items-center gap-2", children: /* @__PURE__ */ jsx("span", { className: "bg-gradient-to-r from-primary to-secondary bg-clip-text text-2xl font-bold text-transparent", children: title ?? "everythingneed.com" }) }),
      description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-center text-sm text-muted-foreground", children: description })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 items-center justify-center px-4 py-8", children: /* @__PURE__ */ jsx("div", { className: "w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg", children }) })
  ] });
}
export {
  AuthLayout as A
};
