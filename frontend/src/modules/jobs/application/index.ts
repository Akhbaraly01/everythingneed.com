/**
 * Jobs Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Jobs/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";
import type { JobPost, JobApplication } from "../domain";

// ── DTOs ─────────────────────────────────────────────────────────

export interface PostJobDTO {
  employerId: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  isRemote?: boolean;
  jobType: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  benefits?: string[];
}

export interface ApplyToJobDTO {
  jobPostId: string;
  applicantId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: number;
  availableFrom?: string;
}

export interface ShortlistApplicantDTO {
  applicationId: string;
  notes?: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface PostJobCommand {
  type: "PostJob";
  payload: PostJobDTO;
}

export interface UpdateJobCommand {
  type: "UpdateJob";
  payload: {
    jobPostId: string;
    data: Partial<PostJobDTO>;
  };
}

export interface CloseJobCommand {
  type: "CloseJob";
  payload: { jobPostId: string };
}

export interface ApplyToJobCommand {
  type: "ApplyToJob";
  payload: ApplyToJobDTO;
}

export interface ShortlistApplicantCommand {
  type: "ShortlistApplicant";
  payload: ShortlistApplicantDTO;
}

export interface RejectApplicantCommand {
  type: "RejectApplicant";
  payload: {
    applicationId: string;
    notes?: string;
  };
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetJobQuery {
  type: "GetJob";
  payload: { jobPostId: string };
}

export interface GetApplicationsQuery {
  type: "GetApplications";
  payload: {
    jobPostId: string;
    params?: QueryParams;
  };
}

export interface GetMyApplicationsQuery {
  type: "GetMyApplications";
  payload: {
    applicantId: string;
    params?: QueryParams;
  };
}

export interface GetJobPostsQuery {
  type: "GetJobPosts";
  payload: {
    employerId: string;
    params?: QueryParams;
  };
}

export interface SearchJobsQuery {
  type: "SearchJobs";
  payload: {
    query: string;
    params?: QueryParams;
  };
}

// ── Application Services ─────────────────────────────────────────

export interface JobApplicationService {
  postJob(command: PostJobCommand): Promise<JobPost>;
  updateJob(command: UpdateJobCommand): Promise<JobPost>;
  closeJob(command: CloseJobCommand): Promise<void>;
  applyToJob(command: ApplyToJobCommand): Promise<JobApplication>;
  shortlistApplicant(command: ShortlistApplicantCommand): Promise<JobApplication>;
  rejectApplicant(command: RejectApplicantCommand): Promise<JobApplication>;

  getJob(query: GetJobQuery): Promise<JobPost | null>;
  getApplications(query: GetApplicationsQuery): Promise<PaginatedResult<JobApplication>>;
  getMyApplications(query: GetMyApplicationsQuery): Promise<PaginatedResult<JobApplication>>;
  getJobPosts(query: GetJobPostsQuery): Promise<PaginatedResult<JobPost>>;
  searchJobs(query: SearchJobsQuery): Promise<PaginatedResult<JobPost>>;
}
