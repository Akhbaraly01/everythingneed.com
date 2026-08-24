import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Card, CardContent } from "@shared/ui/card";
import { Button } from "@shared/ui/button";
import { Badge } from "@shared/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/ui/tabs";
import { Textarea } from "@shared/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/modules/checkout/context/CartContext";
import { http, qs } from "@core/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { 
  Star, 
  Heart, 
  ShoppingCart, 
  Minus, 
  Plus, 
  Share2,
  Truck,
  Shield,
  RotateCcw,
  ChevronLeft,
  ThumbsUp,
  Loader2
} from "lucide-react";

const API = import.meta.env.VITE_API_URL || "/api";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  compare_price?: number;
  image_url?: string;
  images?: string[];
  category: string;
  subcategory?: string;
  stock_quantity: number;
  is_active: boolean;
  rating: number;
  reviews_count: number;
  vendor?: { id: string; store_name: string };
}

interface Review {
  id: string;
  user_id: string;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
  helpful_count: number;
  user?: { name: string; profile?: { full_name: string } };
}

const ProductDetail = () => {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [newReview, setNewReview] = useState({ rating: 5, title: "", comment: "" });
  const { addItem } = useRecentlyViewed();

  // Fetch product from API
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await http.get<{ data: Product }>(`${API}/products/${id}`);
      return res.data;
    },
    enabled: !!id,
  });

  // Fetch reviews from API
  const { data: reviewsData } = useQuery({
    queryKey: ["product-reviews", id],
    queryFn: async () => {
      const res = await http.get<{ data: Review[] }>(`${API}/reviews${qs({
        reviewable_type: "product",
        reviewable_id: id,
      })}`);
      return res.data || [];
    },
    enabled: !!id,
  });

  const reviews = reviewsData || [];

  // Track recently viewed
  useEffect(() => {
    if (product) {
      addItem({
        id: String(product.id),
        name: product.name,
        image: product.image_url || "",
        price: product.price,
        category: product.category,
      });
    }
  }, [product?.id]);

  // Check if in wishlist
  const { data: isInWishlist } = useQuery({
    queryKey: ["wishlist-check", id, user?.id],
    queryFn: async () => {
      if (!user) return false;
      await http.get<any>(`${API}/reviews${qs({
        reviewable_type: "wishlist",
        user_id: user.id,
      })}`);
      return false;
    },
    enabled: !!user && !!id,
  });

  // Toggle wishlist
  const wishlistMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");
      // Wishlist is handled via the engagement module
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist-check"] });
      toast({ title: isInWishlist ? "Removed from wishlist" : "Added to wishlist" });
    },
  });

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error("Not authenticated");
      await http.post(`${API}/reviews`, {
        reviewable_type: "product",
        reviewable_id: id,
        rating: newReview.rating,
        title: newReview.title,
        comment: newReview.comment,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["product-reviews", id] });
      setNewReview({ rating: 5, title: "", comment: "" });
      toast({ title: "Review submitted", description: "Thank you for your review!" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to submit review", variant: "destructive" });
    },
  });

  // Add to cart handler
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in", description: "You need to be signed in to add items to cart", variant: "destructive" });
      return;
    }
    await addToCart(id!, quantity);
  };

  // Related products query
  const { data: relatedProducts = [] } = useQuery({
    queryKey: ["related-products", product?.category, id],
    queryFn: async () => {
      if (!product?.category) return [];
      const res = await http.get<{ data: Product[] }>(`${API}/products${qs({
        category: product.category,
        limit: 6,
      })}`);
      return (res.data || []).filter((p: Product) => String(p.id) !== id).slice(0, 6);
    },
    enabled: !!product?.category,
  });

  if (productLoading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Product not found</p>
            <Link to="/">
              <Button className="mt-4">Back to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vendorName = product.vendor?.store_name || "Unknown Vendor";
  const imageUrl = product.image_url || product.images?.[0] || "/placeholder.svg";

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/products" className="hover:text-foreground">{product.category}</Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </div>

      <Link to="/products" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="h-4 w-4 mr-1" />
        Back to Products
      </Link>

      {/* Product Info */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="space-y-4">
          <div className="aspect-square bg-muted rounded-xl overflow-hidden">
            <img 
              src={imageUrl} 
              alt={product.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <Badge variant="secondary" className="mb-2">{product.category}</Badge>
            <h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
            <p className="text-muted-foreground mt-2">by {vendorName}</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${i < Math.floor(product.rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                />
              ))}
            </div>
            <span className="font-medium">{product.rating}</span>
            <span className="text-muted-foreground">({product.reviews_count || reviews.length} reviews)</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</span>
            {product.compare_price && product.compare_price > product.price && (
              <>
                <span className="text-xl text-muted-foreground line-through">${Number(product.compare_price).toFixed(2)}</span>
                <Badge variant="destructive">
                  {Math.round((1 - product.price / product.compare_price) * 100)}% OFF
                </Badge>
              </>
            )}
          </div>

          <p className="text-muted-foreground">{product.description}</p>

          {/* Quantity */}
          <div className="flex items-center gap-4">
            <span className="font-medium">Quantity:</span>
            <div className="flex items-center border rounded-lg">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-12 text-center">{quantity}</span>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground">
              {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : "Out of stock"}
            </span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button 
              className="flex-1" 
              size="lg" 
              onClick={handleAddToCart}
              disabled={product.stock_quantity <= 0}
            >
              <ShoppingCart className="h-5 w-5 mr-2" />
              Add to Cart
            </Button>
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                if (!isAuthenticated) {
                  toast({ title: "Please sign in to save items", variant: "destructive" });
                  return;
                }
                wishlistMutation.mutate();
              }}
            >
              <Heart className={`h-5 w-5 ${isInWishlist ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
            <Button variant="outline" size="lg">
              <Share2 className="h-5 w-5" />
            </Button>
          </div>

          {/* Features */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <Truck className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Free Shipping</p>
            </div>
            <div className="text-center">
              <Shield className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Secure Payment</p>
            </div>
            <div className="text-center">
              <RotateCcw className="h-6 w-6 mx-auto text-primary mb-1" />
              <p className="text-xs text-muted-foreground">Easy Returns</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="reviews" className="mt-8">
        <TabsList>
          <TabsTrigger value="description">Description</TabsTrigger>
          <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
        </TabsList>

        <TabsContent value="description" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-2">Product Description</h3>
              <p className="text-muted-foreground">{product.description}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reviews" className="mt-4 space-y-4">
          {/* Write Review */}
          {isAuthenticated && (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Write a Review</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span>Rating:</span>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button 
                        key={star}
                        onClick={() => setNewReview({ ...newReview, rating: star })}
                      >
                        <Star 
                          className={`h-6 w-6 ${star <= newReview.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Review title (optional)"
                    value={newReview.title}
                    onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md"
                  />
                  <Textarea
                    placeholder="Write your review..."
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  />
                  <Button 
                    onClick={() => submitReviewMutation.mutate()}
                    disabled={submitReviewMutation.isPending || !newReview.comment}
                  >
                    {submitReviewMutation.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                    ) : (
                      "Submit Review"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Reviews List */}
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{review.user?.profile?.full_name || review.user?.name || "Anonymous"}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
                          />
                        ))}
                      </div>
                    </div>
                    {review.title && <p className="font-medium mt-1">{review.title}</p>}
                    <p className="text-muted-foreground mt-1">{review.comment}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm text-muted-foreground">{new Date(review.created_at).toLocaleDateString()}</span>
                      <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
                        <ThumbsUp className="h-4 w-4" />
                        Helpful ({review.helpful_count || 0})
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {reviews.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No reviews yet. Be the first to review this product!
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="shipping" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Shipping Information</h3>
              <div className="space-y-3">
                <p>• Standard Shipping: 5-7 business days - Free</p>
                <p>• Express Shipping: 2-3 business days - $9.99</p>
                <p>• Next Day Delivery: 1 business day - $19.99</p>
                <p className="text-muted-foreground mt-4">
                  Orders placed before 2 PM are shipped the same day. 
                  Free returns within 30 days.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {relatedProducts.map((relatedProduct) => (
              <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-square bg-muted">
                    <img 
                      src={relatedProduct.image_url || "/placeholder.svg"} 
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <p className="text-sm font-medium line-clamp-2">{relatedProduct.name}</p>
                    <p className="text-primary font-bold mt-1">${Number(relatedProduct.price).toFixed(2)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
