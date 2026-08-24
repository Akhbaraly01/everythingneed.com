import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { http } from "@/core/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Star } from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer: string;
  entity_name: string;
  created_at: string;
  replies?: { id: string; message: string; author: string; created_at: string }[];
}

export function ReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: review, isLoading } = useQuery<Review>({
    queryKey: ["review", id],
    queryFn: async () => {
      const { data } = await http.get<any>(`/api/reviews/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500" />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Review not found</p>
        <Button variant="link" onClick={() => navigate("/reviews")}>Back to reviews</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate("/reviews")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back
        </Button>
        <h1 className="text-2xl font-bold">Review</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{review.entity_name}</CardTitle>
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-muted-foreground">{review.comment}</p>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>By {review.reviewer}</span>
            <span>{new Date(review.created_at).toLocaleDateString()}</span>
          </div>
        </CardContent>
      </Card>

      {review.replies && review.replies.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Replies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.replies.map((reply) => (
              <div key={reply.id} className="border rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{reply.author}</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(reply.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm">{reply.message}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ReviewDetail;
