import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { jobsApi } from "../api";
import type { PostJobInput, ApplyToJobInput, ShortlistApplicantInput } from "../validators";

export function useJob(id: string) {
  return useQuery({
    queryKey: ["jobs", id],
    queryFn: () => jobsApi.getById(id),
    enabled: !!id,
  });
}

export function useEmployerJobs(employerId: string) {
  return useQuery({
    queryKey: ["jobs", "employer", employerId],
    queryFn: () => jobsApi.getEmployerJobs(employerId),
    enabled: !!employerId,
  });
}

export function useJobApplications(jobPostId: string) {
  return useQuery({
    queryKey: ["jobs", jobPostId, "applications"],
    queryFn: () => jobsApi.getApplications(jobPostId),
    enabled: !!jobPostId,
  });
}

export function usePostJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostJobInput) => jobsApi.postJob(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ApplyToJobInput) => jobsApi.apply(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useShortlistApplicant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ShortlistApplicantInput) => jobsApi.shortlist(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useCloseJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => jobsApi.closeJob(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["jobs"] }),
  });
}

export function useSearchJobs(query: string) {
  return useQuery({
    queryKey: ["jobs", "search", query],
    queryFn: () => jobsApi.search(query),
    enabled: query.length >= 2,
  });
}
