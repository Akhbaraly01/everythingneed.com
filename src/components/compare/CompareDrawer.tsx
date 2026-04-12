import { useCompare } from "@/contexts/CompareContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, GitCompareArrows, Star, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCurrency } from "@/contexts/CurrencyContext";
import { motion, AnimatePresence } from "framer-motion";

const CompareDrawer = () => {
  const { items, removeFromCompare, clearCompare, isDrawerOpen, setDrawerOpen } = useCompare();
  const { formatPrice } = useCurrency();

  if (items.length === 0) return null;

  const allFields = ["Price", "Rating", "Category", "Description"];

  return (
    <>
      {/* Floating Compare Bar */}
      <AnimatePresence>
        {items.length > 0 && !isDrawerOpen && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50"
          >
            <Card className="shadow-2xl border-primary/30">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {items.map(item => (
                    <div key={item.id} className="w-10 h-10 rounded-full border-2 border-background overflow-hidden">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-sm font-medium">{items.length}/3 selected</span>
                <Button size="sm" onClick={() => setDrawerOpen(true)} disabled={items.length < 2} className="gap-1.5">
                  <GitCompareArrows className="h-4 w-4" />
                  Compare
                </Button>
                <Button size="sm" variant="ghost" onClick={clearCompare}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Comparison Sheet */}
      <Sheet open={isDrawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent side="bottom" className="h-[85vh] overflow-y-auto">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <GitCompareArrows className="h-5 w-5" />
                Product Comparison
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={clearCompare}>Clear All</Button>
            </div>
          </SheetHeader>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr>
                  <th className="text-left p-2 w-28 text-sm font-medium text-muted-foreground">Feature</th>
                  {items.map(item => (
                    <th key={item.id} className="p-2 text-center">
                      <div className="relative">
                        <button
                          onClick={() => removeFromCompare(item.id)}
                          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
                        >
                          <X className="h-3 w-3" />
                        </button>
                        <div className="w-20 h-20 mx-auto rounded-lg overflow-hidden bg-muted mb-2">
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-xs font-medium line-clamp-2">{item.name}</p>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-2 text-sm font-medium">Price</td>
                  {items.map(item => (
                    <td key={item.id} className="p-2 text-center">
                      <span className="font-bold text-primary">{item.price ? formatPrice(item.price) : "N/A"}</span>
                      {item.originalPrice && item.originalPrice > (item.price ?? 0) && (
                        <div className="text-xs text-muted-foreground line-through">{formatPrice(item.originalPrice)}</div>
                      )}
                    </td>
                  ))}
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-2 text-sm font-medium">Rating</td>
                  {items.map(item => (
                    <td key={item.id} className="p-2 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">{item.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  ))}
                </tr>
                <tr className="border-t">
                  <td className="p-2 text-sm font-medium">Category</td>
                  {items.map(item => (
                    <td key={item.id} className="p-2 text-center">
                      <Badge variant="secondary" className="text-xs">{item.category}</Badge>
                    </td>
                  ))}
                </tr>
                <tr className="border-t bg-muted/30">
                  <td className="p-2 text-sm font-medium">Savings</td>
                  {items.map(item => {
                    const savings = item.originalPrice && item.price ? item.originalPrice - item.price : 0;
                    return (
                      <td key={item.id} className="p-2 text-center">
                        {savings > 0 ? (
                          <Badge className="bg-green-500 text-xs">Save {formatPrice(savings)}</Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
                <tr className="border-t">
                  <td className="p-2 text-sm font-medium">Description</td>
                  {items.map(item => (
                    <td key={item.id} className="p-2 text-center">
                      <p className="text-xs text-muted-foreground line-clamp-3">{item.description || "No description available"}</p>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default CompareDrawer;
