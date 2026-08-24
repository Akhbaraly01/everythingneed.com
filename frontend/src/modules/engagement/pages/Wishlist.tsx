import { Link } from "react-router-dom";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { useWishlist } from "@/hooks/useWishlist";
import { Heart, ShoppingCart, Trash2, Loader2 } from "lucide-react";

const Wishlist = () => {
  const { wishlistItems, isLoading, removeFromWishlist } = useWishlist();

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayProducts = wishlistItems.length > 0
    ? wishlistItems.map((item: any) => item.products || item)
    : [];

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Wishlist</h1>
          <p className="text-muted-foreground">{displayProducts.length} items saved</p>
        </div>
      </div>

      {displayProducts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Heart className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Your wishlist is empty</h3>
            <p className="text-muted-foreground mb-4">
              Save items you love by clicking the heart icon on products
            </p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayProducts.map((product: any) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="flex">
                <div className="w-32 h-32 bg-muted flex-shrink-0">
                  <img
                    src={product.image_url || "/placeholder.svg"}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <Link to={`/product/${product.id}`}>
                      <h3 className="font-semibold line-clamp-2 hover:text-primary">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-lg font-bold text-primary mt-1">
                      ${Number(product.price).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="flex-1">
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Add to Cart
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeFromWishlist(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
