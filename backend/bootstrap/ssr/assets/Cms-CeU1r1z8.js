import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { Plus, FileText, Newspaper, Image, Megaphone, Trash2 } from "lucide-react";
import { useState, useCallback, useEffect } from "react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
const TABS = [
  { key: "pages", label: "Pages", icon: FileText },
  { key: "blog", label: "Blog", icon: Newspaper },
  { key: "banners", label: "Banners", icon: Image },
  { key: "announcements", label: "Announcements", icon: Megaphone }
];
const ENDPOINT = {
  pages: "/api/admin/cms/pages",
  blog: "/api/admin/cms/blog",
  banners: "/api/admin/cms/banners",
  announcements: "/api/admin/cms/announcements"
};
function AdminCms() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("pages");
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    title: "",
    content: "",
    status: "draft",
    image_url: "",
    link_url: "",
    sort_order: 0,
    priority: "medium"
  });
  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    api.get(ENDPOINT[tab]).then((res) => setRows(Array.isArray(res.data) ? res.data : [])).catch(() => {
      setRows([]);
      setError("Failed to load content");
    }).finally(() => setLoading(false));
  }, [tab]);
  useEffect(() => {
    load();
  }, [load]);
  const create = async () => {
    if (!form.title.trim()) return;
    const payload = { title: form.title.trim() };
    if (tab === "pages" || tab === "blog") {
      payload.content = form.content;
      payload.status = form.status;
    } else if (tab === "banners") {
      payload.position = "homepage";
      payload.image_url = form.image_url || null;
      payload.link_url = form.link_url || null;
      payload.sort_order = Number(form.sort_order) || 0;
      payload.is_active = true;
    } else {
      payload.content = form.content;
      payload.priority = form.priority;
      payload.is_active = true;
    }
    try {
      await api.post(ENDPOINT[tab], payload);
      setShowCreate(false);
      setForm({ title: "", content: "", status: "draft", image_url: "", link_url: "", sort_order: 0, priority: "medium" });
      load();
    } catch {
      setError("Create failed");
    }
  };
  const [uploading, setUploading] = useState(false);
  const uploadBannerImage = async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be 10MB or smaller");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await api.post("/api/upload", fd);
      setForm((f) => ({ ...f, image_url: res.data.url }));
    } catch (e) {
      setError(errorMessage(e, "Upload failed"));
    } finally {
      setUploading(false);
    }
  };
  const toggleStatus = async (row) => {
    try {
      if (tab === "pages" || tab === "blog") {
        await api.put(`${ENDPOINT[tab]}/${row.id}`, {
          status: row.status === "published" ? "draft" : "published"
        });
      } else if (tab === "banners") {
        await api.put(`${ENDPOINT[tab]}/${row.id}`, { is_active: !row.is_active });
      } else {
        await api.put(`${ENDPOINT[tab]}/${row.id}`, { is_active: !row.is_active });
      }
      load();
    } catch {
      setError("Update failed");
    }
  };
  const remove = async (id) => {
    try {
      await api.del(`${ENDPOINT[tab]}/${id}`);
      load();
    } catch {
      setError("Delete failed");
    }
  };
  const statusLabel = (row) => {
    if (tab === "pages" || tab === "blog") return row.status || "draft";
    return row.is_active ? "active" : "inactive";
  };
  const isPublished = (row) => tab === "pages" || tab === "blog" ? row.status === "published" : Boolean(row.is_active);
  return /* @__PURE__ */ jsxs(AppLayout, { title: "Content Manager", children: [
    /* @__PURE__ */ jsx(Head, { title: "Content Manager" }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: "Content Manager" }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: () => setShowCreate(true),
            className: "inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "h-4 w-4" }),
              " New ",
              tab.replace(/s$/, "")
            ]
          }
        )
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: TABS.map(({ key, label, icon: Icon }) => /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => setTab(key),
          className: `inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium ${tab === key ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200"}`,
          children: [
            /* @__PURE__ */ jsx(Icon, { className: "h-4 w-4" }),
            " ",
            label
          ]
        },
        key
      )) }),
      error ? /* @__PURE__ */ jsx("p", { className: "text-sm text-red-600", children: error }) : null,
      showCreate ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-4 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("div", { className: "grid gap-3 md:grid-cols-2", children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
              placeholder: "Title",
              value: form.title,
              onChange: (e) => setForm({ ...form, title: e.target.value })
            }
          ),
          (tab === "pages" || tab === "blog") && /* @__PURE__ */ jsxs(
            "select",
            {
              className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
              value: form.status,
              onChange: (e) => setForm({ ...form, status: e.target.value }),
              children: [
                /* @__PURE__ */ jsx("option", { value: "draft", children: "Draft" }),
                /* @__PURE__ */ jsx("option", { value: "published", children: "Published" })
              ]
            }
          ),
          tab === "banners" && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
                placeholder: "Image URL",
                value: form.image_url,
                onChange: (e) => setForm({ ...form, image_url: e.target.value })
              }
            ),
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3 md:col-span-2", children: [
              /* @__PURE__ */ jsxs("label", { className: "inline-flex cursor-pointer items-center gap-2 rounded border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800", children: [
                /* @__PURE__ */ jsx(Image, { className: "h-4 w-4" }),
                uploading ? "Uploading..." : "Upload image",
                /* @__PURE__ */ jsx(
                  "input",
                  {
                    type: "file",
                    accept: "image/*",
                    className: "hidden",
                    disabled: uploading,
                    onChange: (e) => {
                      var _a;
                      const file = (_a = e.target.files) == null ? void 0 : _a[0];
                      if (file) void uploadBannerImage(file);
                      e.target.value = "";
                    }
                  }
                )
              ] }),
              form.image_url && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx(
                  "img",
                  {
                    src: form.image_url,
                    alt: "Banner preview",
                    className: "h-10 w-20 rounded border border-gray-200 object-cover dark:border-gray-700"
                  }
                ),
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    onClick: () => setForm({ ...form, image_url: "" }),
                    className: "rounded p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20",
                    "aria-label": "Remove image",
                    children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
                  }
                )
              ] })
            ] }),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
                placeholder: "Link URL",
                value: form.link_url,
                onChange: (e) => setForm({ ...form, link_url: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
                placeholder: "Sort order",
                value: form.sort_order,
                onChange: (e) => setForm({ ...form, sort_order: Number(e.target.value) })
              }
            )
          ] }),
          tab === "announcements" && /* @__PURE__ */ jsxs(
            "select",
            {
              className: "rounded border px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-900",
              value: form.priority,
              onChange: (e) => setForm({ ...form, priority: e.target.value }),
              children: [
                /* @__PURE__ */ jsx("option", { value: "low", children: "Low" }),
                /* @__PURE__ */ jsx("option", { value: "medium", children: "Medium" }),
                /* @__PURE__ */ jsx("option", { value: "high", children: "High" })
              ]
            }
          ),
          (tab === "pages" || tab === "blog" || tab === "announcements") && /* @__PURE__ */ jsx(
            "textarea",
            {
              className: "rounded border px-3 py-2 text-sm md:col-span-2 dark:border-gray-600 dark:bg-gray-900",
              placeholder: "Content",
              rows: 3,
              value: form.content,
              onChange: (e) => setForm({ ...form, content: e.target.value })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex gap-2", children: [
          /* @__PURE__ */ jsx("button", { onClick: create, className: "rounded bg-indigo-600 px-4 py-2 text-sm text-white", children: "Create" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => setShowCreate(false),
              className: "rounded bg-gray-200 px-4 py-2 text-sm text-gray-700",
              children: "Cancel"
            }
          )
        ] })
      ] }) : null,
      loading ? /* @__PURE__ */ jsx("p", { className: "text-gray-500", children: "Loading..." }) : rows.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-12 text-center shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx(FileText, { className: "mx-auto h-12 w-12 text-gray-400" }),
        /* @__PURE__ */ jsxs("p", { className: "mt-4 text-gray-500", children: [
          "No ",
          tab,
          " found"
        ] })
      ] }) : /* @__PURE__ */ jsx("div", { className: "overflow-x-auto rounded-lg bg-white shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("table", { className: "w-full text-left text-sm", children: [
        /* @__PURE__ */ jsx("thead", { className: "border-b bg-gray-50 dark:border-gray-700 dark:bg-gray-700", children: /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Title" }),
          tab !== "banners" && tab !== "announcements" && /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Slug" }),
          tab === "banners" && /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Link" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Status" }),
          /* @__PURE__ */ jsx("th", { className: "px-4 py-3", children: "Actions" })
        ] }) }),
        /* @__PURE__ */ jsx("tbody", { className: "divide-y dark:divide-gray-700", children: rows.map((p) => /* @__PURE__ */ jsxs("tr", { children: [
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3 font-medium text-gray-900 dark:text-white", children: p.title }),
          tab !== "banners" && tab !== "announcements" && /* @__PURE__ */ jsxs("td", { className: "px-4 py-3 font-mono text-xs text-gray-500", children: [
            "/",
            p.slug
          ] }),
          tab === "banners" && /* @__PURE__ */ jsx("td", { className: "px-4 py-3 text-xs text-gray-500", children: p.link_url || "—" }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => toggleStatus(p),
              className: `rounded-full px-2 py-0.5 text-xs font-medium ${isPublished(p) ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`,
              children: statusLabel(p)
            }
          ) }),
          /* @__PURE__ */ jsx("td", { className: "px-4 py-3", children: /* @__PURE__ */ jsx(
            "button",
            {
              onClick: () => remove(p.id),
              className: "text-red-500 hover:text-red-700",
              "aria-label": "Delete",
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-4 w-4" })
            }
          ) })
        ] }, p.id)) })
      ] }) })
    ] })
  ] });
}
export {
  AdminCms as default
};
