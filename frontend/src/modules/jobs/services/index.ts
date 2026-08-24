import { http } from "@/core/api/client";
import { qs } from "@core/api";
import { eventBus } from "@core/events/EventBus";
import type { JobService } from "../domain";

export const jobService: JobService = {
  async postJob(data) {
    const result: any = await http.post("/api/jobs", data);
    const job = result.data;
    eventBus.emit("JobPosted", { jobPostId: job?.id, employerId: data.employerId, title: data.title, timestamp: new Date() });
    return job;
  },

  async applyToJob(data) {
    const result: any = await http.post(`/api/jobs/${data.jobPostId}/apply`, data);
    const application = result.data;
    eventBus.emit("ApplicationSubmitted", { applicationId: application?.id, jobPostId: data.jobPostId, applicantId: data.applicantId, timestamp: new Date() });
    return application;
  },

  async shortlistApplicant(applicationId, notes) {
    const result: any = await http.post(`/api/jobs/applications/${applicationId}/shortlist`, { notes });
    eventBus.emit("ApplicantShortlisted", { applicationId, timestamp: new Date() });
    return result.data;
  },

  async rejectApplicant(applicationId, notes) {
    const result: any = await http.post(`/api/jobs/applications/${applicationId}/reject`, { notes });
    return result.data;
  },

  async getJobById(jobPostId) {
    const data: any = await http.get(`/api/jobs/${jobPostId}`);
    return data.data || null;
  },

  async getApplicationsByJob(jobPostId, params) {
    const data: any = await http.get(`/api/jobs/${jobPostId}/applications${qs(params)}`);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getApplicationsByApplicant(applicantId, params) {
    const data: any = await http.get("/api/jobs/applications", { params: { applicant_id: applicantId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async getJobsByEmployer(employerId, params) {
    const data: any = await http.get("/api/jobs", { params: { employer_id: employerId, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },

  async searchJobs(query, params) {
    const data: any = await http.get("/api/jobs/search", { params: { q: query, ...params } } as any);
    return { items: data.data || [], total: data.meta?.total || 0 };
  },
};
