import { Card, CardContent } from "@shared/ui/card";
import { Avatar, AvatarFallback } from "@shared/ui/avatar";
import { Star, Trash2 } from "lucide-react";
import { Button } from "@shared/ui/button";
import { useExpertReviews, ExpertReview } from "@/hooks/useExpertReviews";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow } from "date-fns";

interface ExpertReviewsListProps {
  expertId: string;
}

const ExpertReviewsList = ({ expertId }: ExpertReviewsListProps) => {
  const { user } = useAuth();
  const { reviews, isLoading, deleteReview, averageRating, reviewCount } = useExpertReviews(expertId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="text-3xl font-bold">{averageRating.toFixed(1)}</p>
          <div className="flex gap-0.5 justify-center">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(averageRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{reviewCount} reviews</p>
        </div>
        <div className="flex-1 space-y-1">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = reviews.filter((r) => r.rating === star).length;
            const percentage = reviewCount > 0 ? (count / reviewCount) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2 text-xs">
                <span className="w-3">{star}</span>
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-yellow-400 rounded-full"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="w-8 text-muted-foreground">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviews.map((review: ExpertReview) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>U</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${
                                star <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      {review.comment && (
                        <p className="text-sm mt-2">{review.comment}</p>
                      )}
                    </div>
                  </div>
                  {user?.id === review.user_id && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8"
                      onClick={() => deleteReview(review.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExpertReviewsList;