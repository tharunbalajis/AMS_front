import { http } from "@ams/utils";

export const complaintsApi = {
  getAll: (params?: Record<string, unknown>) => http.get("/complaints", { params }),
  getById: (id: number) => http.get(`/complaints/${id}`),
  create: (data: Record<string, unknown>) => http.post("/complaints", data),
  update: (id: number, data: Record<string, unknown>) => http.put(`/complaints/${id}`, data),
};
