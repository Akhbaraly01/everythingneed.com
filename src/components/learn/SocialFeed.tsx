import { useState, useEffect } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Heart, MessageCircle, Share2, Send, Plus, Video, Image, FileText, Loader2, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  category: string;
  media_url: string | null;
  media_type: string | null;
  status: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
  isLiked?: boolean;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  profile?: {
    full_name: string;
    avatar_url: string | null;
  };
}

const categories = [
  "Technology", "Business", "Marketing", "Agriculture", 
  "Healthcare", "Design", "Blockchain", "Languages", "Finance"
];

const SocialFeed = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "", mediaType: "" });
  const [submitting, setSubmitting] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentLoading, setCommentLoading] = useState(false);

  useEffect(() => {
    fetchPosts();
  }, [user]);

  const fetchPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('learn_posts')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles for each post
      const postsWithProfiles = await Promise.all(
        (postsData || []).map(async (post) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', post.user_id)
            .single();

          let isLiked = false;
          if (user) {
            const { data: like } = await supabase
              .from('learn_post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .single();
            isLiked = !!like;
          }

          return { ...post, profile, isLiked };
        })
      );

      setPosts(postsWithProfiles);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      toast.error("Please login to create a post");
      return;
    }

    if (!newPost.title || !newPost.content || !newPost.category) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('learn_posts')
        .insert({
          user_id: user.id,
          title: newPost.title,
          content: newPost.content,
          category: newPost.category,
          media_type: newPost.mediaType || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success("Post submitted for admin approval!");
      setShowCreateDialog(false);
      setNewPost({ title: "", content: "", category: "", mediaType: "" });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      toast.error("Please login to like posts");
      return;
    }

    try {
      if (isLiked) {
        await supabase
          .from('learn_post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('learn_post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }

      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              isLiked: !isLiked, 
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1 
            }
          : post
      ));
    } catch (error: any) {
      toast.error("Failed to update like");
    }
  };

  const handleOpenComments = async (postId: string) => {
    setSelectedPost(postId);
    setCommentLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('learn_post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const commentsWithProfiles = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();
          return { ...comment, profile };
        })
      );

      setComments(commentsWithProfiles);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setCommentLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!user || !selectedPost || !newComment.trim()) return;

    try {
      const { error } = await supabase
        .from('learn_post_comments')
        .insert({
          post_id: selectedPost,
          user_id: user.id,
          content: newComment.trim()
        });

      if (error) throw error;

      setNewComment("");
      handleOpenComments(selectedPost);
      
      setPosts(posts.map(post =>
        post.id === selectedPost
          ? { ...post, comments_count: post.comments_count + 1 }
          : post
      ));
    } catch (error: any) {
      toast.error("Failed to add comment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Post Button */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogTrigger asChild>
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
            <CardContent className="flex items-center gap-4 p-4">
              <Avatar>
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-muted-foreground">
                Share your knowledge with the community...
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Create Post
              </Button>
            </CardContent>
          </Card>
        </DialogTrigger>

        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Educational Post</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Post Title"
              value={newPost.title}
              onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            />
            <Textarea
              placeholder="Share your knowledge, tips, or educational content..."
              rows={5}
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            />
            <div className="flex gap-3">
              <Select value={newPost.category} onValueChange={(v) => setNewPost({ ...newPost, category: v })}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={newPost.mediaType} onValueChange={(v) => setNewPost({ ...newPost, mediaType: v })}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Media" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="h-4 w-4" />
                      Video
                    </div>
                  </SelectItem>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <Image className="h-4 w-4" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="document">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Document
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              ⚠️ Your post will be reviewed by an admin before publishing.
            </p>
            <Button onClick={handleCreatePost} disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit for Review
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Posts Feed */}
      {posts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
          </CardContent>
        </Card>
      ) : (
        posts.map((post) => (
          <Card key={post.id} className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {post.profile?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.profile?.full_name || 'Anonymous'}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary">{post.category}</Badge>
              </div>
            </CardHeader>
            
            <CardContent className="pb-3">
              <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{post.content}</p>
              
              {post.media_type && (
                <div className="mt-3 p-3 bg-muted rounded-lg flex items-center gap-2">
                  {post.media_type === 'video' && <Video className="h-5 w-5 text-primary" />}
                  {post.media_type === 'image' && <Image className="h-5 w-5 text-primary" />}
                  {post.media_type === 'document' && <FileText className="h-5 w-5 text-primary" />}
                  <span className="text-sm capitalize">{post.media_type} attached</span>
                </div>
              )}
            </CardContent>

            <CardFooter className="border-t pt-3 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleLike(post.id, post.isLiked || false)}
                  className={post.isLiked ? "text-red-500" : ""}
                >
                  <Heart className={`h-4 w-4 mr-1 ${post.isLiked ? "fill-current" : ""}`} />
                  {post.likes_count}
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenComments(post.id)}
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      {post.comments_count}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Comments</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 max-h-80 overflow-y-auto">
                      {commentLoading ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : comments.length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">No comments yet</p>
                      ) : (
                        comments.map((comment) => (
                          <div key={comment.id} className="flex gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback>
                                {comment.profile?.full_name?.charAt(0) || 'U'}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 bg-muted rounded-lg p-3">
                              <p className="font-medium text-sm">{comment.profile?.full_name || 'Anonymous'}</p>
                              <p className="text-sm">{comment.content}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    {user && (
                      <div className="flex gap-2 mt-4">
                        <Input
                          placeholder="Write a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                        />
                        <Button size="icon" onClick={handleAddComment}>
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>

                <Button variant="ghost" size="sm">
                  <Share2 className="h-4 w-4 mr-1" />
                  {post.shares_count}
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))
      )}
    </div>
  );
};

export default SocialFeed;
