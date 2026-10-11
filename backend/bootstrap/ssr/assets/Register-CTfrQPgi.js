import { jsxs, jsx } from "react/jsx-runtime";
import { useForm, Head, Link } from "@inertiajs/react";
import { A as AuthLayout } from "./AuthLayout-DeaGJlL3.js";
function Register() {
  const { data, setData, post, processing, errors } = useForm({
    name: "",
    email: "",
    phone: "",
    password: "",
    password_confirmation: ""
  });
  const submit = (e) => {
    e.preventDefault();
    post("/register");
  };
  return /* @__PURE__ */ jsxs(AuthLayout, { title: "Create an account", children: [
    /* @__PURE__ */ jsx(Head, { title: "Register" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: submit, className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "name", className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Full name" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "name",
            type: "text",
            value: data.name,
            onChange: (e) => setData("name", e.target.value),
            className: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            required: true
          }
        ),
        errors.name && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.name })
      ] }),
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
            required: true
          }
        ),
        errors.email && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.email })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "phone", className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Phone number" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "phone",
            type: "tel",
            value: data.phone,
            onChange: (e) => setData("phone", e.target.value),
            className: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
          }
        ),
        errors.phone && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.phone })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "password",
            type: "password",
            value: data.password,
            onChange: (e) => setData("password", e.target.value),
            className: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            required: true
          }
        ),
        errors.password && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-red-600", children: errors.password })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password_confirmation", className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Confirm password" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "password_confirmation",
            type: "password",
            value: data.password_confirmation,
            onChange: (e) => setData("password_confirmation", e.target.value),
            className: "mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "submit",
          disabled: processing,
          className: "flex w-full justify-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50",
          children: processing ? "Creating account..." : "Create account"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "mt-6 text-center text-sm text-gray-600 dark:text-gray-400", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx(Link, { href: "/login", className: "font-medium text-indigo-600 hover:text-indigo-500", children: "Sign in" })
    ] })
  ] });
}
export {
  Register as default
};
