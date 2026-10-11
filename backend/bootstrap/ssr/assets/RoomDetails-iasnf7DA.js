import { jsx, jsxs } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { Head, router } from "@inertiajs/react";
import { a as api } from "./api-Dp2ndEHF.js";
import { useState, useEffect } from "react";
import { DollarSign, Bed, Maximize, ArrowRight } from "lucide-react";
import "./PushNotificationPrompt-DvDsnr4H.js";
import "clsx";
import "sonner";
function RoomDetails({ hotel_id, room_id }) {
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (hotel_id && room_id) {
      api.get(`/api/hotels/${hotel_id}/rooms/${room_id}`).then((res) => {
        setHotel(res.data.hotel);
        setRoom(res.data.room);
      }).catch(() => {
      }).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [hotel_id, room_id]);
  if (loading) return /* @__PURE__ */ jsx(AppLayout, { title: "Room Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-gray-500", children: "Loading..." }) });
  if (!room || !hotel) return /* @__PURE__ */ jsx(AppLayout, { title: "Room Details", children: /* @__PURE__ */ jsx("p", { className: "p-12 text-center text-red-500", children: "Room not found" }) });
  return /* @__PURE__ */ jsxs(AppLayout, { title: room.room_type, children: [
    /* @__PURE__ */ jsx(Head, { title: `${room.room_type} - ${hotel.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "mx-auto max-w-3xl space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: room.room_type }),
        /* @__PURE__ */ jsxs("p", { className: "text-gray-500", children: [
          hotel.name,
          " • ",
          hotel.city,
          " • ",
          "★".repeat(hotel.star_rating)
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800 space-y-4", children: [
        /* @__PURE__ */ jsx("h2", { className: "font-semibold text-gray-900 dark:text-white", children: "Room Details" }),
        /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 gap-4 text-center", children: [
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-4 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx(DollarSign, { className: "mx-auto h-6 w-6 text-green-600" }),
            /* @__PURE__ */ jsxs("p", { className: "mt-2 text-lg font-bold text-gray-900 dark:text-white", children: [
              "$",
              room.price_per_night
            ] }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "per night" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-4 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx(Bed, { className: "mx-auto h-6 w-6 text-blue-600" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-bold text-gray-900 dark:text-white", children: room.capacity }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "guests" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "rounded bg-gray-50 p-4 dark:bg-gray-700", children: [
            /* @__PURE__ */ jsx(Maximize, { className: "mx-auto h-6 w-6 text-purple-600" }),
            /* @__PURE__ */ jsx("p", { className: "mt-2 text-lg font-bold text-gray-900 dark:text-white", children: room.is_available ? "Available" : "Booked" }),
            /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500", children: "status" })
          ] })
        ] }),
        room.amenities && room.amenities.length > 0 && /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h3", { className: "font-medium text-gray-900 dark:text-white mb-2", children: "Amenities" }),
          /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-2", children: room.amenities.map((a, i) => /* @__PURE__ */ jsx("span", { className: "rounded-full bg-blue-50 px-3 py-1 text-xs text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", children: a }, i)) })
        ] })
      ] }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => router.visit(`/hotels/${hotel.id}/book?room=${room.id}`),
          disabled: !room.is_available,
          className: "w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2",
          children: [
            room.is_available ? "Book This Room" : "Unavailable",
            " ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] })
  ] });
}
export {
  RoomDetails as default
};
