import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { Plus, MapPin, Check, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function AccountAddresses() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ label: "Home", street: "", city: "", state: "", postal_code: "", country: "US" });
  useEffect(() => {
    api.get("/api/addresses").then((res) => setAddresses(
      (res.data ?? []).map((a) => ({
        ...a,
        label: a.label || a.line1 || "Home",
        street: a.street || a.line1 || "",
        state: a.state || a.region || ""
      }))
    )).catch(() => setAddresses([])).finally(() => setLoading(false));
  }, []);
  const addAddress = async () => {
    try {
      const res = await api.post("/api/addresses", {
        line1: form.street,
        city: form.city,
        region: form.state,
        postal_code: form.postal_code,
        country: (form.country || "US").slice(0, 2).toUpperCase()
      });
      const saved = { ...res.data, label: form.label, street: form.street, state: form.state };
      setAddresses([...addresses, saved]);
      setShowForm(false);
      setForm({ label: "Home", street: "", city: "", state: "", postal_code: "", country: "US" });
    } catch {
    }
  };
  const deleteAddress = async (id) => {
    try {
      await api.del(`/api/addresses/${id}`);
      setAddresses(addresses.filter((a) => a.id !== id));
    } catch {
    }
  };
  const setDefault = async (id) => {
    try {
      await api.put(`/api/addresses/${id}/default`);
      setAddresses(addresses.map((a) => ({ ...a, is_default: a.id === id })));
    } catch {
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { title: "My Addresses", children: [
    /* @__PURE__ */ jsx(Head, { title: "My Addresses" }),
    /* @__PURE__ */ jsxs("div", { className: "max-w-2xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "My Addresses" }),
        /* @__PURE__ */ jsxs("button", { onClick: () => setShowForm(!showForm), className: "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: [
          /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
          " Add Address"
        ] })
      ] }),
      showForm && /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "New Address" }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 space-y-3", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Label (Home, Work)",
              value: form.label,
              onChange: (e) => setForm({ ...form, label: e.target.value }),
              className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            }
          ),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              placeholder: "Street address",
              value: form.street,
              onChange: (e) => setForm({ ...form, street: e.target.value }),
              className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            }
          ),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "City",
                value: form.city,
                onChange: (e) => setForm({ ...form, city: e.target.value }),
                className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "State",
                value: form.state,
                onChange: (e) => setForm({ ...form, state: e.target.value }),
                className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-3", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Postal code",
                value: form.postal_code,
                onChange: (e) => setForm({ ...form, postal_code: e.target.value }),
                className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                placeholder: "Country",
                value: form.country,
                onChange: (e) => setForm({ ...form, country: e.target.value }),
                className: "block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-4 flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: addAddress, className: "rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500", children: "Save" }),
          /* @__PURE__ */ jsx("button", { onClick: () => setShowForm(false), className: "rounded-lg border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50", children: "Cancel" })
        ] })
      ] }),
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : addresses.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(MapPin, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsx("h3", { className: "mt-4 text-lg font-medium text-gray-900 dark:text-white", children: "No addresses" }),
        /* @__PURE__ */ jsx("p", { className: "mt-2 text-gray-500", children: "Add a delivery address to get started." })
      ] }) : /* @__PURE__ */ jsx("div", { className: "space-y-3", children: addresses.map((a) => /* @__PURE__ */ jsxs("div", { className: `flex items-center justify-between rounded-lg bg-white p-4 shadow dark:bg-gray-800 ${a.is_default ? "ring-2 ring-indigo-500" : ""}`, children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold text-gray-900 dark:text-white", children: a.label }),
            a.is_default && /* @__PURE__ */ jsx("span", { className: "rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700", children: "Default" })
          ] }),
          /* @__PURE__ */ jsxs("p", { className: "text-sm text-gray-500", children: [
            a.street,
            ", ",
            a.city,
            ", ",
            a.state,
            " ",
            a.postal_code
          ] }),
          /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: a.country })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          !a.is_default && /* @__PURE__ */ jsx("button", { onClick: () => setDefault(a.id), className: "rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-indigo-600", title: "Set as default", children: /* @__PURE__ */ jsx(Check, { className: "h-4 w-4" }) }),
          /* @__PURE__ */ jsx("button", { onClick: () => deleteAddress(a.id), className: "rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600", title: "Delete", children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" }) })
        ] })
      ] }, a.id)) })
    ] })
  ] });
}
export {
  AccountAddresses as default
};
