import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface ExpertReview {
  id: string;
  expert_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
}

export const useExpertReviews = (expertId?: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["expert-reviews", expertId],
    queryFn: async () => {
      if (!expertId) return [];
      const { data, error } = await supabase
        .from("expert_reviews")
        .select("*")
        .eq("expert_id", expertId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ExpertReview[];
    },
    enabled: !!expertId,
  });

  const addReview = useMutation({
    mutationFn: async ({ rating, comment }: { rating: number; comment: string }) => {
      if (!user || !expertId) throw new Error("Not authenticated or no expert");
      const { error } = await supabase.from("expert_reviews").insert({
        user_id: user.id,
        expert_id: expertId,
        rating,
        comment,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", expertId] });
      toast({ title: "Review submitted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to submit review", variant: "destructive" });
    },
  });

  const updateReview = useMutation({
    mutationFn: async ({ reviewId, rating, comment }: { reviewId: string; rating: number; comment: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("expert_reviews")
        .update({ rating, comment })
        .eq("id", reviewId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", expertId] });
      toast({ title: "Review updated!" });
    },
  });

  const deleteReview = useMutation({
    mutationFn: async (reviewId: string) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("expert_reviews")
        .delete()
        .eq("id", reviewId)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expert-reviews", expertId] });
      toast({ title: "Review deleted!" });
    },
  });

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
    : 0;

  const userReview = reviews.find(r => r.user_id === user?.id);

  return {
    reviews,
    isLoading,
    addReview: addReview.mutate,
    updateReview: updateReview.mutate,
    deleteReview: deleteReview.mutate,
    averageRating,
    reviewCount: reviews.length,
    userReview,
    isSubmitting: addReview.isPending || updateReview.isPending,
  };
};