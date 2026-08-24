import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { learnApi } from "../api";
import type { CreatePostInput, UpdatePostInput, SendDirectMessageInput } from "../validators";

export function useLearnPost(id: string) {
  return useQuery({
    queryKey: ["learn", "posts", id],
    queryFn: () => learnApi.getPost(id),
    enabled: !!id,
  });
}

export function useFeaturedPosts() {
  return useQuery({
    queryKey: ["learn", "posts", "featured"],
    queryFn: () => learnApi.getFeaturedPosts(),
  });
}

export function usePostComments(postId: string) {
  return useQuery({
    queryKey: ["learn", "posts", postId, "comments"],
    queryFn: () => learnApi.getComments(postId),
    enabled: !!postId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreatePostInput) => learnApi.createPost(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePostInput }) => learnApi.updatePost(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => learnApi.deletePost(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}

export function useLikePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId }: { postId: string; userId: string }) => learnApi.likePost(postId, userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}

export function useAddComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, userId, content }: { postId: string; userId: string; content: string }) =>
      learnApi.addComment(postId, userId, content),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}

export function useSendDirectMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SendDirectMessageInput) => learnApi.sendDirectMessage(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["learn"] }),
  });
}
