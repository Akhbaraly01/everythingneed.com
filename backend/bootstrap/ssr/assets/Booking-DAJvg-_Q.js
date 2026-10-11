import { jsxs, jsx } from "react/jsx-runtime";
import { A as AppLayout } from "./AppLayout-cqhHu9rN.js";
import { usePage, Head, Link, router } from "@inertiajs/react";
import { a as api, e as errorMessage } from "./api-Dp2ndEHF.js";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { ArrowLeft, Check } from "lucide-react";
import { useState } from "react";
import "clsx";
import "sonner";
function HotelBooking({ hotel, rooms }) {
  const { auth } = usePage().props;
  const [selectedRoom, setSelectedRoom] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(2);
  const [specialRequests, setSpecialRequests] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const selectedRoomData = rooms.find((r) => r.id === selectedRoom);
  const nights = checkIn && checkOut ? Math.max(1, Math.ceil((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 864e5)) : 0;
  const total = selectedRoomData ? selectedRoomData.price_per_night * nights : 0;
  const handleReserve = async () => {
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    if (!selectedRoom || !checkIn || !checkOut) return;
    setSubmitting(true);
    try {
      await api.post(`/api/hotels/${hotel.id}/reserve`, {
        room_id: selectedRoom,
        check_in_date: checkIn,
        check_out_date: checkOut,
        guests,
        special_requests: specialRequests || void 0
      });
      router.visit("/hotels/reservations");
    } catch (e) {
      alert(errorMessage(e, "Failed to reserve"));
    } finally {
      setSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs(AppLayout, { children: [
    /* @__PURE__ */ jsx(Head, { title: `Book ${hotel.name}` }),
    /* @__PURE__ */ jsxs("div", { className: "space-y-6 max-w-3xl", children: [
      /* @__PURE__ */ jsxs(Link, { href: `/hotels/${hotel.id}`, className: "inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700", children: [
        /* @__PURE__ */ jsx(ArrowLeft, { className: "h-4 w-4" }),
        " Back to hotel"
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "rounded-lg bg-white p-6 shadow dark:bg-gray-800", children: [
        /* @__PURE__ */ jsxs("h1", { className: "text-2xl font-bold text-gray-900 dark:text-white", children: [
          "Reserve at ",
          hotel.name
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500", children: hotel.city }),
        /* @__PURE__ */ jsxs("div", { className: "mt-6 space-y-4", children: [
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Select Room *" }),
            /* @__PURE__ */ jsx("div", { className: "mt-2 space-y-2", children: rooms.filter((r) => r.is_available).map((room) => /* @__PURE__ */ jsxs("label", { className: `flex cursor-pointer items-center justify-between rounded-lg border p-3 ${selectedRoom === room.id ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20" : "border-gray-200 dark:border-gray-700"}`, children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-3", children: [
                /* @__PURE__ */ jsx("input", { type: "radio", name: "room", value: room.id, checked: selectedRoom === room.id, onChange: () => setSelectedRoom(room.id), className: "text-indigo-600" }),
                /* @__PURE__ */ jsxs("div", { children: [
                  /* @__PURE__ */ jsx("p", { className: "font-medium text-gray-900 dark:text-white", children: room.room_type }),
                  /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
                    "Up to ",
                    room.capacity,
                    " guests"
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxs("p", { className: "font-semibold text-gray-900 dark:text-white", children: [
                formatCurrency(room.price_per_night),
                "/night"
              ] })
            ] }, room.id)) })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-2 gap-4", children: [
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Check-in *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: checkIn,
                  onChange: (e) => setCheckIn(e.target.value),
                  min: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                  className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                }
              )
            ] }),
            /* @__PURE__ */ jsxs("div", { children: [
              /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Check-out *" }),
              /* @__PURE__ */ jsx(
                "input",
                {
                  type: "date",
                  value: checkOut,
                  onChange: (e) => setCheckOut(e.target.value),
                  min: checkIn || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
                  className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Guests" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "number",
                min: 1,
                max: 10,
                value: guests,
                onChange: (e) => setGuests(parseInt(e.target.value) || 1),
                className: "mt-1 block w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 dark:text-gray-300", children: "Special Requests" }),
            /* @__PURE__ */ jsx(
              "textarea",
              {
                value: specialRequests,
                onChange: (e) => setSpecialRequests(e.target.value),
                rows: 2,
                className: "mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-indigo-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700"
              }
            )
          ] })
        ] }),
        nights > 0 && selectedRoomData && /* @__PURE__ */ jsxs("div", { className: "mt-6 rounded-lg bg-gray-50 p-4 dark:bg-gray-700", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex justify-between text-sm", children: [
            /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Room" }),
            /* @__PURE__ */ jsx("span", { children: selectedRoomData.room_type })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex justify-between text-sm", children: /* @__PURE__ */ jsxs("span", { className: "text-gray-500", children: [
            formatCurrency(selectedRoomData.price_per_night),
            " x ",
            nights,
            " nights"
          ] }) }),
          /* @__PURE__ */ jsxs("div", { className: "mt-2 flex justify-between text-lg font-bold", children: [
            /* @__PURE__ */ jsx("span", { children: "Total" }),
            /* @__PURE__ */ jsx("span", { children: formatCurrency(total) })
          ] })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleReserve,
            disabled: submitting || !selectedRoom || !checkIn || !checkOut || nights <= 0,
            className: "mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-lg font-semibold text-white hover:bg-indigo-500 disabled:opacity-50",
            children: [
              /* @__PURE__ */ jsx(Check, { className: "h-5 w-5" }),
              " ",
              submitting ? "Reserving..." : "Confirm Reservation"
            ]
          }
        )
      ] })
    ] })
  ] });
}
export {
  HotelBooking as default
};
