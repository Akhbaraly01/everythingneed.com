import { jsxs, jsx } from "react/jsx-runtime";
import { useForm, usePage, Head, Link } from "@inertiajs/react";
import { A as AuthLayout } from "./AuthLayout-DeaGJlL3.js";
function ForgotPassword() {
  var _a;
  const { data, setData, post, processing, errors } = useForm({
    email: ""
  });
  const status = (_a = usePage().props.flash) == null ? void 0 : _a.status;
  const submit = (e) => {
    e.preventDefault();
    post("/forgot-password");
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Reset your password", children: [
    /* @__PURE__ */ jsx(Head, { title: "Forgot password" }),
    status && /* @__PURE__ */ jsx("div", { className: "mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-300", children: status }),
    /* @__PURE__ */ jsx("p", { className: "mb-4 text-sm text-gray-600 dark:text-gray-400", children: "Enter your email and we will send you a link to reset your password." }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Email address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "email",
            type: "email",
            value: data.email,
            onChange: (e) => setData("email", e.target.value),
            className: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            required: true,
            autoFocus: true
          }
        ),
        errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: processing,
          className: "flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50",
          children: processing ? "Sending..." : "Send reset link"
        }
      )
    ] }),
    /* @__PURE__ */ jsx("p", { className: "mt-6 text-center text-sm text-gray-600 dark:text-gray-400", children: /* @__PURE__ */ jsx(Link, { href: "/login", className: "font-medium text-indigo-600 hover:text-indigo-500", children: "Back to sign in" }) })
  ] });
}
export {
  ForgotPassword as default
};
