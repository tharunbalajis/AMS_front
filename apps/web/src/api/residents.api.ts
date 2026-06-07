import { http } from "@ams/utils";

export const residentsApi = {
  getAll: (params?: Record<string, unknown>) => http.get("/residents", { params }),
  getById: (id: string) => http.get(`/residents/${id}`),
  create: (data: Record<string, unknown>) => http.post("/residents", data),
  
  update: (id: string, data: Record<string, unknown>) => http.put(`/residents/${id}`, data),
  remove: (id: string) => http.delete(`/residents/${id}`),
  getUnits: (params?: Record<string, unknown>) => http.get("/units", { params }),
  getBlocks: (params?: Record<string, unknown>) => http.get("/blocks", { params }),

  exportCsv: async (societyId?: number) => {
    const response = await http.get("/residents/export", {
      params: societyId ? { society_id: societyId } : {},
      responseType: "blob",
    });
    const url = URL.createObjectURL(response.data as Blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `residents_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importPreview: (rows: Record<string, unknown>[]) =>
    http.post<{ total: number; valid: Record<string, unknown>[]; invalid: Record<string, unknown>[] }>(
      "/residents/import", { rows }
    ),

  importConfirm: (rows: Record<string, unknown>[]) =>
    http.post<{ inserted: number; message: string }>("/residents/import/confirm", { rows }),

  getTimeline: (id: string) =>
    http.get<{ resident: Record<string, unknown>; events: Record<string, unknown>[] }>(`/residents/${id}/timeline`),

  getVehicles: (params?: Record<string, unknown>) => http.get('/vehicles', { params }),
  addVehicle: (data: Record<string, unknown>) => http.post(`/residents/${data.resident_id}/vehicles`, data),

  getPets: (params?: Record<string, unknown>) => http.get('/pets', { params }),
  addPet: (data: Record<string, unknown>) => http.post(`/residents/${data.resident_id}/pets`, data),

  getLeases: (params?: Record<string, unknown>) => http.get("/residents/leases", { params }),
  createLease: (data: Record<string, unknown>) => http.post("/residents/leases", data),
  updateLease: (id: string, data: Record<string, unknown>) => http.put(`/residents/leases/${id}`, data),

  createBlock: (data: Record<string, unknown>) => http.post('/blocks', data),
  updateBlock: (id: number, data: Record<string, unknown>) => http.put(`/blocks/${id}`, data),

  createUnit: (data: Record<string, unknown>) => http.post('/units', data),

  moveOut: (id: string, data: Record<string, unknown>) => http.put(`/residents/${id}/move-out`, data),

  getResidentQR: (id: string) => http.get(`/residents/${id}/qr`),

  importPreviewWithSociety: (rows: Record<string, unknown>[], societyId?: number) =>
    http.post<{ total: number; valid: Record<string, unknown>[]; invalid: Record<string, unknown>[] }>(
      '/residents/import', { rows, society_id: societyId }
    ),
};
