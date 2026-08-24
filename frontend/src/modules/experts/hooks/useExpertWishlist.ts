import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@core/api/laravelGateway";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { ExpertWishlist } from "@core/api/types";

export const useExpertWishlist = () => {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: wishlistItems = [], isLoading } = useQuery({
    queryKey: ["expert-wishlist", user?.id],
    queryFn: async () => {
      if (!user) return [];
      return (await db
        .from("expert_wishlists")
        .select("*")
        .eq("user_id", user.id)) as ExpertWishlist[];
    },
    enabled: !!user,
  });

  const addToWishlist = useMutation({
    mutationFn: async (expertId: string) => {
      if (!user) throw new Error("Not authenticated");
      await db
        .from("expert_wishlists")
        .insert({ user_id: user.id, expert_id: expertId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-wishlist"] });
      toast({ title: "Expert added to favorites" });
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast({ title: "Already in favorites" });
      } else {
        toast({ title: "Failed to add to favorites", variant: "destructive" });
      }
    },
  });

  const removeFromWishlist = useMutation({
    mutationFn: async (expertId: string) => {
      if (!user) throw new Error("Not authenticated");
      const row = await db
        .from("expert_wishlists")
        .select("*")
        .eq("user_id", user.id)
        .eq("expert_id", expertId)
        .maybeSingle();
      if (!row) return;
      await db.from("expert_wishlists").delete().eq("id", row.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-wishlist"] });
      toast({ title: "Removed from favorites" });
    },
  });

  const isInWishlist = (expertId: string) => {
    return wishlistItems.some((item: any) => item.expert_id === expertId);
  };

  const toggleWishlist = async (expertId: string) => {
    if (!isAuthenticated) {
      toast({ title: "Please sign in to save experts", variant: "destructive" });
      return;
    }
    if (isInWishlist(expertId)) {
      await removeFromWishlist.mutateAsync(expertId);
    } else {
      await addToWishlist.mutateAsync(expertId);
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
