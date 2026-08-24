import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Star, Send } from "lucide-react";
import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);

  useEffect(() => {
    http.get<any>(`${API}/reviews`).then(res => {
      setReviews(res.data?.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async () => {
    if (!newReview.trim()) return;
    try {
      await http.post(`${API}/reviews`, { content: newReview, rating });
      setNewReview("");
      setRating(5);
      const res = await http.get<any>(`${API}/reviews`);
      setReviews(res.data?.data || []);
    } catch {}
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reviews</h1>

      <Card className="mb-6">
        <CardHeader><CardTitle>Write a Review</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(s => (
              <button key={s} onClick={() => setRating(s)}>
                <Star className={`h-6 w-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
              </button>
            ))}
          </div>
          <Textarea placeholder="Write your review..." value={newReview} onChange={e => setNewReview(e.target.value)} />
          <Button onClick={handleSubmit}><Send className="h-4 w-4 mr-2" />Submit Review</Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {reviews.map(review => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`} />
                  ))}
                </div>
                <Badge variant="outline">{review.rating}/5</Badge>
              </div>
              <p className="text-sm">{review.content}</p>
              <p className="text-xs text-muted-foreground mt-2">{new Date(review.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        ))}
        {reviews.length === 0 && !loading && <p className="text-center text-muted-foreground py-8">No reviews yet</p>}
      </div>
    </div>
  );
}
