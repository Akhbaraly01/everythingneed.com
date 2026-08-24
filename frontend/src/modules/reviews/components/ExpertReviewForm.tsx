import { useState } from "react";
import { Button } from "@shared/ui/button";
import { Textarea } from "@shared/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@shared/ui/card";
import { Star } from "lucide-react";
import { useExpertReviews } from "@/hooks/useExpertReviews";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

interface ExpertReviewFormProps {
  expertId: string;
  expertName: string;
  onClose?: () => void;
}

const ExpertReviewForm = ({ expertId, expertName, onClose }: ExpertReviewFormProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { addReview, userReview, updateReview, isSubmitting } = useExpertReviews(expertId);
  const [rating, setRating] = useState(userReview?.rating || 0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState(userReview?.comment || "");

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground mb-4">Please sign in to leave a review</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </CardContent>
      </Card>
    );
  }

  const handleSubmit = () => {
    if (rating === 0) return;
    
    if (userReview) {
      updateReview({ reviewId: userReview.id, rating, comment });
    } else {
      addReview({ rating, comment });
    }
    onClose?.();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {userReview ? "Update Your Review" : "Leave a Review"} for {expertName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Star Rating */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Your Rating</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="focus:outline-none transition-transform hover:scale-110"
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                onClick={() => setRating(star)}
              >
                <Star
                  className={`h-8 w-8 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment */}
        <div>
          <p className="text-sm text-muted-foreground mb-2">Your Comment (Optional)</p>
          <Textarea
            placeholder="Share your experience with this expert..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
          />
        </div>

        {/* Submit */}
        <div className="flex gap-2">
          <Button 
            onClick={handleSubmit} 
            disabled={rating === 0 || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Submitting..." : userReview ? "Update Review" : "Submit Review"}
          </Button>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ExpertReviewForm;