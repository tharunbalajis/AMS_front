import { http } from "@ams/utils";

export const complaintsApi = {
  // Complaints
  getAll:        (params?: Record<string, unknown>) => http.get("/complaints", { params }),
  getById:       (id: string) => http.get(`/complaints/${id}`),
  create:        (data: Record<string, unknown>) => http.post("/complaints", data),
  update:        (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}`, data),
  assign:        (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}/assign`, data),
  updateStatus:  (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}/status`, data),
  submitRating:  (id: string, data: Record<string, unknown>) => http.post(`/complaints/${id}/rating`, data),
  addMedia:      (id: string, data: FormData) => http.post(`/complaints/${id}/media`, data),

  // Dashboard (dedicated aggregation endpoint — returns by_status, critical_count, top_categories, etc.)
  getDashboard:  (params?: Record<string, unknown>) => http.get("/complaints/dashboard", { params }),
  getHeatmap:   (params?: Record<string, unknown>) => http.get("/complaints/heatmap", { params }),
  getByFloor:   (params?: Record<string, unknown>) => http.get("/complaints/by-floor", { params }),

  // Categories
  getCategories:    (params?: Record<string, unknown>) => http.get("/complaint-categories", { params }),
  createCategory:   (data: Record<string, unknown>) => http.post("/complaint-categories", data),
  updateCategory:   (id: string, data: Record<string, unknown>) => http.put(`/complaint-categories/${id}`, data),
  deleteCategory:   (id: string) => http.delete(`/complaint-categories/${id}`),

  // SLA priorities
  getSlaPriorities:    (params?: Record<string, unknown>) => http.get("/complaint-sla-priorities", { params }),
  updateSlaPriorities: (data: Record<string, unknown>) => http.put("/complaint-sla-priorities", data),

  // Staff (for assignment dropdown)
  getStaff:      (params?: Record<string, unknown>) => http.get("/staff", { params }),
};
