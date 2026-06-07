import { http } from "@ams/utils";

export const complaintsApi = {
  getAll:        (params?: Record<string, unknown>) => http.get("/complaints", { params }),
  getById:       (id: string) => http.get(`/complaints/${id}`),
  getCategories: (params?: Record<string, unknown>) => http.get("/complaint-categories", { params }),
  create:        (data: Record<string, unknown>) => http.post("/complaints", data),
  update:        (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}`, data),
  assign:        (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}/assign`, data),
  updateStatus:  (id: string, data: Record<string, unknown>) => http.put(`/complaints/${id}/status`, data),
};
