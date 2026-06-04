// Centralized route table. Each module owns its segment; this file just
// re-exports them so consumers can do: import { routes } from "@core/routes";
export const routes = {
  home: "/",
  auth: "/auth",
  account: "/account",
  vendors: "/vendors",
  products: "/products",
  orders: "/orders",
  wallet: "/account/wallet",
  healthcare: {
    root: "/healthcare",
    book: "/healthcare/book",
    tickets: "/healthcare/tickets",
    labs: "/healthcare/labs",
  },
  food: "/deals/food",
  rides: "/deals/transportation",
  hotels: "/deals/hotels",
  realEstate: "/deals/real-estate",
  jobs: "/deals/jobs",
  deals: "/deals",
  learn: "/learn",
  experts: "/experts",
  admin: "/admin",
  support: "/support/tickets",
} as const;
