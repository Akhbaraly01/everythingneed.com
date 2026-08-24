/**
 * Jobs Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Jobs/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Money } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface JobPostId {
  value: string;
}

export interface JobApplicationId {
  value: string;
}

export interface JobStatus {
  value: "draft" | "published" | "closed" | "archived";
}

export interface ApplicationStatus {
  value: "submitted" | "reviewing" | "shortlisted" | "interviewed" | "offered" | "rejected" | "withdrawn";
}

export interface JobType {
  value: "full_time" | "part_time" | "contract" | "internship" | "freelance";
}

export interface ExperienceLevel {
  value: "entry" | "junior" | "mid" | "senior" | "lead" | "executive";
}

// ── Entities ─────────────────────────────────────────────────────

export interface JobPost {
  id: string;
  employerId: string;
  title: string;
  description: string;
  company?: string;
  companyLogo?: string;
  location?: string;
  isRemote: boolean;
  jobType: string;
  experienceLevel?: string;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  skills?: string[];
  benefits?: string[];
  status: string;
  applicationsCount: number;
  viewsCount: number;
  publishedAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobApplication {
  id: string;
  jobPostId: string;
  applicantId: string;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  expectedSalary?: number;
  availableFrom?: string;
  status: string;
  reviewedAt?: Date;
  shortlistedAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Domain Events ────────────────────────────────────────────────

export interface JobPostedEvent {
  type: "JobPosted";
  jobPostId: string;
  employerId: string;
  title: string;
  timestamp: Date;
}

export interface JobClosedEvent {
  type: "JobClosed";
  jobPostId: string;
  timestamp: Date;
}

export interface ApplicationSubmittedEvent {
  type: "ApplicationSubmitted";
  applicationId: string;
  jobPostId: string;
  applicantId: string;
  timestamp: Date;
}

export interface ApplicationReviewedEvent {
  type: "ApplicationReviewed";
  applicationId: string;
  jobPostId: string;
  status: string;
  timestamp: Date;
}

export interface ApplicantShortlistedEvent {
  type: "ApplicantShortlisted";
  applicationId: string;
  jobPostId: string;
  applicantId: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface JobService {
  postJob(data: {
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
  }): Promise<JobPost>;

  applyToJob(data: {
    jobPostId: string;
    applicantId: string;
    coverLetter?: string;
    resumeUrl?: string;
    portfolioUrl?: string;
    expectedSalary?: number;
    availableFrom?: string;
  }): Promise<JobApplication>;

  shortlistApplicant(applicationId: string, notes?: string): Promise<JobApplication>;
  rejectApplicant(applicationId: string, notes?: string): Promise<JobApplication>;

  getJobById(jobPostId: string): Promise<JobPost | null>;
  getApplicationsByJob(jobPostId: string, params?: any): Promise<{ items: JobApplication[]; total: number }>;
  getApplicationsByApplicant(applicantId: string, params?: any): Promise<{ items: JobApplication[]; total: number }>;
  getJobsByEmployer(employerId: string, params?: any): Promise<{ items: JobPost[]; total: number }>;
  searchJobs(query: string, params?: any): Promise<{ items: JobPost[]; total: number }>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class JobPostNotFoundError extends DomainError {
  constructor(jobPostId: string) {
    super(`Job post ${jobPostId} not found`, "JOB_POST_NOT_FOUND");
    this.name = "JobPostNotFoundError";
  }
}

export class JobApplicationNotFoundError extends DomainError {
  constructor(applicationId: string) {
    super(`Job application ${applicationId} not found`, "JOB_APPLICATION_NOT_FOUND");
    this.name = "JobApplicationNotFoundError";
  }
}

export class DuplicateApplicationError extends DomainError {
  constructor(jobPostId: string, applicantId: string) {
    super(`Applicant ${applicantId} has already applied to job ${jobPostId}`, "DUPLICATE_APPLICATION");
    this.name = "DuplicateApplicationError";
  }
}

export class JobNotPublishedError extends DomainError {
  constructor(jobPostId: string) {
    super(`Job post ${jobPostId} is not published`, "JOB_NOT_PUBLISHED");
    this.name = "JobNotPublishedError";
  }
}
