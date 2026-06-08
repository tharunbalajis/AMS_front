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

  // Parking slots helper (derives from unit data)
  getParkingSlots: (unitId: number, societyId?: number) =>
    http.get(`/units/${unitId}`, { params: societyId ? { society_id: societyId } : {} }),

  // Get inactive owners (for tenant assignment)
  // Accepts either a societyId number or a params object { society_id?, block_id? }
  getInactiveOwners: (arg?: number | Record<string, unknown>) => {
    let params: Record<string, unknown> = { page: 1, page_size: 200 };
    if (typeof arg === 'number') params = { ...params, society_id: arg, resident_type: 'OWNER', is_active: false };
    else if (arg && typeof arg === 'object') params = { ...params, ...arg };
    // prefer dedicated endpoint if backend supports it
    return http.get('/residents/inactive-owners', { params });
  },

  // Bulk create: create unit then owner in sequence (utility)
  createUnitWithOwner: async (unitData: Record<string, unknown>, ownerData: Record<string, unknown> | null) => {
    const unit = await http.post('/units', unitData);
    const unitId = (unit && (unit as any).data && (unit as any).data.unit_id) ?? (unit as any).unit_id;
    if (ownerData && unitId) {
      await http.post('/residents', { ...ownerData, unit_id: unitId });
    }
    return unit;
  },

  // End lease + move out together
  endLeaseAndMoveOut: async (residentId: string, leaseId: string, moveOutDate: string) => {
    await http.put(`/residents/leases/${leaseId}`, { status: 'TERMINATED' });
    return http.put(`/residents/${residentId}/move-out`, { move_out_date: moveOutDate });
  },

  moveOut: (id: string, data: Record<string, unknown>) => http.put(`/residents/${id}/move-out`, data),

  getResidentQR: (id: string) => http.get(`/residents/${id}/qr`),

  importPreviewWithSociety: (rows: Record<string, unknown>[], societyId?: number) =>
    http.post<{ total: number; valid: Record<string, unknown>[]; invalid: Record<string, unknown>[] }>(
      '/residents/import', { rows, society_id: societyId }
    ),
};
