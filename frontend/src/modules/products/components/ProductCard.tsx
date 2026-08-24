import { Link } from "react-router-dom";
import { Card, CardContent, CardFooter } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Star, ShoppingCart, Heart } from "lucide-react";
import { useWishlist } from "@/hooks/useWishlist";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface ProductCardProduct {
  id: string | number;
  name: string;
  price: number;
  originalPrice?: number;
  image?: string;
  image_url?: string;
  category: string;
  rating?: number;
  vendor?: string;
  stock_quantity?: number;
}

interface ProductCardProps {
  product: ProductCardProduct;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { user } = useAuth();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const inWishlist = isInWishlist(product.id.toString());

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Please sign in to add items to wishlist");
      return;
    }

    if (inWishlist) {
      await removeFromWishlist(product.id.toString());
    } else {
      await addToWishlist(product.id.toString());
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.success(`${product.name} added to cart`);
  };

  const imageUrl = product.image_url || product.image || "/placeholder.svg";

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 group h-full">
        <div className="aspect-square overflow-hidden bg-muted relative">
          <img
            src={imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          />
          <button
            onClick={handleWishlistToggle}
            className={`absolute top-2 right-2 p-1.5 rounded-full transition-all duration-200 ${
              inWishlist
                ? "bg-destructive text-destructive-foreground"
                : "bg-background/80 text-muted-foreground hover:bg-background hover:text-destructive"
            }`}
          >
            <Heart className={`h-4 w-4 ${inWishlist ? "fill-current" : ""}`} />
          </button>

          {product.originalPrice && product.originalPrice > product.price && (
            <div className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-1.5 py-0.5 rounded">
              -{Math.round((1 - product.price / product.originalPrice) * 100)}%
            </div>
          )}
        </div>
        <CardContent className="p-3">
          <p className="text-[10px] text-muted-foreground mb-0.5 uppercase tracking-wide">{product.category}</p>
          <h3 className="font-medium text-sm line-clamp-2 mb-1 h-10">{product.name}</h3>
          <div className="flex items-center gap-1 mb-1">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating || 0}</span>
            {product.vendor && <span className="text-[10px] text-muted-foreground">({product.vendor})</span>}
          </div>
          <div className="flex items-center gap-2">
            <p className="text-base font-bold text-primary">${product.price}</p>
            {product.originalPrice && product.originalPrice > product.price && (
              <p className="text-xs text-muted-foreground line-through">${product.originalPrice}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="p-3 pt-0">
          <Button className="w-full h-8 text-xs" size="sm" onClick={handleAddToCart}>
            <ShoppingCart className="h-3 w-3 mr-1" />
            Add to Cart
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );
};

export default ProductCard;
