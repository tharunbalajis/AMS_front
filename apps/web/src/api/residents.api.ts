import { http } from "@ams/utils";

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

export interface InactiveOwner {
  id: string;
  resident_id: string;
  full_name: string;
  unit_id: number | null;
  unit_number: string | null;
  block_name: string | null;
  block_id: number | null;
  label: string;
}

export interface Resident {
  id: string;
  full_name: string;
  email: string | null;
  mobile_primary: string;
  resident_type: 'OWNER' | 'TENANT';
  move_in_date: string | null;
  move_out_date: string | null;
  is_active: boolean;
  society_id: number;
  unit_id: number | null;
  owner_resident_id: string | null;
  unit_number: string | null;
  unit_type: string | null;
  block_id: number | null;
  block_name: string | null;
  society_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  unit_id: number;
  unit_number: string;
  floor: number;
  unit_type: string | null;
  block_id: number;
  block_name: string | null;
  society_id: number;
  occupancy_status: 'VACANT' | 'OWNER_OCCUPIED' | 'RENTED';
  parking_slots: number;
  owner_id: string | null;
  owner_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
}

export interface Block {
  block_id: number;
  block_name: string;
  total_floors: number;
  total_units: number;
  occupied_units: number;
  description: string | null;
}

export const residentsApi = {
  getAll: (params?: Record<string, unknown>) =>
    http.get<ApiResponse<Resident[]>>("/residents", { params }).then(r => r.data),

  getById: (id: string) =>
    http.get<ApiResponse<Resident>>(`/residents/${id}`).then(r => r.data),

  create: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Record<string, unknown>>>("/residents", data).then(r => r.data),

  update: (id: string, data: Record<string, unknown>) =>
    http.put<ApiResponse<Record<string, unknown>>>(`/residents/${id}`, data).then(r => r.data),

  remove: (id: string) =>
    http.delete<ApiResponse<Record<string, unknown>>>(`/residents/${id}`).then(r => r.data),

  getUnits: (params?: { society_id?: number; block_id?: number; search?: string; page?: number; page_size?: number; unit_type?: string; occupancy_status?: string }) =>
    http.get<ApiResponse<Unit[]>>("/units", { params }).then(r => r.data),

  getBlocks: (params?: { society_id?: number }) =>
    http.get<ApiResponse<Block[]>>("/blocks", { params }).then(r => r.data),

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
    http.post<ApiResponse<{ total: number; valid: Record<string, unknown>[]; invalid: Record<string, unknown>[] }>>(
      "/residents/import", { rows }
    ).then(r => r.data),

  importConfirm: (rows: Record<string, unknown>[]) =>
    http.post<ApiResponse<{ inserted: number; message: string }>>("/residents/import/confirm", { rows }).then(r => r.data),

  getTimeline: (id: string) =>
    http.get<ApiResponse<{ resident: Record<string, unknown>; events: Record<string, unknown>[] }>>(`/residents/${id}/timeline`).then(r => r.data),

  getVehicles: (params?: Record<string, unknown>) =>
    http.get<ApiResponse<Record<string, unknown>[]>>('/vehicles', { params }).then(r => r.data),

  addVehicle: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Record<string, unknown>>>(`/residents/${data.resident_id}/vehicles`, data).then(r => r.data),

  getPets: (params?: Record<string, unknown>) =>
    http.get<ApiResponse<Record<string, unknown>[]>>('/pets', { params }).then(r => r.data),

  addPet: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Record<string, unknown>>>(`/residents/${data.resident_id}/pets`, data).then(r => r.data),

  getLeases: (params?: Record<string, unknown>) =>
    http.get<ApiResponse<Record<string, unknown>[]>>("/residents/leases", { params }).then(r => r.data),

  createLease: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Record<string, unknown>>>("/residents/leases", data).then(r => r.data),

  updateLease: (id: string, data: Record<string, unknown>) =>
    http.put<ApiResponse<Record<string, unknown>>>(`/residents/leases/${id}`, data).then(r => r.data),

  createBlock: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Block>>('/blocks', data).then(r => r.data),

  updateBlock: (id: number, data: Record<string, unknown>) =>
    http.put<ApiResponse<Block>>(`/blocks/${id}`, data).then(r => r.data),

  createUnit: (data: Record<string, unknown>) =>
    http.post<ApiResponse<Unit>>('/units', data).then(r => r.data),

  getParkingSlots: (unitId: number, societyId?: number) =>
    http.get<ApiResponse<Unit>>(`/units/${unitId}`, { params: societyId ? { society_id: societyId } : {} }).then(r => r.data),

  getInactiveOwners: (params?: { society_id?: number; block_id?: number }) =>
    http.get<ApiResponse<InactiveOwner[]>>('/residents/inactive-owners', { params }).then(r => r.data),

  createUnitWithOwner: async (unitData: Record<string, unknown>, ownerData: Record<string, unknown> | null) => {
    const unit = await residentsApi.createUnit(unitData);
    const unitId = (unit as any)?.data?.unit_id ?? (unit as any)?.unit_id;
    if (ownerData && unitId) {
      await residentsApi.create({ ...ownerData, unit_id: unitId });
    }
    return unit;
  },

  endLeaseAndMoveOut: async (residentId: string, leaseId: string, moveOutDate: string) => {
    await residentsApi.updateLease(leaseId, { status: 'TERMINATED' });
    return residentsApi.moveOut(residentId, { move_out_date: moveOutDate });
  },

  moveOut: (id: string, data: Record<string, unknown>) =>
    http.put<ApiResponse<Record<string, unknown>>>(`/residents/${id}/move-out`, data).then(r => r.data),

  getResidentQR: (id: string) =>
    http.get<ApiResponse<Record<string, unknown>>>(`/residents/${id}/qr`).then(r => r.data),

  importPreviewWithSociety: (rows: Record<string, unknown>[], societyId?: number) =>
    http.post<ApiResponse<{ total: number; valid: Record<string, unknown>[]; invalid: Record<string, unknown>[] }>>(
      '/residents/import', { rows, society_id: societyId }
    ).then(r => r.data),
};
