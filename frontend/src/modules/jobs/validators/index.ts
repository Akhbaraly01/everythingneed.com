import { z } from "zod";

export const PostJobSchema = z.object({
  employerId: z.string().uuid(),
  title: z.string().min(2).max(200),
  description: z.string().min(10).max(5000),
  company: z.string().max(100).optional(),
  location: z.string().max(100).optional(),
  isRemote: z.boolean().optional(),
  jobType: z.enum(["full_time", "part_time", "contract", "internship", "freelance"]),
  experienceLevel: z.enum(["entry", "junior", "mid", "senior", "lead", "executive"]).optional(),
  salaryMin: z.number().min(0).optional(),
  salaryMax: z.number().min(0).optional(),
  skills: z.array(z.string()).optional(),
  benefits: z.array(z.string()).optional(),
});

export const ApplyToJobSchema = z.object({
  jobPostId: z.string().uuid(),
  applicantId: z.string().uuid(),
  coverLetter: z.string().max(5000).optional(),
  resumeUrl: z.string().url().optional(),
  portfolioUrl: z.string().url().optional(),
  expectedSalary: z.number().min(0).optional(),
  availableFrom: z.string().optional(),
});

export const ShortlistApplicantSchema = z.object({
  applicationId: z.string().uuid(),
  notes: z.string().max(1000).optional(),
});

export type PostJobInput = z.infer<typeof PostJobSchema>;
export type ApplyToJobInput = z.infer<typeof ApplyToJobSchema>;
export type ShortlistApplicantInput = z.infer<typeof ShortlistApplicantSchema>;
