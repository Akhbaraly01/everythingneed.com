import { jsxs, jsx } from "react/jsx-runtime";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link, usePage, router } from "@inertiajs/react";
import { M as MarketplaceLayout } from "./MarketplaceLayout-BjqzrNjx.js";
import { a as api, A as ApiError } from "./api-Dp2ndEHF.js";
import { ChevronLeft, ChevronRight, Star, TrendingUp, Percent, Sparkles, Gift, Zap, GraduationCap, HeartPulse, Pill, Users, Hotel, CheckSquare, MoreHorizontal, Headphones, Shield, ShoppingBag, Truck, Calendar, Dumbbell, Home, Shirt, Smartphone, Package, Heart, Wrench, Building, Tractor, HelpCircle, Search, X, ArrowUpDown, Briefcase, Stethoscope, ShoppingCart, ArrowRight, Clock } from "lucide-react";
import { f as formatCurrency } from "./PushNotificationPrompt-DvDsnr4H.js";
import { toast } from "sonner";
import { u as useRecentlyViewed } from "./useRecentlyViewed-CNoHSyHD.js";
import "../app2.js";
import "react-dom/client";
import "clsx";
const GRADIENTS$1 = [
  "from-orange-500 via-rose-500 to-red-500",
  "from-purple-500 via-pink-500 to-rose-500",
  "from-blue-500 via-indigo-500 to-purple-500",
  "from-emerald-500 via-teal-500 to-cyan-500",
  "from-amber-500 via-orange-500 to-red-500",
  "from-yellow-500 via-amber-500 to-orange-500"
];
const ICONS$1 = ["zap", "gift", "sparkles", "percent", "trending", "star"];
function CampaignIcon({ icon }) {
  const cls = "h-6 w-6 text-white";
  switch (icon) {
    case "zap":
      return /* @__PURE__ */ jsx(Zap, { className: cls });
    case "gift":
      return /* @__PURE__ */ jsx(Gift, { className: cls });
    case "sparkles":
      return /* @__PURE__ */ jsx(Sparkles, { className: cls });
    case "percent":
      return /* @__PURE__ */ jsx(Percent, { className: cls });
    case "trending":
      return /* @__PURE__ */ jsx(TrendingUp, { className: cls });
    case "star":
      return /* @__PURE__ */ jsx(Star, { className: cls });
  }
}
function BannerSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  useEffect(() => {
    let cancelled = false;
    api.get("/api/cms/banners/public").then((payload) => {
      if (cancelled) return;
      const rows = Array.isArray(payload == null ? void 0 : payload.data) ? payload.data : [];
      setCampaigns(
        rows.map((b, i) => ({
          id: b.id,
          title: b.title,
          subtitle: "",
          cta: "View",
          link: b.link_url || "/products",
          gradient: GRADIENTS$1[i % GRADIENTS$1.length],
          icon: ICONS$1[i % ICONS$1.length],
          image_url: b.image_url
        }))
      );
    }).catch(() => {
      if (!cancelled) setCampaigns([]);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    if (!isAutoPlaying || campaigns.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % campaigns.length);
    }, 5e3);
    return () => clearInterval(interval);
  }, [isAutoPlaying, campaigns.length]);
  if (campaigns.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "rounded-xl bg-gradient-to-r from-primary/90 to-primary p-4 text-primary-foreground", children: [
      /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Welcome to EverythingNeed" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs opacity-80", children: "Explore products, learning, healthcare and services." })
    ] });
  }
  const goNext = () => setCurrentIndex((prev) => (prev + 1) % campaigns.length);
  const goPrev = () => setCurrentIndex((prev) => (prev - 1 + campaigns.length) % campaigns.length);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "relative overflow-hidden rounded-xl",
      onMouseEnter: () => setIsAutoPlaying(false),
      onMouseLeave: () => setIsAutoPlaying(true),
      onTouchStart: () => setIsAutoPlaying(false),
      onTouchEnd: () => setIsAutoPlaying(true),
      children: [
        /* @__PURE__ */ jsx(
          "div",
          {
            className: "flex transition-transform duration-500 ease-out",
            style: { transform: `translateX(-${currentIndex * 100}%)` },
            children: campaigns.map((campaign) => /* @__PURE__ */ jsx(Link, { href: campaign.link, className: "min-w-full", children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: `relative h-24 md:h-28 overflow-hidden rounded-xl bg-gradient-to-r ${campaign.gradient} p-4`,
                children: [
                  campaign.image_url ? /* @__PURE__ */ jsx(
                    "img",
                    {
                      src: campaign.image_url,
                      alt: "",
                      className: "absolute inset-0 h-full w-full object-cover",
                      loading: "lazy"
                    }
                  ) : null,
                  /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 opacity-10", children: [
                    /* @__PURE__ */ jsx("div", { className: "absolute -top-4 -right-8 w-24 h-24 rounded-full bg-white/20" }),
                    /* @__PURE__ */ jsx("div", { className: "absolute -bottom-4 -left-8 w-32 h-32 rounded-full bg-white/10" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { className: "relative z-10 h-full flex items-center justify-between", children: [
                    /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
                      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 mb-1", children: [
                        /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-white/20 rounded-lg backdrop-blur-sm", children: /* @__PURE__ */ jsx(CampaignIcon, { icon: campaign.icon }) }),
                        /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-sm md:text-base line-clamp-1", children: campaign.title })
                      ] }),
                      campaign.subtitle ? /* @__PURE__ */ jsx("p", { className: "text-white/80 text-xs md:text-sm line-clamp-1 ml-10", children: campaign.subtitle }) : null
                    ] }),
                    /* @__PURE__ */ jsx("span", { className: "h-8 text-xs px-4 bg-white/20 hover:bg-white/30 text-white border-0 shrink-0 ml-2 inline-flex items-center rounded-md font-medium", children: campaign.cta || "View" })
                  ] })
                ]
              }
            ) }, campaign.id))
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: goPrev,
            "aria-label": "Previous banner",
            className: "absolute left-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center",
            children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: goNext,
            "aria-label": "Next banner",
            className: "absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 bg-black/30 hover:bg-black/50 text-white rounded-full flex items-center justify-center",
            children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
          }
        ),
        /* @__PURE__ */ jsx("div", { className: "absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1", children: campaigns.map((_, idx) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => setCurrentIndex(idx),
            "aria-label": `Go to banner ${idx + 1}`,
            className: `h-1.5 rounded-full transition-all ${idx === currentIndex ? "w-4 bg-white" : "w-1.5 bg-white/50"}`
          },
          idx
        )) })
      ]
    }
  );
}
const SECTION_CATEGORIES = [
  { name: "Learning", icon: GraduationCap, link: "/learn", gradient: "from-emerald-500 to-teal-500" },
  { name: "Healthcare", icon: HeartPulse, link: "/healthcare", gradient: "from-rose-500 to-pink-500" },
  { name: "Pharmacy", icon: Pill, link: "/pharmacy", gradient: "from-blue-500 to-cyan-500" },
  { name: "Needs", icon: Users, link: "/needs", gradient: "from-purple-500 to-fuchsia-500" },
  { name: "Hotels", icon: Hotel, link: "/hotels", gradient: "from-yellow-500 to-amber-500" },
  { name: "Jobs", icon: CheckSquare, link: "/jobs", gradient: "from-teal-500 to-emerald-500" },
  { name: "Tasks", icon: CheckSquare, link: "/tasks", gradient: "from-cyan-500 to-blue-500" }
];
function CategoryTile({ name, icon: Icon, link, gradient }) {
  return /* @__PURE__ */ jsxs(Link, { href: link, className: "group flex flex-col items-center gap-2", children: [
    /* @__PURE__ */ jsxs(
      "span",
      {
        className: `relative w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20`,
        children: [
          /* @__PURE__ */ jsx(
            "span",
            {
              className: `absolute inset-0 rounded-2xl bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-50 blur-xl transition-opacity duration-300`
            }
          ),
          /* @__PURE__ */ jsx(Icon, { className: "h-6 w-6 md:h-7 md:w-7 text-white relative z-10" })
        ]
      }
    ),
    /* @__PURE__ */ jsx("span", { className: "text-xs md:text-sm font-medium text-center text-foreground/80 group-hover:text-foreground transition-colors line-clamp-1", children: name })
  ] });
}
const ICONS = {
  smartphone: Smartphone,
  shirt: Shirt,
  home: Home,
  dumbbell: Dumbbell,
  calendar: Calendar,
  check: CheckSquare,
  hotel: Hotel,
  graduation: GraduationCap,
  health: HeartPulse,
  pill: Pill,
  users: Users,
  truck: Truck,
  bag: ShoppingBag,
  shield: Shield,
  headphones: Headphones
};
const GRADIENTS = [
  "from-blue-500 to-blue-600",
  "from-pink-500 to-rose-500",
  "from-amber-500 to-orange-500",
  "from-green-500 to-emerald-500",
  "from-cyan-500 to-blue-500",
  "from-teal-500 to-emerald-500",
  "from-yellow-500 to-amber-500",
  "from-purple-500 to-fuchsia-500"
];
function iconFor(name, fallback) {
  if (!name) return fallback;
  const key = name.toLowerCase();
  const hit = Object.entries(ICONS).find(([k]) => key.includes(k));
  return hit ? hit[1] : fallback;
}
function CategoryGrid({ categories = [] }) {
  const [showAll, setShowAll] = useState(false);
  const rootRef = useRef(null);
  useEffect(() => {
    if (!showAll) return;
    const onDown = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setShowAll(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") setShowAll(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [showAll]);
  const real = categories.slice(0, 15).map((c, i) => ({
    name: c.name,
    icon: iconFor(c.icon, ShoppingBag),
    link: c.slug ? `/products?category=${encodeURIComponent(c.slug)}` : "/products",
    gradient: GRADIENTS[i % GRADIENTS.length]
  }));
  const quick = real.length >= 7 ? real.slice(0, 7) : [...real, ...SECTION_CATEGORIES].slice(0, 7);
  const seen = /* @__PURE__ */ new Set();
  const all = [...real, ...SECTION_CATEGORIES].filter((c) => {
    const key = c.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, children: [
    /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-4 md:grid-cols-8 gap-3 md:gap-4", children: [
      quick.map((category) => /* @__PURE__ */ jsx(CategoryTile, { ...category }, category.name)),
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: () => setShowAll((v) => !v),
          "aria-expanded": showAll,
          className: "flex flex-col items-center gap-1.5 group cursor-pointer",
          children: [
            /* @__PURE__ */ jsx("span", { className: "w-12 h-12 md:w-14 md:h-14 rounded-xl bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-105 group-hover:shadow-lg", children: /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-5 w-5 md:h-6 md:w-6 text-white" }) }),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-center text-muted-foreground group-hover:text-foreground transition-colors", children: showAll ? "Less" : "More" })
          ]
        }
      )
    ] }),
    showAll && /* @__PURE__ */ jsxs("div", { className: "mt-4 rounded-xl border border-border bg-card p-4", children: [
      /* @__PURE__ */ jsx("h3", { className: "mb-3 text-sm font-semibold", children: "All Categories" }),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-4 md:grid-cols-6 gap-4 mt-6 overflow-y-auto", children: all.map((category) => /* @__PURE__ */ jsxs(
        Link,
        {
          href: category.link,
          onClick: () => setShowAll(false),
          className: "flex flex-col items-center gap-2 group",
          children: [
            /* @__PURE__ */ jsx(
              "span",
              {
                className: `w-14 h-14 rounded-xl bg-gradient-to-br ${category.gradient} flex items-center justify-center shadow-md transition-all group-hover:scale-105`,
                children: /* @__PURE__ */ jsx(category.icon, { className: "h-6 w-6 text-white" })
              }
            ),
            /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-center", children: category.name })
          ]
        },
        category.name
      )) })
    ] })
  ] });
}
const fallbackTypes = [
  { id: "product", title: "Request Product", subtitle: "Can't find a product? Let us source it", icon: Package, gradient: "from-blue-500 to-indigo-600", link: "/needs/request?type=product" },
  { id: "healthcare", title: "Healthcare Request", subtitle: "Medical assistance & consultations", icon: Heart, gradient: "from-rose-500 to-pink-600", link: "/healthcare" },
  { id: "worker", title: "Request Workers", subtitle: "Skilled laborers for your projects", icon: Wrench, gradient: "from-amber-500 to-orange-600", link: "/needs/request?type=worker" },
  { id: "building", title: "Construction Services", subtitle: "Engineers & building materials", icon: Building, gradient: "from-slate-500 to-gray-700", link: "/needs/request?type=building" },
  { id: "agriculture", title: "Agriculture Needs", subtitle: "Farm equipment & workers", icon: Tractor, gradient: "from-green-500 to-emerald-600", link: "/needs/request?type=agriculture" },
  { id: "general", title: "General Request", subtitle: "Any other service you need", icon: HelpCircle, gradient: "from-purple-500 to-violet-600", link: "/needs/request?type=general" },
  { id: "services", title: "Professional Services", subtitle: "Mechanics, electricians & more", icon: Users, gradient: "from-cyan-500 to-teal-600", link: "/needs/request?type=services" }
];
const CATEGORY_ICONS = [Package, Heart, Wrench, Building, Tractor, HelpCircle, Users];
const CATEGORY_GRADIENTS = [
  "from-blue-500 to-indigo-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-slate-500 to-gray-700",
  "from-green-500 to-emerald-600",
  "from-purple-500 to-violet-600",
  "from-cyan-500 to-teal-600"
];
function NeedCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [itemsPerView, setItemsPerView] = useState(2);
  const [requestTypes, setRequestTypes] = useState(fallbackTypes);
  useEffect(() => {
    let cancelled = false;
    api.get("/api/need-categories").then((payload) => {
      if (cancelled) return;
      const rows = Array.isArray(payload == null ? void 0 : payload.data) ? payload.data : [];
      if (rows.length === 0) return;
      setRequestTypes(
        rows.slice(0, 10).map((c, i) => {
          const key = (c.slug || String(c.name)).toLowerCase();
          return {
            id: String(c.id),
            title: c.name,
            subtitle: c.description || `Request ${c.name.toLowerCase()}`,
            icon: CATEGORY_ICONS[i % CATEGORY_ICONS.length],
            gradient: CATEGORY_GRADIENTS[i % CATEGORY_GRADIENTS.length],
            link: `/needs/request?category=${encodeURIComponent(key)}`
          };
        })
      );
    }).catch(() => {
      if (!cancelled) setRequestTypes(fallbackTypes);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const query = window.matchMedia("(min-width: 768px)");
    const sync = () => setItemsPerView(query.matches ? 4 : 2);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);
  const maxIndex = Math.max(0, requestTypes.length - itemsPerView);
  const step = 100 / itemsPerView;
  useEffect(() => {
    setCurrentIndex((prev) => Math.min(prev, maxIndex));
  }, [maxIndex]);
  const goNext = useCallback(() => {
    setCurrentIndex((prev) => prev >= maxIndex ? 0 : prev + 1);
  }, [maxIndex]);
  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => prev <= 0 ? maxIndex : prev - 1);
  }, [maxIndex]);
  useEffect(() => {
    if (!isAutoPlaying) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(goNext, 4e3);
    return () => clearInterval(interval);
  }, [isAutoPlaying, goNext]);
  return /* @__PURE__ */ jsxs(
    "section",
    {
      className: "py-4",
      onMouseEnter: () => setIsAutoPlaying(false),
      onMouseLeave: () => setIsAutoPlaying(true),
      onTouchStart: () => setIsAutoPlaying(false),
      onTouchEnd: () => setIsAutoPlaying(true),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("h3", { className: "text-sm font-semibold text-muted-foreground uppercase tracking-wide", children: "Submit Your Need" }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `h-2 w-2 rounded-full transition-colors ${isAutoPlaying ? "bg-green-500 animate-pulse" : "bg-muted"}`
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex gap-1", children: [
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Previous needs",
                className: "flex h-6 w-6 items-center justify-center rounded-md text-foreground hover:bg-muted",
                onClick: () => {
                  setIsAutoPlaying(false);
                  goPrev();
                },
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-4 w-4" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Next needs",
                className: "flex h-6 w-6 items-center justify-center rounded-md text-foreground hover:bg-muted",
                onClick: () => {
                  setIsAutoPlaying(false);
                  goNext();
                },
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-4 w-4" })
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsx("div", { className: "overflow-hidden", children: /* @__PURE__ */ jsx(
          "div",
          {
            className: "flex gap-2 transition-transform duration-500 ease-out",
            style: { transform: `translateX(-${currentIndex * step}%)` },
            children: requestTypes.map((request) => /* @__PURE__ */ jsx(Link, { href: request.link, className: "min-w-[48%] md:min-w-[24%]", children: /* @__PURE__ */ jsxs(
              "div",
              {
                className: `bg-gradient-to-br ${request.gradient} rounded-lg p-3 h-20 flex items-center gap-3 hover:scale-[1.02] transition-transform shadow-md hover:shadow-lg`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "p-2 bg-white/20 rounded-lg backdrop-blur-sm shrink-0", children: /* @__PURE__ */ jsx(request.icon, { className: "h-5 w-5 text-white" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
                    /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-white truncate", children: request.title }),
                    /* @__PURE__ */ jsx("p", { className: "text-[10px] text-white/70 line-clamp-2", children: request.subtitle })
                  ] })
                ]
              }
            ) }, request.id))
          }
        ) }),
        /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-1.5 mt-3", children: Array.from({ length: maxIndex + 1 }).map((_, idx) => /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            "aria-label": `Go to need page ${idx + 1}`,
            onClick: () => {
              setCurrentIndex(idx);
              setIsAutoPlaying(false);
            },
            className: "relative h-1.5 rounded-full overflow-hidden transition-all",
            style: { width: idx === currentIndex ? "24px" : "8px" },
            children: [
              /* @__PURE__ */ jsx("div", { className: "absolute inset-0 bg-muted-foreground/30" }),
              idx === currentIndex && /* @__PURE__ */ jsx(
                "div",
                {
                  className: "absolute inset-0 bg-primary origin-left",
                  style: {
                    animation: isAutoPlaying ? "marketplace-progress 4s linear infinite" : "none",
                    width: "100%"
                  }
                }
              )
            ]
          },
          idx
        )) })
      ]
    }
  );
}
const rightTopBanners = [
  { title: "Submit Your Need", subtitle: "We find it for you", cta: "Request", link: "/needs/request", gradient: "from-amber-500 to-orange-600", icon: "sparkles" },
  { title: "Learn New Skills & Advance Your Career", subtitle: "Master in-demand skills", cta: "Start", link: "/learn", gradient: "from-emerald-500 to-teal-600", icon: "learn" }
];
const rightBottomBanners = [
  { title: "Healthcare", subtitle: "Book appointments", cta: "Book", link: "/healthcare", gradient: "from-rose-500 to-pink-600", icon: "health" },
  { title: "Pharmacy", subtitle: "Order medicines", cta: "Order", link: "/pharmacy", gradient: "from-cyan-500 to-blue-600", icon: "package" }
];
function BannerIcon({ icon }) {
  const cls = "h-3 w-3 text-white";
  switch (icon) {
    case "learn":
      return /* @__PURE__ */ jsx(GraduationCap, { className: cls });
    case "health":
      return /* @__PURE__ */ jsx(HeartPulse, { className: cls });
    case "package":
      return /* @__PURE__ */ jsx(Package, { className: cls });
    case "sparkles":
    default:
      return /* @__PURE__ */ jsx(Sparkles, { className: cls });
  }
}
function BannerSlide({ item }) {
  return /* @__PURE__ */ jsx(Link, { href: item.link, className: "block h-full", children: /* @__PURE__ */ jsxs(
    "div",
    {
      className: `relative h-full overflow-hidden rounded-xl bg-gradient-to-br ${item.gradient} p-3 transition-all hover:shadow-lg`,
      children: [
        /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 opacity-10", children: [
          /* @__PURE__ */ jsx("div", { className: "absolute -top-4 -right-4 w-16 h-16 rounded-full bg-white/20" }),
          /* @__PURE__ */ jsx("div", { className: "absolute -bottom-4 -left-4 w-20 h-20 rounded-full bg-white/10" })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "relative z-10 h-full flex flex-col justify-between", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-start justify-between gap-2", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
              /* @__PURE__ */ jsx("h3", { className: "font-bold text-white text-xs md:text-sm line-clamp-1", children: item.title }),
              /* @__PURE__ */ jsx("p", { className: "text-white/70 mt-0.5 text-[10px] md:text-xs line-clamp-1", children: item.subtitle })
            ] }),
            /* @__PURE__ */ jsx("div", { className: "p-1.5 bg-white/20 rounded-lg backdrop-blur-sm shrink-0", children: /* @__PURE__ */ jsx(BannerIcon, { icon: item.icon }) })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "inline-flex h-6 items-center text-[10px] px-2 bg-white/20 hover:bg-white/30 text-white border-0 w-fit rounded-md font-medium", children: item.cta })
        ] })
      ]
    }
  ) });
}
function TripleBanner({ trending }) {
  const items = trending ?? [];
  const [trendingIndex, setTrendingIndex] = useState(0);
  const [rightTopIndex, setRightTopIndex] = useState(0);
  const [rightBottomIndex, setRightBottomIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || items.length === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % items.length);
    }, 4e3);
    return () => clearInterval(interval);
  }, [items.length, paused]);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setRightTopIndex((prev) => (prev + 1) % rightTopBanners.length);
    }, 5500);
    return () => clearInterval(interval);
  }, [paused]);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const interval = setInterval(() => {
      setRightBottomIndex((prev) => (prev + 1) % rightBottomBanners.length);
    }, 6500);
    return () => clearInterval(interval);
  }, [paused]);
  if (items.length === 0) {
    return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-5 gap-2 h-[130px] md:h-[140px]", children: [
      /* @__PURE__ */ jsxs("div", { className: "col-span-3 rounded-xl border border-border bg-card p-3 flex flex-col justify-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm font-semibold", children: "Trending Now" }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground mt-1", children: "Popular items will appear once available." }),
        /* @__PURE__ */ jsx(Link, { href: "/products", className: "mt-2 text-xs text-primary font-medium", children: "Browse products" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(BannerSlide, { item: rightTopBanners[0] }) }),
        /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(BannerSlide, { item: rightBottomBanners[0] }) })
      ] })
    ] });
  }
  const safeIndex = trendingIndex % items.length;
  const item = items[safeIndex];
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "grid grid-cols-5 gap-2 h-[130px] md:h-[140px]",
      onMouseEnter: () => setPaused(true),
      onMouseLeave: () => setPaused(false),
      onTouchStart: () => setPaused(true),
      onTouchEnd: () => setPaused(false),
      children: [
        /* @__PURE__ */ jsx("div", { className: "col-span-3 relative overflow-hidden rounded-xl", children: /* @__PURE__ */ jsxs("div", { className: "relative h-full overflow-hidden rounded-xl bg-gradient-to-br from-orange-500 via-rose-500 to-red-500 p-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "absolute inset-0 opacity-10", children: [
            /* @__PURE__ */ jsx("div", { className: "absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/20" }),
            /* @__PURE__ */ jsx("div", { className: "absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-white/10" })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "relative z-10 h-full flex flex-col", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
              /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
                /* @__PURE__ */ jsx("div", { className: "p-1 bg-white/20 rounded-lg", children: /* @__PURE__ */ jsx(TrendingUp, { className: "h-3 w-3 text-white" }) }),
                /* @__PURE__ */ jsx("span", { className: "text-white font-bold text-xs", children: "Trending Now" })
              ] }),
              /* @__PURE__ */ jsx("span", { className: "bg-white/20 text-white text-[9px] px-1.5 rounded-md", children: "🔥 Hot" })
            ] }),
            /* @__PURE__ */ jsxs(
              Link,
              {
                href: item.link ?? `/search?q=${encodeURIComponent(item.name)}`,
                className: "flex-1 flex items-center gap-2 rounded-lg",
                "aria-label": `View ${item.name}`,
                children: [
                  /* @__PURE__ */ jsx("div", { className: "w-16 h-16 md:w-20 md:h-20 rounded-lg overflow-hidden bg-white/10 shrink-0", children: /* @__PURE__ */ jsx("img", { src: item.image, alt: item.name, className: "w-full h-full object-cover", loading: "lazy" }) }),
                  /* @__PURE__ */ jsxs("div", { className: "flex-1 min-w-0", children: [
                    /* @__PURE__ */ jsx("h4", { className: "text-white font-semibold text-xs md:text-sm line-clamp-1", children: item.name }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mt-0.5", children: [
                      /* @__PURE__ */ jsx(Star, { className: "h-2.5 w-2.5 fill-yellow-300 text-yellow-300" }),
                      /* @__PURE__ */ jsx("span", { className: "text-white/80 text-[10px]", children: item.rating }),
                      item.sales && /* @__PURE__ */ jsxs("span", { className: "text-white/60 text-[10px]", children: [
                        "• ",
                        item.sales,
                        " sold"
                      ] })
                    ] }),
                    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 mt-1", children: [
                      /* @__PURE__ */ jsx("span", { className: "text-white font-bold text-sm", children: formatCurrency(item.price) }),
                      /* @__PURE__ */ jsx("span", { className: "text-white/50 text-xs line-through", children: formatCurrency(item.originalPrice) })
                    ] })
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx("div", { className: "flex justify-center gap-1 mt-2", children: items.map((entry, idx) => /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                onClick: () => setTrendingIndex(idx),
                "aria-label": `Show trending item ${idx + 1}`,
                className: `h-1 rounded-full transition-all ${idx === safeIndex ? "w-3 bg-white" : "w-1 bg-white/40"}`
              },
              entry.id
            )) })
          ] })
        ] }) }),
        /* @__PURE__ */ jsxs("div", { className: "col-span-2 flex flex-col gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1 relative overflow-hidden rounded-xl group/rt", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex h-full transition-transform duration-500 ease-out",
                style: { transform: `translateX(-${rightTopIndex * 100}%)` },
                children: rightTopBanners.map((banner, idx) => /* @__PURE__ */ jsx("div", { className: "min-w-full h-full", children: /* @__PURE__ */ jsx(BannerSlide, { item: banner }) }, idx))
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Previous banner",
                onClick: () => setRightTopIndex((p) => (p - 1 + rightTopBanners.length) % rightTopBanners.length),
                className: "absolute left-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rt:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-3 w-3" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Next banner",
                onClick: () => setRightTopIndex((p) => (p + 1) % rightTopBanners.length),
                className: "absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rt:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1 relative overflow-hidden rounded-xl group/rb", children: [
            /* @__PURE__ */ jsx(
              "div",
              {
                className: "flex h-full transition-transform duration-500 ease-out",
                style: { transform: `translateX(-${rightBottomIndex * 100}%)` },
                children: rightBottomBanners.map((banner, idx) => /* @__PURE__ */ jsx("div", { className: "min-w-full h-full", children: /* @__PURE__ */ jsx(BannerSlide, { item: banner }) }, idx))
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Previous banner",
                onClick: () => setRightBottomIndex((p) => (p - 1 + rightBottomBanners.length) % rightBottomBanners.length),
                className: "absolute left-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rb:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronLeft, { className: "h-3 w-3" })
              }
            ),
            /* @__PURE__ */ jsx(
              "button",
              {
                type: "button",
                "aria-label": "Next banner",
                onClick: () => setRightBottomIndex((p) => (p + 1) % rightBottomBanners.length),
                className: "absolute right-1 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-white opacity-0 transition-opacity group-hover/rb:opacity-100",
                children: /* @__PURE__ */ jsx(ChevronRight, { className: "h-3 w-3" })
              }
            )
          ] })
        ] })
      ]
    }
  );
}
const tabs = [
  { id: "all", label: "All", icon: null },
  { id: "products", label: "Products", icon: "cart" },
  { id: "needs", label: "Needs", icon: "users" },
  { id: "healthcare", label: "Healthcare", icon: "health" },
  { id: "learning", label: "Learning", icon: "learn" },
  { id: "services", label: "Services", icon: "service" }
];
function TabIcon({ icon }) {
  const cls = "h-3 w-3";
  switch (icon) {
    case "cart":
      return /* @__PURE__ */ jsx(ShoppingCart, { className: cls });
    case "users":
      return /* @__PURE__ */ jsx(Users, { className: cls });
    case "health":
      return /* @__PURE__ */ jsx(Stethoscope, { className: cls });
    case "learn":
      return /* @__PURE__ */ jsx(GraduationCap, { className: cls });
    case "service":
      return /* @__PURE__ */ jsx(Briefcase, { className: cls });
  }
}
function SearchTabs({
  activeTab,
  onTabChange,
  search,
  onSearchChange,
  sortBy,
  onSortChange
}) {
  var _a;
  const [sortOpen, setSortOpen] = useState(false);
  useEffect(() => {
    if (!sortOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setSortOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sortOpen]);
  const sortOptions = [
    { value: "default", label: "Default" },
    { value: "price_low", label: "Price: Low" },
    { value: "price_high", label: "Price: High" },
    { value: "rating", label: "Rating" },
    { value: "name", label: "Name" }
  ];
  return /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "relative flex-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "search",
            value: search,
            onChange: (e) => onSearchChange(e.target.value),
            placeholder: "Search products, needs, courses...",
            className: "h-10 w-full rounded-full bg-muted/50 border border-border pl-9 pr-9 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          }
        ),
        search && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => onSearchChange(""),
            "aria-label": "Clear search",
            className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
            children: /* @__PURE__ */ jsx(X, { className: "h-4 w-4" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "relative shrink-0", children: [
        /* @__PURE__ */ jsxs(
          "button",
          {
            type: "button",
            onClick: () => setSortOpen((v) => !v),
            className: "flex h-10 w-[120px] items-center justify-center gap-1 rounded-full border border-border bg-card px-3 text-xs font-medium",
            children: [
              /* @__PURE__ */ jsx(ArrowUpDown, { className: "h-3.5 w-3.5 mr-1" }),
              ((_a = sortOptions.find((o) => o.value === sortBy)) == null ? void 0 : _a.label) ?? "Sort"
            ]
          }
        ),
        sortOpen && /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": "Close sort menu",
            onClick: () => setSortOpen(false),
            className: "fixed inset-0 z-10 cursor-default bg-transparent"
          }
        ),
        sortOpen && /* @__PURE__ */ jsx("div", { className: "absolute right-0 z-20 mt-2 w-36 rounded-lg border border-border bg-card p-1 shadow-lg", children: sortOptions.map((opt) => /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: () => {
              onSortChange(opt.value);
              setSortOpen(false);
            },
            className: `block w-full rounded-md px-3 py-2 text-left text-xs hover:bg-muted ${sortBy === opt.value ? "bg-muted font-semibold" : ""}`,
            children: opt.label
          },
          opt.value
        )) })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex gap-2 overflow-x-auto scrollbar-hide pb-2", children: tabs.map((tab) => /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        onClick: () => onTabChange(tab.id),
        className: `flex flex-shrink-0 items-center gap-1.5 rounded-full h-8 text-xs px-4 font-medium transition-colors ${activeTab === tab.id ? "bg-primary text-primary-foreground" : "border border-border bg-card text-muted-foreground hover:text-foreground"}`,
        children: [
          tab.icon && /* @__PURE__ */ jsx(TabIcon, { icon: tab.icon }),
          tab.label
        ]
      },
      tab.id
    )) })
  ] });
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function getTypeColor(type) {
  switch (type) {
    case "need":
      return "bg-purple-500";
    case "healthcare":
      return "bg-rose-500";
    case "learning":
      return "bg-amber-500";
    case "service":
      return "bg-emerald-500";
    case "product":
    default:
      return "bg-blue-500";
  }
}
function ProductCard({ product }) {
  const { props } = usePage();
  const auth = props.auth ?? null;
  const [inWishlist, setInWishlist] = useState(false);
  const [wishPending, setWishPending] = useState(false);
  const [cartPending, setCartPending] = useState(false);
  const [cartAdded, setCartAdded] = useState(false);
  const discount = product.originalPrice && product.originalPrice > product.price ? Math.round((1 - product.price / product.originalPrice) * 100) : 0;
  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (wishPending) return;
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    setWishPending(true);
    try {
      const res = await api.post("/api/favorites/toggle", {
        entity_type: "product",
        entity_id: String(product.id)
      });
      const next = typeof res.favorited === "boolean" ? res.favorited : !inWishlist;
      setInWishlist(next);
      toast.success(next ? "Saved to wishlist" : "Removed from wishlist");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.visit("/login");
      }
    } finally {
      setWishPending(false);
    }
  };
  const addToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (cartPending || cartAdded) return;
    if (!(auth == null ? void 0 : auth.user)) {
      router.visit("/login");
      return;
    }
    if (!UUID_RE.test(String(product.id))) {
      router.visit(product.link ?? `/products/${product.id}`);
      return;
    }
    setCartPending(true);
    try {
      await api.post("/api/cart/items", { product_id: String(product.id), quantity: 1 });
      setCartAdded(true);
      toast.success("Added to cart");
      router.reload({ only: ["cartCount"] });
    } catch {
      router.visit(product.link ?? `/products/${product.id}`);
    } finally {
      setCartPending(false);
    }
  };
  return /* @__PURE__ */ jsx(Link, { href: product.link ?? `/products/${product.id}`, children: /* @__PURE__ */ jsxs("div", { className: "overflow-hidden hover:shadow-lg transition-all duration-300 group h-full rounded-lg border border-border bg-card flex flex-col", children: [
    /* @__PURE__ */ jsxs("div", { className: "aspect-square overflow-hidden bg-muted relative", children: [
      product.image ? /* @__PURE__ */ jsx(
        "img",
        {
          src: product.image,
          alt: product.name,
          className: "w-full h-full object-cover group-hover:scale-110 transition-transform duration-300",
          loading: "lazy"
        }
      ) : /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center text-muted-foreground", children: /* @__PURE__ */ jsx(ShoppingCart, { className: "h-8 w-8" }) }),
      /* @__PURE__ */ jsx(
        "button",
        {
          type: "button",
          onClick: (e) => void toggleWishlist(e),
          disabled: wishPending,
          "aria-label": `Toggle wishlist for ${product.name}`,
          className: `absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${inWishlist ? "bg-destructive text-destructive-foreground" : "bg-background/80 text-muted-foreground hover:bg-background hover:text-destructive"}`,
          children: /* @__PURE__ */ jsx(Heart, { className: `h-4 w-4 ${inWishlist ? "fill-current" : ""}` })
        }
      ),
      discount > 0 && /* @__PURE__ */ jsxs("div", { className: "absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded", children: [
        "-",
        discount,
        "%"
      ] }),
      (product.badge ?? product.type) && /* @__PURE__ */ jsx(
        "div",
        {
          className: `absolute bottom-2 left-2 ${getTypeColor(product.type)} text-white text-[10px] px-1.5 py-0.5 rounded`,
          children: product.badge ?? product.category ?? product.type
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 flex-1", children: [
      product.category && /* @__PURE__ */ jsx("p", { className: "text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide", children: product.category }),
      /* @__PURE__ */ jsx("h3", { className: "font-medium text-sm line-clamp-2 mb-1 h-10", children: product.name }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1 mb-1", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
        product.rating != null ? /* @__PURE__ */ jsx("span", { className: "text-xs font-medium", children: product.rating.toFixed(1) }) : /* @__PURE__ */ jsx("span", { className: "text-[10px] text-muted-foreground", children: "No reviews yet" }),
        product.vendor && /* @__PURE__ */ jsxs("span", { className: "text-[10px] text-muted-foreground", children: [
          "(",
          product.vendor,
          ")"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx("p", { className: "text-base font-bold text-primary", children: formatCurrency(product.price) }),
        product.originalPrice && product.originalPrice > product.price && /* @__PURE__ */ jsx("p", { className: "text-xs text-muted-foreground line-through", children: formatCurrency(product.originalPrice) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "p-3 pt-0 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs(
        "button",
        {
          type: "button",
          onClick: (e) => void addToCart(e),
          disabled: cartPending,
          className: "inline-flex h-8 flex-1 items-center justify-center rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-60",
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { className: "h-3 w-3 mr-1" }),
            cartAdded ? "Added ✓" : cartPending ? "Adding…" : "Add to Cart"
          ]
        }
      ),
      /* @__PURE__ */ jsx(ChevronRight, { className: "h-3.5 w-3.5 text-muted-foreground ml-2" })
    ] })
  ] }) });
}
function ExpertsShowcase({
  experts,
  title = "Top Experts",
  limit = 8,
  viewAllHref = "/experts"
}) {
  const [fetched, setFetched] = useState([]);
  useEffect(() => {
    if (experts && experts.length > 0) return;
    api.get("/api/experts", { params: { per_page: limit, available: true } }).then((res) => {
      setFetched(
        (res.data ?? []).map((e) => ({
          id: e.id,
          name: e.full_name ?? e.name ?? "Expert",
          role: e.specialization ?? e.role ?? "Professional",
          link: `/experts/${e.id}`,
          rating: typeof e.rating === "string" ? Number(e.rating) : e.rating,
          source: "healthcare"
        }))
      );
    }).catch(() => setFetched([]));
  }, [experts, limit]);
  const list = (experts && experts.length > 0 ? experts : fetched).slice(0, limit);
  if (list.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { children: [
    /* @__PURE__ */ jsxs("div", { className: "mb-4 flex items-center justify-between", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
        /* @__PURE__ */ jsx(Star, { className: "h-5 w-5 text-yellow-500" }),
        /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", children: title })
      ] }),
      /* @__PURE__ */ jsxs(
        Link,
        {
          href: viewAllHref,
          className: "inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground",
          children: [
            "View All ",
            /* @__PURE__ */ jsx(ArrowRight, { className: "h-4 w-4" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: list.map((expert) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "rounded-xl border border-border bg-card p-4 text-center transition-all duration-300 hover:scale-[1.03] hover:shadow-lg",
        children: [
          /* @__PURE__ */ jsx("div", { className: "mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary", children: expert.name.split(" ").map((n) => n[0]).join("").slice(0, 2) }),
          /* @__PURE__ */ jsx("p", { className: "line-clamp-1 text-sm font-semibold", children: expert.name }),
          /* @__PURE__ */ jsx("p", { className: "line-clamp-1 text-xs text-muted-foreground", children: expert.role }),
          expert.rating !== void 0 && /* @__PURE__ */ jsxs("div", { className: "mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground", children: [
            /* @__PURE__ */ jsx(Star, { className: "h-3 w-3 fill-yellow-400 text-yellow-400" }),
            Number(expert.rating).toFixed(1),
            /* @__PURE__ */ jsx("span", { className: "mx-1", children: "·" }),
            /* @__PURE__ */ jsx(Users, { className: "h-3 w-3" })
          ] }),
          /* @__PURE__ */ jsx("div", { className: "mt-3 flex gap-1", children: /* @__PURE__ */ jsxs(
            Link,
            {
              href: expert.link,
              className: "flex h-8 flex-1 items-center justify-center gap-1 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground",
              children: [
                /* @__PURE__ */ jsx(Calendar, { className: "h-3 w-3" }),
                " Book"
              ]
            }
          ) })
        ]
      },
      `${expert.source ?? "expert"}-${expert.id}`
    )) })
  ] });
}
function RecentlyViewedSection() {
  const { recentlyViewed } = useRecentlyViewed();
  if (recentlyViewed.length === 0) return null;
  return /* @__PURE__ */ jsxs("section", { className: "animate-in fade-in", children: [
    /* @__PURE__ */ jsx("div", { className: "mb-3 flex items-center justify-between", children: /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx(Clock, { className: "h-5 w-5 text-muted-foreground" }),
      /* @__PURE__ */ jsx("h2", { className: "text-lg font-bold", "data-testid": "recently-viewed-heading", children: "Recently Viewed" })
    ] }) }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "flex gap-3 overflow-x-auto pb-2",
        "data-testid": "recently-viewed-list",
        style: { scrollbarWidth: "none" },
        children: recentlyViewed.map((item) => /* @__PURE__ */ jsx(
          Link,
          {
            href: `/products/${item.id}`,
            className: "w-32 flex-shrink-0",
            "data-testid": "recently-viewed-item",
            "data-product-id": item.id,
            children: /* @__PURE__ */ jsxs("div", { className: "overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:scale-[1.03] hover:shadow-lg", children: [
              /* @__PURE__ */ jsx("div", { className: "aspect-square bg-muted", children: item.image && /* @__PURE__ */ jsx(
                "img",
                {
                  src: item.image,
                  alt: item.name,
                  className: "h-full w-full object-cover",
                  loading: "lazy"
                }
              ) }),
              /* @__PURE__ */ jsxs("div", { className: "p-2", children: [
                /* @__PURE__ */ jsx("p", { className: "line-clamp-2 text-xs font-medium", children: item.name }),
                /* @__PURE__ */ jsx("p", { className: "mt-1 text-sm font-bold text-primary", children: formatCurrency(item.price) })
              ] })
            ] })
          },
          item.id
        ))
      }
    )
  ] });
}
function HomeIndex({ products, categories = [], learning = [], healthcareCards = [], topExperts = [], cartCount = 0 }) {
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const realProducts = useMemo(() => (products == null ? void 0 : products.data) ?? [], [products]);
  const spotlight = useMemo(
    () => [...realProducts, ...learning, ...healthcareCards],
    [realProducts, learning, healthcareCards]
  );
  const pool = useMemo(() => {
    const merged = [...realProducts, ...learning, ...healthcareCards];
    if (activeTab === "all") return merged;
    if (activeTab === "products") return realProducts;
    if (activeTab === "learning") return learning;
    if (activeTab === "healthcare") return healthcareCards;
    return merged.filter((p) => (p.type ?? "product") === (activeTab === "needs" ? "need" : "service"));
  }, [realProducts, learning, healthcareCards, activeTab]);
  const filtered = useMemo(() => {
    let list = [...pool];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q) || (p.vendor ?? "").toLowerCase().includes(q)
      );
    }
    if (sortBy === "price_low") list.sort((a, b) => a.price - b.price);
    if (sortBy === "price_high") list.sort((a, b) => b.price - a.price);
    if (sortBy === "rating") list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    if (sortBy === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    return list;
  }, [pool, search, sortBy]);
  return /* @__PURE__ */ jsx(MarketplaceLayout, { title: "Home", cartCount, children: /* @__PURE__ */ jsx("div", { className: "min-h-screen pb-20 bg-background", children: /* @__PURE__ */ jsxs("div", { className: "container mx-auto px-3 py-4 space-y-6", children: [
    /* @__PURE__ */ jsx(BannerSlider, {}),
    /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsx(CategoryGrid, { categories }) }),
    /* @__PURE__ */ jsx(NeedCarousel, {}),
    /* @__PURE__ */ jsx(
      TripleBanner,
      {
        trending: [...spotlight].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 4).map((p) => ({
          id: p.id,
          name: p.name,
          price: p.price,
          originalPrice: p.originalPrice ?? p.price,
          image: p.image ?? "",
          rating: p.rating ?? 0,
          link: p.link ?? `/products/${p.id}`
        }))
      }
    ),
    /* @__PURE__ */ jsxs("section", { id: "product-grid", className: "space-y-4 scroll-mt-24 outline-none", children: [
      /* @__PURE__ */ jsx(
        SearchTabs,
        {
          activeTab,
          onTabChange: setActiveTab,
          search,
          onSearchChange: setSearch,
          sortBy,
          onSortChange: setSortBy
        }
      ),
      /* @__PURE__ */ jsx("div", { className: "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2 auto-rows-min", children: filtered.map((product) => /* @__PURE__ */ jsx(ProductCard, { product }, product.id)) }),
      filtered.length === 0 && /* @__PURE__ */ jsxs("div", { className: "py-10 text-center text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx("p", { className: "font-medium", children: "Nothing here yet" }),
        /* @__PURE__ */ jsx("p", { className: "mt-1", children: "Products, courses and doctors will appear once available." }),
        /* @__PURE__ */ jsxs("div", { className: "mt-3 flex flex-wrap justify-center gap-2", children: [
          /* @__PURE__ */ jsx(Link, { href: "/products", className: "rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground", children: "Browse products" }),
          /* @__PURE__ */ jsx(Link, { href: "/learn/courses", className: "rounded-md border px-3 py-1.5 text-xs", children: "Browse courses" }),
          /* @__PURE__ */ jsx(Link, { href: "/healthcare/doctors", className: "rounded-md border px-3 py-1.5 text-xs", children: "Find doctors" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx("section", { children: /* @__PURE__ */ jsx(ExpertsShowcase, { experts: topExperts, title: "Top Experts", limit: 8 }) }),
    /* @__PURE__ */ jsx(RecentlyViewedSection, {})
  ] }) }) });
}
export {
  HomeIndex as default
};
