// Centralized route table. Each module owns its segment; this file just
// re-exports them so consumers can do: import { routes } from "@core/routes";
//
// Laravel mapping: equivalent to base prefixes in routes/web.php per module.
export const routes = {
  home: "/",
  auth: "/auth",
  account: {
    root: "/account",
    dashboard: "/account/dashboard",
    orders: "/account/orders",
    wishlist: "/account/wishlist",
    wallet: "/account/wallet",
    notifications: "/account/notifications",
    certificates: "/account/certificates",
    learning: "/account/learning",
  },
  vendors: {
    dashboard: "/vendor/dashboard",
    analytics: "/vendor/analytics",
    register: "/vendor/register",
  },
  products: { detail: (id: string) => `/product/${id}` },
  orders: "/orders",
  healthcare: {
    root: "/healthcare",
    book: "/healthcare/book",
    bookDoctor: (id: string) => `/healthcare/book/${id}`,
    tickets: "/healthcare/tickets",
    labs: "/healthcare/labs",
    specialty: (s: string) => `/healthcare/specialty/${s}`,
  },
  pharmacy: {
    root: "/pharmacy",
    checkout: "/pharmacy/checkout",
    order: (id: string) => `/pharmacy/order/${id}`,
  },
  needs: { request: "/needs/request", category: (slug: string) => `/needs/${slug}` },
  learn: { root: "/learn", course: (slug: string) => `/learn/course/${slug}` },
  experts: { root: "/experts", profile: (id: string) => `/experts/${id}` },
  deals: {
    root: "/deals",
    booking: "/deals/booking",
    tasks: "/deals/tasks",
    transportation: "/deals/transportation",
    hotels: "/deals/hotels",
    realEstate: "/deals/real-estate",
    jobs: "/deals/jobs",
    agriculture: "/deals/agriculture",
    food: "/deals/food",
  },
  buildingServices: "/building-services",
  admin: { root: "/admin", dashboard: "/admin/dashboard", category: "/admin/category" },
  support: {
    tickets: "/support/tickets",
    newTicket: "/support/tickets/new",
    ticket: (id: string) => `/support/tickets/${id}`,
  },
} as const;
