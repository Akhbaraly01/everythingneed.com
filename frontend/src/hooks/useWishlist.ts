import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { Wishlist } from "@core/api/types";

export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return (await db
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)) as Wishlist[];
    },
    enabled: !!user,
  });

  const addToWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");
      await db
        .from("wishlists")
        .insert({ user_id: user.id, product_id: productId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: "Added to wishlist" });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast({ title: "Already in wishlist" });
      } else {
        toast({ title: "Failed to add to wishlist", variant: "destructive" });
      }
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (productId: string) => {
      if (!user) throw new Error("Not authenticated");
      const row = await db
        .from("wishlists")
        .select("*")
        .eq("user_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (!row) return;
      await db.from("wishlists").delete().eq("id", row.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      toast({ title: "Removed from wishlist" });
    },
  });

  const isInWishlist = (productId: string) => {
    return wishlistItems.some((item: any) => item.product_id === productId);
  };

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to save items", variant: "destructive" });
      return;
    }
    if (isInWishlist(productId)) {
      await removeFromWishlist.mutateAsync(productId);
    } else {
      await addToWishlist.mutateAsync(productId);
    }
  };

  return {
    wishlistItems,
    isLoading,
    addToWishlist: addToWishlist.mutate,
    removeFromWishlist: removeFromWishlist.mutate,
    isInWishlist,
    toggleWishlist,
    wishlistCount: wishlistItems.length,
  };
};
