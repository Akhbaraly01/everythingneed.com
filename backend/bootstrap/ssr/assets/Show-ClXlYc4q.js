import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { MapPin, Star, Leaf, Flame } from "lucide-react";
import { useState } from "react";
import "./api-Dp2ndEHF.js";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function RestaurantShow({ restaurant }) {
  var _a;
  const [selectedCategory, setSelectedCategory] = useState("All");
  const menuCategories = ["All", ...Array.from(new Set(((_a = restaurant.menu_items) == null ? void 0 : _a.map((item) => item.category).filter((c) => Boolean(c))) ?? []))];
  const filteredMenu = selectedCategory === "All" ? restaurant.menu_items ?? [] : (restaurant.menu_items ?? []).filter((item) => item.category === selectedCategory);
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: restaurant.name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/3", children: restaurant.image_url ? /* @__PURE__ */ jsx("img", { src: restaurant.image_url, alt: restaurant.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: "No image" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: restaurant.name }),
          /* @__PURE__ */ jsx("p", { className: "mt-1 text-lg text-indigo-600", children: restaurant.cuisine_type }),
          /* @__PURE__ */ jsxs("div", { className: "mt-3 flex items-center gap-4 text-sm text-gray-500", children: [
            /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
              restaurant.address,
              ", ",
              restaurant.city
            ] }),
            restaurant.rating != null && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
              /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }),
              restaurant.rating
            ] }),
            restaurant.phone && /* @__PURE__ */ jsx("span", { children: restaurant.phone })
          ] }),
          restaurant.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 dark:text-gray-400", children: restaurant.description })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Menu" }),
        menuCategories.length > 1 && /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: menuCategories.map((cat) => /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => setSelectedCategory(cat),
            className: `rounded-lg px-3 py-1.5 text-sm font-medium ${selectedCategory === cat ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"}`,
            children: cat
          },
          cat
        )) }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 divide-y dark:divide-gray-700", children: filteredMenu.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-gray-500", children: "No menu items available." }) : filteredMenu.map((item) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between py-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: item.name }),
              item.is_vegetarian && /* @__PURE__ */ jsx(Leaf, { className: "h-3 w-3 text-green-500" }),
              item.is_vegan && /* @__PURE__ */ jsx("span", { className: "text-xs text-green-600", children: "Vegan" }),
              item.spice_level != null && item.spice_level > 0 && /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5 text-xs text-orange-500", children: [
                /* @__PURE__ */ jsx(Flame, { className: "h-3 w-3" }),
                item.spice_level
              ] })
            ] }),
            item.description && /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm text-gray-500", children: item.description }),
            item.category && /* @__PURE__ */ jsx("span", { className: "mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-400", children: item.category })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "ml-4 text-right", children: [
            /* @__PURE__ */ jsxs("p", { className: "text-lg font-bold text-gray-900 dark:text-white", children: [
              "$",
              item.price.toFixed(2)
            ] }),
            !item.is_available && /* @__PURE__ */ jsx("p", { className: "text-xs text-red-500", children: "Unavailable" })
          ] })
        ] }, item.id)) })
      ] })
    ] })
  ] });
}
export {
  RestaurantShow as default
};
