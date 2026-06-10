import { http } from "@ams/utils";

export interface ParkingSlot {
  id: string;
  slot_code: string;
  slot_type: string;
  parking_status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "MAINTENANCE";
  society_id: number;
  block_id: number | null;
  block_name: string | null;
  unit_id: number | null;
  is_active: boolean;
  created_at: string;
}

export interface ParkingParams {
  society_id?: number;
  block_id?: number;
  parking_status?: string;
  page?: number;
  page_size?: number;
}

async function extract<T>(res: any): Promise<T> {
  const body = res?.data;
  if (body?.data !== undefined) return body.data as T;
  return body as T;
}

export const parkingApi = {
  getSlots: async (params?: ParkingParams) => {
    const res = await http.get("/parking-slots", { params });
    const body = res.data;
    return {
      data:       (Array.isArray(body?.data) ? body.data : []) as ParkingSlot[],
      pagination: body?.pagination ?? { page: 1, page_size: 100, total: 0 },
    };
  },

  createSlot: async (data: Record<string, unknown>) => {
    const res = await http.post("/parking-slots", data);
    return extract<ParkingSlot>(res);
  },

  updateSlot: async (id: string, data: Record<string, unknown>) => {
    const res = await http.put(`/parking-slots/${id}`, data);
    return extract<ParkingSlot>(res);
  },

  deleteSlot: async (id: string) => {
    const res = await http.delete(`/parking-slots/${id}`);
    return extract<{ message: string }>(res);
  },
};
