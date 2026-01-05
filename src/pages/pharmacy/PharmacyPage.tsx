import { useState, useEffect } from "react";
import { Search, Filter, ShoppingCart, Pill, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import CartSidebar from "@/components/pharmacy/CartSidebar";

interface Medicine {
  id: string;
  name: string;
  generic_name: string | null;
  category: string;
  description: string | null;
  price: number;
  stock_quantity: number;
  requires_prescription: boolean;
  image_url: string | null;
}

const PharmacyPage = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [categories, setCategories] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { addToCart, totalItems } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    fetchMedicines();
  }, []);

  const fetchMedicines = async () => {
    const { data, error } = await supabase
      .from("medicines")
      .select("*")
      .order("name");

    if (error) {
      toast({
        title: "Error",
        description: "Failed to load medicines",
        variant: "destructive",
      });
      return;
    }

    setMedicines(data || []);
    const uniqueCategories = [...new Set(data?.map((m) => m.category) || [])];
    setCategories(uniqueCategories);
    setLoading(false);
  };

  const filteredMedicines = medicines.filter((medicine) => {
    const matchesSearch =
      medicine.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      medicine.generic_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || medicine.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (medicine: Medicine) => {
    if (medicine.stock_quantity < 1) {
      toast({
        title: "Out of Stock",
        description: "This medicine is currently unavailable",
        variant: "destructive",
      });
      return;
    }
    addToCart(medicine.id);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary to-secondary py-8 md:py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-primary-foreground/20">
              <Pill className="h-8 w-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-bold text-primary-foreground">
                Online Pharmacy
              </h1>
              <p className="text-primary-foreground/80">
                Order medicines with prescription upload
              </p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex flex-col md:flex-row gap-3 mt-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search medicines..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48 bg-background">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              className="relative"
              onClick={() => setCartOpen(true)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Cart
              {totalItems > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive">
                  {totalItems}
                </Badge>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="p-4 animate-pulse">
                <div className="aspect-square bg-muted rounded-lg mb-3" />
                <div className="h-4 bg-muted rounded mb-2" />
                <div className="h-3 bg-muted rounded w-2/3" />
              </Card>
            ))}
          </div>
        ) : filteredMedicines.length === 0 ? (
          <div className="text-center py-12">
            <Pill className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No medicines found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search or filter
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredMedicines.map((medicine) => (
              <Card
                key={medicine.id}
                className="overflow-hidden group hover:shadow-lg transition-all duration-300"
              >
                <div className="relative aspect-square bg-muted">
                  {medicine.image_url ? (
                    <img
                      src={medicine.image_url}
                      alt={medicine.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Pill className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  {medicine.requires_prescription && (
                    <Badge className="absolute top-2 left-2 bg-warning text-warning-foreground">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      Rx Required
                    </Badge>
                  )}
                  {medicine.stock_quantity < 1 && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                      <span className="font-medium text-destructive">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">
                    {medicine.category}
                  </p>
                  <h3 className="font-medium mb-1 line-clamp-1">
                    {medicine.name}
                  </h3>
                  {medicine.generic_name && (
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">
                      {medicine.generic_name}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-lg font-bold text-primary">
                      ${Number(medicine.price).toFixed(2)}
                    </span>
                    <Button
                      size="sm"
                      onClick={() => handleAddToCart(medicine)}
                      disabled={medicine.stock_quantity < 1}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      <CartSidebar open={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default PharmacyPage;
