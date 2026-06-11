import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, X, Sparkles } from "lucide-react";
import { supabaseGateway } from "@core/api/supabaseGateway";
import NeedsCategoryGrid, { NeedsCategory } from "../components/CategoryGrid";
import ServiceCard, { ServiceCardItem } from "../components/ServiceCard";
import { needsCategoryData } from "@/data/needsData";

const FALLBACK_CATEGORIES: NeedsCategory[] = [
  { id: "transportation", slug: "transportation", name: "Transportation", icon: "Car", color: "#3B82F6" },
  { id: "hotels", slug: "hotels", name: "Hotels", icon: "Hotel", color: "#8B5CF6" },
  { id: "jobs", slug: "jobs", name: "Jobs", icon: "Briefcase", color: "#10B981" },
  { id: "housing", slug: "housing", name: "Housing", icon: "Home", color: "#F59E0B" },
  { id: "food", slug: "food", name: "Food", icon: "UtensilsCrossed", color: "#EF4444" },
  { id: "education", slug: "education", name: "Education", icon: "GraduationCap", color: "#6366F1" },
  { id: "healthcare", slug: "healthcare", name: "Healthcare", icon: "Heart", color: "#EC4899" },
  { id: "legal", slug: "legal", name: "Legal", icon: "Scale", color: "#14B8A6" },
  { id: "finance", slug: "finance", name: "Finance", icon: "Wallet", color: "#F97316" },
  { id: "technology", slug: "technology", name: "Technology", icon: "Laptop", color: "#0EA5E9" },
  { id: "beauty", slug: "beauty", name: "Beauty", icon: "Sparkles", color: "#D946EF" },
  { id: "fitness", slug: "fitness", name: "Fitness", icon: "Dumbbell", color: "#84CC16" },
  { id: "pets", slug: "pets", name: "Pets", icon: "Dog", color: "#A855F7" },
  { id: "events", slug: "events", name: "Events", icon: "Music", color: "#EAB308" },
  { id: "cleaning", slug: "cleaning", name: "Cleaning", icon: "Sparkle", color: "#06B6D4" },
];

const NeedsDashboard = () => {
  const [categories, setCategories] = useState<NeedsCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data } = await (supabaseGateway.from as any)("need_categories")
          .select("id,slug,name,icon,color")
          .order("name");
        if (active && data && data.length) {
          setCategories(data as NeedsCategory[]);
        } else if (active) {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch {
        if (active) setCategories(FALLBACK_CATEGORIES);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const featured = useMemo<ServiceCardItem[]>(() => {
    const picks: ServiceCardItem[] = [];
    Object.entries(needsCategoryData).forEach(([cat, items]) => {
      items.slice(0, 2).forEach((it) =>
        picks.push({
          id: it.id,
          name: it.name,
          description: it.description,
          price: it.price,
          rating: it.rating,
          provider: it.provider,
          category: cat,
          accentColor:
            FALLBACK_CATEGORIES.find((c) => c.slug === cat)?.color ?? "hsl(var(--primary))",
        })
      );
    });
    return picks;
  }, []);

  const filteredCats = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );
  const filteredServices = search
    ? featured.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.category.toLowerCase().includes(search.toLowerCase())
      )
    : featured;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b">
        <div className="container mx-auto px-4 py-6 sm:py-10">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary uppercase tracking-wider">
              Everything You Need
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Book, schedule and apply — all in one place
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-5 max-w-2xl">
            From rides and rooms to doctors and jobs. Browse 30+ categories and
            confirm in seconds.
          </p>

          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search needs, services, doctors, jobs…"
              className="pl-9 pr-10 h-11 bg-background"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-8 sm:space-y-10">
        {/* Categories */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Browse categories</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">
              {filteredCats.length} total
            </span>
          </div>
          <NeedsCategoryGrid categories={filteredCats} loading={loading} />
        </section>

        {/* Featured services */}
        <section>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-lg sm:text-xl font-semibold">Featured services</h2>
            <Button variant="ghost" size="sm" asChild>
              <a href="/deals">See all</a>
            </Button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredServices.slice(0, 16).map((s) => (
                <ServiceCard key={s.id} item={s} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default NeedsDashboard;
