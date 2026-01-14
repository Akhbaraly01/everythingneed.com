import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import DirectMessage from "./DirectMessage";
import InteractiveQuizWidget from "./InteractiveQuizWidget";
import PollWidget from "./PollWidget";
import AchievementBadges from "./AchievementBadges";
import {
  Heart,
  MessageCircle,
  Share2,
  Play,
  BookOpen,
  Award,
  Send,
  MoreHorizontal,
  Loader2,
  GraduationCap,
  FileText,
  Video,
  MessageSquare,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  media_type: string | null;
  media_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  status: string;
  is_featured: boolean;
  author_name: string | null;
  author_avatar: string | null;
  created_at: string;
}

const campaignBanners = [
  {
    id: 1,
    title: "Free Web Development Bootcamp",
    description: "Learn HTML, CSS & JavaScript - Get Certified!",
    image: "https://images.unsplash.com/photo-1517180102446-f3ece451e9d8?w=800",
    badge: "FREE COURSE",
  },
  {
    id: 2,
    title: "Business Management Certification",
    description: "Join 10,000+ students - Limited spots available",
    image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=800",
    badge: "ENROLL NOW",
  },
  {
    id: 3,
    title: "Agriculture Technology Program",
    description: "Modern farming techniques with IoT certification",
    image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800",
    badge: "NEW BATCH",
  },
];

