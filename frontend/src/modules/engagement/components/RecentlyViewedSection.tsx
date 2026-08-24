import { Link } from "react-router-dom";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { useCurrency } from "@/contexts/CurrencyContext";
import { motion } from "framer-motion";
import { Clock, ArrowRight } from "lucide-react";

const RecentlyViewedSection = () => {
  const { recentlyViewed } = useRecentlyViewed();
  const { formatPrice } = useCurrency();

  if (recentlyViewed.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-bold" data-testid="recently-viewed-heading">Recently Viewed</h2>
        </div>
      </div>
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2" data-testid="recently-viewed-list">
        {recentlyViewed.map((item) => (
          <Link
            key={item.id}
            to={`/product/${item.id}`}
            className="flex-shrink-0 w-32"
            data-testid="recently-viewed-item"
            data-product-id={item.id}
          >
            <Card className="overflow-hidden hover:shadow-lg hover:scale-[1.03] transition-all duration-300">
              <div className="aspect-square bg-muted">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <CardContent className="p-2">
                <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                <p className="text-sm font-bold text-primary mt-1">{formatPrice(item.price)}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </motion.section>
  );
};

export default RecentlyViewedSection;
