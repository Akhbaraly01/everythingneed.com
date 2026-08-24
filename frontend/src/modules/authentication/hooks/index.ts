import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api";
import type { SignUpInput, SignInInput } from "../validators";

export function useSignUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SignUpInput) => authApi.signUp(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SignInInput) => authApi.signIn(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["auth"] }),
  });
}

export function useSession() {
  return useQuery({
    queryKey: ["auth", "session"],
    queryFn: () => authApi.getSession(),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.getCurrentUser(),
  });
}
