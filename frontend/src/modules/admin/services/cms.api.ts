import { http } from "@core/api";

const API = import.meta.env.VITE_API_URL || "/api";

export interface CmsPage {
  id: string;
  title: string;
  slug: string;
  status: string;
  updated_at: string;
}

export interface CmsBlog {
  id: string;
  title: string;
  author: string;
  status: string;
  published_at: string;
}

export interface CmsBanner {
  id: string;
  title: string;
  position: string;
  is_active: boolean;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  priority: string;
  is_active: boolean;
}

export const cmsApi = {
  pages: {
    list: () => http.get<{ data: CmsPage[] }>(`${API}/admin/cms/pages`),
    create: (data: Partial<CmsPage>) => http.post<{ data: CmsPage }>(`${API}/admin/cms/pages`, data),
    delete: (id: string) => http.delete<{ message: string }>(`${API}/admin/cms/pages/${id}`),
  },
  blog: {
    list: () => http.get<{ data: CmsBlog[] }>(`${API}/admin/cms/blog`),
    create: (data: Partial<CmsBlog>) => http.post<{ data: CmsBlog }>(`${API}/admin/cms/blog`, data),
    delete: (id: string) => http.delete<{ message: string }>(`${API}/admin/cms/blog/${id}`),
  },
  banners: {
    list: () => http.get<{ data: CmsBanner[] }>(`${API}/admin/cms/banners`),
    create: (data: Partial<CmsBanner>) => http.post<{ data: CmsBanner }>(`${API}/admin/cms/banners`, data),
    delete: (id: string) => http.delete<{ message: string }>(`${API}/admin/cms/banners/${id}`),
  },
  announcements: {
    list: () => http.get<{ data: CmsAnnouncement[] }>(`${API}/admin/cms/announcements`),
    create: (data: Partial<CmsAnnouncement>) => http.post<{ data: CmsAnnouncement }>(`${API}/admin/cms/announcements`, data),
    delete: (id: string) => http.delete<{ message: string }>(`${API}/admin/cms/announcements/${id}`),
  },
};