const FacebookStyleFeed = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [displayedPosts, setDisplayedPosts] = useState<Post[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [dmOpen, setDmOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; avatar?: string } | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const POSTS_PER_PAGE = 6;

  // Fetch posts
  const { data: posts = [] } = useQuery({
    queryKey: ["learn-posts-feed"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("learn_posts")
        .select("*")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as Post[];
    },
  });

  // Fetch user's liked posts
  const { data: likedPosts = [] } = useQuery({
    queryKey: ["user-likes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("learn_post_likes")
        .select("post_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((l) => l.post_id);
    },
    enabled: !!user,
  });

  // Fetch comments for visible posts
  const { data: commentsData = {} } = useQuery({
    queryKey: ["post-comments", Object.keys(showComments).filter((k) => showComments[k])],
    queryFn: async () => {
      const openPostIds = Object.keys(showComments).filter((k) => showComments[k]);
      if (openPostIds.length === 0) return {};

      const result: Record<string, any[]> = {};
      for (const postId of openPostIds) {
        const { data } = await supabase
          .from("learn_post_comments")
          .select("*, profiles:user_id(full_name, avatar_url)")
          .eq("post_id", postId)
          .order("created_at", { ascending: true })
          .limit(10);
        result[postId] = data || [];
      }
      return result;
    },
    enabled: Object.values(showComments).some((v) => v),
  });

  // Update displayed posts on load
  useEffect(() => {
    if (posts.length > 0) {
      setDisplayedPosts(posts.slice(0, POSTS_PER_PAGE));
      setHasMore(posts.length > POSTS_PER_PAGE);
    }
  }, [posts]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);

    const nextPage = page + 1;
    const start = nextPage * POSTS_PER_PAGE;
    const end = start + POSTS_PER_PAGE;
    const newPosts = posts.slice(0, end);

    setDisplayedPosts(newPosts);
    setPage(nextPage);
    setHasMore(end < posts.length);
    setLoading(false);
  }, [loading, hasMore, page, posts]);

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error("Not authenticated");

      const isLiked = likedPosts.includes(postId);
      if (isLiked) {
        await supabase.from("learn_post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
      } else {
        await supabase.from("learn_post_likes").insert({ post_id: postId, user_id: user.id });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-likes"] });
      queryClient.invalidateQueries({ queryKey: ["learn-posts-feed"] });
    },
  });

  // Comment mutation
  const commentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      if (!user) throw new Error("Not authenticated");
      await supabase.from("learn_post_comments").insert({
        post_id: postId,
        user_id: user.id,
        content,
      });
    },
    onSuccess: (_, { postId }) => {
      setCommentText((prev) => ({ ...prev, [postId]: "" }));
      queryClient.invalidateQueries({ queryKey: ["post-comments"] });
      queryClient.invalidateQueries({ queryKey: ["learn-posts-feed"] });
      toast.success("Comment posted!");
    },
  });

  const handleLike = (postId: string) => {
    if (!user) {
      toast.error("Please sign in to like posts");
      return;
    }
    likeMutation.mutate(postId);
  };

  const handleComment = (postId: string) => {
    const content = commentText[postId]?.trim();
    if (!content) return;
    if (!user) {
      toast.error("Please sign in to comment");
      return;
    }
    commentMutation.mutate({ postId, content });
  };

  const openDM = (userId: string, name: string, avatar?: string, postId?: string) => {
    if (!user) {
      toast.error("Please sign in to send messages");
      return;
    }
    setSelectedUser({ id: userId, name, avatar });
    setSelectedPostId(postId || null);
    setDmOpen(true);
  };

  const renderMediaContent = (post: Post) => {
    if (post.video_url || post.media_type === "video") {
      return (
        <div className="relative aspect-video bg-black rounded-lg overflow-hidden group">
          <video
            src={post.video_url || post.media_url || ""}
            poster={post.thumbnail_url || ""}
            controls
            className="w-full h-full object-cover"
          />
          {post.duration_minutes && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
              {post.duration_minutes} min
            </div>
          )}
        </div>
      );
    }

    if (post.media_url) {
      return (
        <div className="aspect-video bg-muted rounded-lg overflow-hidden">
          <img src={post.media_url} alt={post.title} className="w-full h-full object-cover" />
        </div>
      );
    }

    // Text-only post with styled background
    return (
      <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 min-h-[150px] flex items-center justify-center">
        <div className="text-center">
          {post.category === "Technology" && <BookOpen className="h-12 w-12 mx-auto mb-2 text-primary" />}
          {post.category === "Healthcare" && <FileText className="h-12 w-12 mx-auto mb-2 text-primary" />}
          {!["Technology", "Healthcare"].includes(post.category) && (
            <GraduationCap className="h-12 w-12 mx-auto mb-2 text-primary" />
          )}
        </div>
      </div>
    );
  };

  // Sample quiz data
  const quizzes = [
    {
      id: 1,
      title: "Web Development Basics",
      questions: [
        { question: "What does HTML stand for?", options: ["Hyper Text Markup Language", "High Tech Modern Language", "Hyper Transfer Markup Language"], correctIndex: 0 },
        { question: "Which CSS property controls text size?", options: ["text-size", "font-size", "text-style"], correctIndex: 1 },
      ],
    },
  ];

  // Sample poll data
  const polls = [
    {
      question: "What programming language should we teach next?",
      options: [
        { id: "1", text: "Python", votes: 156 },
        { id: "2", text: "JavaScript", votes: 203 },
        { id: "3", text: "Rust", votes: 89 },
        { id: "4", text: "Go", votes: 67 },
      ],
      category: "Technology",
    },
    {
      question: "How do you prefer to learn?",
      options: [
        { id: "1", text: "Video tutorials", votes: 312 },
        { id: "2", text: "Written guides", votes: 145 },
        { id: "3", text: "Hands-on projects", votes: 278 },
        { id: "4", text: "Live classes", votes: 98 },
      ],
      category: "Learning",
    },
  ];

  // User achievements for display
  const userAchievements = [
    { id: "first_post", name: "First Post", description: "Created your first post", icon: "📝", earned: true },
    { id: "helpful", name: "Helpful", description: "Received 10 likes", icon: "👍", earned: true },
    { id: "streak_7", name: "7-Day Streak", description: "Learned 7 days in a row", icon: "🔥", earned: false, progress: 5, total: 7 },
  ];

  // Mix campaign banners, quizzes, polls after every few posts
  const getContentWithBanners = () => {
    const content: any[] = [];
    let bannerIndex = 0;
    let quizIndex = 0;
    let pollIndex = 0;

    displayedPosts.forEach((post, index) => {
      content.push({ ...post, itemType: "post" });

      // Insert quiz after every 3 posts
      if ((index + 1) % 3 === 0 && quizIndex < quizzes.length) {
        content.push({ ...quizzes[quizIndex], itemType: "quiz" });
        quizIndex++;
      }

      // Insert poll after every 4 posts
      if ((index + 1) % 4 === 0 && pollIndex < polls.length) {
        content.push({ ...polls[pollIndex], itemType: "poll" });
        pollIndex++;
      }

      // Insert banner after every 6 posts
      if ((index + 1) % 6 === 0 && bannerIndex < campaignBanners.length) {
        content.push({ ...campaignBanners[bannerIndex], itemType: "banner" });
        bannerIndex++;
      }

      // Insert achievements section after 8 posts
      if (index === 7) {
        content.push({ achievements: userAchievements, itemType: "achievements" });
      }
    });

    return content;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Create Post Card */}
      {user && (
        <Card className="border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex gap-3">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  {user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Button variant="outline" className="w-full justify-start text-muted-foreground h-10 rounded-full">
                  Share what you learned today...
                </Button>
              </div>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t">
              <Button variant="ghost" size="sm" className="flex-1 gap-2">
                <Video className="h-4 w-4 text-red-500" />
                Video
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Article
              </Button>
              <Button variant="ghost" size="sm" className="flex-1 gap-2">
                <GraduationCap className="h-4 w-4 text-blue-500" />
                Course
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feed Content */}
      {getContentWithBanners().map((item, index) => {
        // Quiz Widget
        if (item.itemType === "quiz") {
          return (
            <InteractiveQuizWidget
              key={`quiz-${item.id}`}
              title={item.title}
              questions={item.questions}
              onComplete={(score) => toast.success(`Quiz complete! Score: ${score}%`)}
            />
          );
        }

        // Poll Widget
        if (item.itemType === "poll") {
          return (
            <PollWidget
              key={`poll-${index}`}
              question={item.question}
              options={item.options}
              category={item.category}
              onVote={(optionId) => console.log("Voted:", optionId)}
            />
          );
        }

        // Achievement Badges
        if (item.itemType === "achievements") {
          return <AchievementBadges key="achievements" />;
        }

        // Campaign Banner
        if (item.itemType === "banner") {
          return (
            <Card key={`banner-${item.id}`} className="overflow-hidden border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5">
              <div className="relative aspect-[3/1] overflow-hidden">
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent flex items-center">
                  <div className="p-6 text-white">
                    <Badge className="mb-2 bg-primary">{item.badge}</Badge>
                    <h3 className="text-xl font-bold mb-1">{item.title}</h3>
                    <p className="text-sm opacity-90 mb-3">{item.description}</p>
                    <Button size="sm" className="gap-2">
                      <Award className="h-4 w-4" />
                      Register Now
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          );
        }

        // Regular Post
        const post = item as Post;
        const isLiked = likedPosts.includes(post.id);
        const comments = commentsData[post.id] || [];

        return (
          <Card key={post.id} className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <Avatar className="cursor-pointer" onClick={() => openDM(post.user_id, post.author_name || "User", post.author_avatar || undefined, post.id)}>
                    <AvatarImage src={post.author_avatar || ""} />
                    <AvatarFallback>{(post.author_name || "U")[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm cursor-pointer hover:underline" onClick={() => openDM(post.user_id, post.author_name || "User", post.author_avatar || undefined, post.id)}>
                        {post.author_name || "Anonymous"}
                      </p>
                      {post.is_featured && (
                        <Badge variant="secondary" className="text-[10px]">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })} · {post.category}
                    </p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="pb-2 space-y-3">
              <div>
                <h3 className="font-semibold mb-1">{post.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
              </div>
              {renderMediaContent(post)}
            </CardContent>

            <CardFooter className="flex-col items-stretch pt-0 pb-3 px-4">
              {/* Stats row */}
              <div className="flex items-center justify-between text-xs text-muted-foreground py-2 border-b">
                <span>{post.likes_count} likes</span>
                <span>{post.comments_count} comments · {post.shares_count} shares</span>
              </div>

              {/* Action buttons */}
              <div className="flex gap-1 py-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`flex-1 gap-2 ${isLiked ? "text-red-500" : ""}`}
                  onClick={() => handleLike(post.id)}
                >
                  <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                  Like
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setShowComments((prev) => ({ ...prev, [post.id]: !prev[post.id] }))}
                >
                  <MessageCircle className="h-4 w-4" />
                  Comment
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => openDM(post.user_id, post.author_name || "User", post.author_avatar || undefined, post.id)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Message
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 gap-2">
                  <Share2 className="h-4 w-4" />
                  Share
                </Button>
              </div>

              {/* Comments section */}
              {showComments[post.id] && (
                <div className="pt-3 space-y-3 border-t mt-2">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={comment.profiles?.avatar_url} />
                        <AvatarFallback>
                          {(comment.profiles?.full_name || "U")[0].toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 bg-muted rounded-2xl px-3 py-2">
                        <p className="text-xs font-semibold">{comment.profiles?.full_name || "User"}</p>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Comment input */}
                  <div className="flex gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        {user?.email?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 flex gap-2">
                      <Input
                        placeholder="Write a comment..."
                        className="rounded-full bg-muted border-0 h-9"
                        value={commentText[post.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [post.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleComment(post.id);
                          }
                        }}
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-9 w-9"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentText[post.id]?.trim() || commentMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardFooter>
          </Card>
        );
      })}

      {/* Load More */}
      {hasMore && (
        <div className="text-center py-4">
          <Button variant="outline" onClick={loadMore} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load More
          </Button>
        </div>
      )}

      {/* Direct Message Dialog */}
      {selectedUser && (
        <DirectMessage
          isOpen={dmOpen}
          onClose={() => {
            setDmOpen(false);
            setSelectedUser(null);
            setSelectedPostId(null);
          }}
          receiverId={selectedUser.id}
          receiverName={selectedUser.name}
          receiverAvatar={selectedUser.avatar}
          postId={selectedPostId || undefined}
        />
      )}
    </div>
  );
};

export default FacebookStyleFeed;
