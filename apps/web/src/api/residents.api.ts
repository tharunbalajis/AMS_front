import { http } from "@ams/utils";

export const residentsApi = {
  getAll: (params?: Record<string, unknown>) => http.get("/residents", { params }),
  getById: (id: number) => http.get(`/residents/${id}`),
  create: (data: Record<string, unknown>) => http.post("/residents", data),
  update: (id: number, data: Record<string, unknown>) => http.put(`/residents/${id}`, data),
  remove: (id: number) => http.delete(`/residents/${id}`),
  getUnits: (params?: Record<string, unknown>) => http.get("/units", { params }),
  getBlocks: (params?: Record<string, unknown>) => http.get("/blocks", { params }),
};
