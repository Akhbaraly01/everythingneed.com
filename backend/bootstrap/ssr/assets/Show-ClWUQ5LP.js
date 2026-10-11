import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head } from "@inertiajs/react";
import { Star, MapPin, Coffee, Car, Wifi, Users } from "lucide-react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import "react";
import "./api-Dp2ndEHF.js";
import "clsx";
import "sonner";
const amenityIcons = {
  wifi: Wifi,
  parking: Car,
  breakfast: Coffee
};
function HotelShow({ hotel }) {
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: hotel.name }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-8", children: [
      /* @__PURE__ */ jsx("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-6 lg:flex-row", children: [
        /* @__PURE__ */ jsx("div", { className: "aspect-video w-full overflow-hidden rounded-lg bg-gray-100 lg:w-1/2", children: hotel.image_url ? /* @__PURE__ */ jsx("img", { src: hotel.image_url, alt: hotel.name, className: "h-full w-full object-cover" }) : /* @__PURE__ */ jsx("div", { className: "flex h-full items-center justify-center text-gray-400", children: "No image" }) }),
        /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
          /* @__PURE__ */ jsx("h1", { className: "text-3xl font-bold text-gray-900 dark:text-white", children: hotel.name }),
          /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-2", children: [
            Array.from({ length: hotel.star_rating }).map((_, i) => /* @__PURE__ */ jsx(Star, { className: "h-4 w-4 fill-yellow-400 text-yellow-400" }, i)),
            /* @__PURE__ */ jsxs("span", { className: "text-sm text-gray-500", children: [
              "(",
              hotel.star_rating,
              " star)"
            ] })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex items-center gap-4 text-sm text-gray-500", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
            /* @__PURE__ */ jsx(MapPin, { className: "h-4 w-4" }),
            hotel.address,
            ", ",
            hotel.city,
            ", ",
            hotel.country
          ] }) }),
          hotel.phone && /* @__PURE__ */ jsx("p", { className: "mt-2 text-sm text-gray-500", children: hotel.phone }),
          hotel.email && /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: hotel.email }),
          hotel.description && /* @__PURE__ */ jsx("p", { className: "mt-4 text-gray-600 dark:text-gray-400", children: hotel.description }),
          hotel.amenities && hotel.amenities.length > 0 && /* @__PURE__ */ jsx("div", { className: "mt-4 flex flex-wrap gap-2", children: hotel.amenities.map((amenity) => {
            const Icon = amenityIcons[amenity.toLowerCase()];
            return /* @__PURE__ */ jsxs("span", { className: "inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 dark:bg-gray-700 dark:text-gray-300", children: [
              Icon && /* @__PURE__ */ jsx(Icon, { className: "h-3 w-3" }),
              amenity
            ] }, amenity);
          }) })
        ] })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h2", { className: "text-xl font-semibold text-gray-900 dark:text-white", children: "Available Rooms" }),
        /* @__PURE__ */ jsx("div", { className: "mt-6 space-y-4", children: !hotel.rooms || hotel.rooms.length === 0 ? /* @__PURE__ */ jsx("p", { className: "py-8 text-center text-gray-500", children: "No rooms available." }) : hotel.rooms.filter((r) => r.is_available).map((room) => /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between rounded-lg border border-gray-200 p-4 dark:border-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("h3", { className: "font-medium text-gray-900 dark:text-white", children: room.room_type }),
            /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center gap-4 text-sm text-gray-500", children: [
              /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1", children: [
                /* @__PURE__ */ jsx(Users, { className: "h-3 w-3" }),
                "Up to ",
                room.capacity,
                " guests"
              ] }),
              room.amenities && room.amenities.map((a) => /* @__PURE__ */ jsx("span", { className: "text-xs text-gray-400", children: a }, a))
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "text-right", children: [
            /* @__PURE__ */ jsx("p", { className: "text-xl font-bold text-gray-900 dark:text-white", children: formatCurrency(room.price_per_night) }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "per night" })
          ] })
        ] }, room.id)) })
      ] })
    ] })
  ] });
}
export {
  HotelShow as default
};
