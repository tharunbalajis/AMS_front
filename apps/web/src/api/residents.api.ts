
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
  resident_id: string;          // canonical — backend always sends this
  id?: string;                  // optional fallback
  full_name: string;
  mobile_primary?: string;
  unit_id: number | null;
  unit_number: string | null;
  block_name: string | null;
  block_id: number | null;
  is_active?: boolean;
  label?: string;
}

export interface Resident {
  resident_id: string;          // canonical PK
  id?: string;                  // alias — backend sends both
  full_name: string;
  email: string | null;
  mobile_primary: string;
  resident_type: "OWNER" | "TENANT" | "FAMILY";
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
  member_count?: number | null;
  status?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Unit {
  unit_id: number;
  unit_number: string;
  floor_number?: number | null;
  unit_type: string | null;
  block_id: number;
  block_name: string | null;
  society_id: number;
  occupancy_status:
    | "VACANT"
    | "OWNER_OCCUPIED"
    | "RENTED"
    | "TENANT_OCCUPIED";
  occupant_count?: number;
  parking_slots: number;
  owner_id: string | null;
  owner_name: string | null;
  tenant_id: string | null;
  tenant_name: string | null;
}

export function normalizeOccupancyStatus(
  status: string | null | undefined
): "VACANT" | "OWNER_OCCUPIED" | "RENTED" {
  if (!status || status === "VACANT") return "VACANT";
  if (status === "TENANT_OCCUPIED") return "RENTED";
  if (status === "OWNER_OCCUPIED")  return "OWNER_OCCUPIED";
  return "RENTED";
}

export interface ParkingSlot {
  parking_slot_id: string;
  slot_code: string;
  slot_type: string;
}

export interface Block {
  block_id: number;
  block_name: string;
  total_floors: number;
  total_units: number;
  occupied_units: number;
  description: string | null;
}

/* -------------------------------------------------- */
/* SAFE RESPONSE HELPERS */
/* -------------------------------------------------- */

function unwrapArray<T>(
  body: unknown
): T[] {

  if (!body) return [];

  if (Array.isArray(body)) {
    return body as T[];
  }

  const r =
    body as Record<string, unknown>;

  if (Array.isArray(r.data)) {
    return r.data as T[];
  }

  if (Array.isArray(r.rows)) {
    return r.rows as T[];
  }

  if (Array.isArray(r.items)) {
    return r.items as T[];
  }

  return [];
}

function unwrapPagination(
  body: any
): Pagination {

  return {
    page:
      body?.pagination?.page || 1,

    page_size:
      body?.pagination?.page_size || 100,

    total:
      body?.pagination?.total || 0,
  };
}

function unwrapResponse<T>(
  body: any
): {
  data: T[];
  pagination: Pagination;
} {

  return {
    data:
      unwrapArray<T>(body),

    pagination:
      unwrapPagination(body),
  };
}

const extractData = <T>(
  response: any
): T => {

  const body = response?.data;

  if (!body) {
    return [] as unknown as T;
  }

  if (Array.isArray(body)) {
    return body as unknown as T;
  }

  if (Array.isArray(body.data)) {
    return body.data as unknown as T;
  }

  if (body.data !== undefined) {
    return body.data as unknown as T;
  }

  return body as unknown as T;
};

/* -------------------------------------------------- */
/* API */
/* -------------------------------------------------- */

export const residentsApi = {

  /* -------------------------------------------------- */
  /* RESIDENTS */
  /* -------------------------------------------------- */

  getAll: async (
    params?: Record<string, unknown>
  ) => {

    const response =
      await http.get(
        "/residents",
        { params }
      );

    const result = unwrapResponse<Resident>(response.data);
    // Ensure every resident has resident_id set so callers can use either key
    result.data = result.data.map((r: any) => ({
      ...r,
      resident_id: r.resident_id ?? r.id,
    }));
    return result;
  },

  getById: async (
    id: string
  ) => {

    const response =
      await http.get(
        `/residents/${id}`
      );

    return extractData<Resident>(
      response
    );
  },

  create: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        "/residents",
        data
      );

    return extractData(response);
  },

  update: async (
    id: string,
    data: Record<string, unknown>
  ) => {

    const response =
      await http.put(
        `/residents/${id}`,
        data
      );

    return extractData(response);
  },

  remove: async (
    id: string
  ) => {

    const response =
      await http.delete(
        `/residents/${id}`
      );

    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* UNITS */
  /* -------------------------------------------------- */

  getUnits: async (
    params?: {
      society_id?: number;
      block_id?: number;
      search?: string;
      page?: number;
      page_size?: number;
      unit_type?: string;
      occupancy_status?: string;
    }
  ) => {

    const response =
      await http.get(
        "/units",
        { params }
      );

    return unwrapResponse<Unit>(
      response.data
    );
  },

  getUnitDetail: async (unitId: number) => {
    const response = await http.get(`/units/${unitId}/detail`);
    return (response.data?.data ?? response.data) as Record<string, unknown>;
  },

  createUnit: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        "/units",
        data
      );

    return extractData<Unit>(
      response
    );
  },

  getParkingSlots: async (
    unitId: number,
    societyId?: number
  ) => {

    const response =
      await http.get(
        '/residents/parking-slots',
        {
          params: {
            society_id: societyId,
          },
        }
      );

    // Return raw body so callers can read .data array
    return response.data;
  },

  /* -------------------------------------------------- */
  /* BLOCKS */
  /* -------------------------------------------------- */

  getBlocks: async (
    params?: {
      society_id?: number;
    }
  ) => {

    const response =
      await http.get(
        "/blocks",
        { params }
      );

    return unwrapArray<Block>(
      response.data
    );
  },

  createBlock: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        "/blocks",
        data
      );

    return extractData<Block>(
      response
    );
  },

  updateBlock: async (
    id: number,
    data: Record<string, unknown>
  ) => {

    const response =
      await http.put(
        `/blocks/${id}`,
        data
      );

    return extractData<Block>(
      response
    );
  },

  /* -------------------------------------------------- */
  /* VEHICLES */
  /* -------------------------------------------------- */

  getVehicles: async (
    params?: Record<string, unknown>
  ) => {

    const response =
      await http.get(
        "/vehicles",
        { params }
      );

    return unwrapArray<any>(
      response.data
    );
  },

  addVehicle: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        `/residents/${data.resident_id}/vehicles`,
        data
      );

    return extractData(response);
  },

  deleteVehicle: async (id: string) => {
    const response = await http.delete(`/vehicles/${id}`);
    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* PETS */
  /* -------------------------------------------------- */

  getPets: async (
    params?: Record<string, unknown>
  ) => {

    const response =
      await http.get(
        "/pets",
        { params }
      );

    return unwrapArray<any>(
      response.data
    );
  },

  addPet: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        `/residents/${data.resident_id}/pets`,
        data
      );

    return extractData(response);
  },

  deletePet: async (id: string) => {
    const response = await http.delete(`/pets/${id}`);
    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* LEASES */
  /* -------------------------------------------------- */

  getLeases: async (
    params?: Record<string, unknown>
  ) => {

    const response =
      await http.get(
        "/residents/leases",
        { params }
      );

    return unwrapArray<any>(
      response.data
    );
  },

  createLease: async (
    data: Record<string, unknown>
  ) => {

    const response =
      await http.post(
        "/residents/leases",
        data
      );

    return extractData(response);
  },

  updateLease: async (
    id: string,
    data: Record<string, unknown>
  ) => {

    const response =
      await http.put(
        `/residents/leases/${id}`,
        data
      );

    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* QR */
  /* -------------------------------------------------- */

  getResidentQR: async (
    id: string
  ) => {

    const response =
      await http.get(
        `/residents/${id}/qr`
      );

    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* MOVE OUT */
  /* -------------------------------------------------- */

  moveOut: async (
    id: string,
    data: Record<string, unknown>
  ) => {

    const response =
      await http.put(
        `/residents/${id}/move-out`,
        data
      );

    return extractData(response);
  },

  endLeaseAndMoveOut: async (
    residentId: string,
    leaseId: string,
    moveOutDate: string
  ) => {

    await residentsApi.updateLease(
      leaseId,
      {
        status: "TERMINATED",
      }
    );

    return residentsApi.moveOut(
      residentId,
      {
        move_out_date:
          moveOutDate,
      }
    );
  },

  /* -------------------------------------------------- */
  /* INACTIVE OWNERS */
  /* -------------------------------------------------- */

  getInactiveOwners: async (
    params?: {
      society_id?: number;
      block_id?: number;
    }
  ) => {

    const response =
      await http.get(
        "/residents/inactive-owners",
        { params }
      );

    return unwrapArray<InactiveOwner>(
      response.data
    );
  },

  /* -------------------------------------------------- */
  /* CREATE UNIT + OWNER */
  /* -------------------------------------------------- */

  createUnitWithOwner: async (
    unitData: Record<string, unknown>,
    ownerData:
      | Record<string, unknown>
      | null
  ) => {

    const unit =
      await residentsApi.createUnit(
        unitData
      );

    const unitId =
      (unit as any)?.unit_id;

    if (
      ownerData &&
      unitId
    ) {

      await residentsApi.create({
        ...ownerData,
        unit_id: unitId,
      });
    }

    return unit;
  },

  /* -------------------------------------------------- */
  /* CSV EXPORT */
  /* -------------------------------------------------- */

  exportCsv: async (
    societyId?: number
  ) => {

    const response =
      await http.get(
        "/residents/export",
        {
          params:
            societyId
              ? {
                  society_id:
                    societyId
                }
              : {},

          responseType:
            "blob",
        }
      );

    const url =
      URL.createObjectURL(
        response.data as Blob
      );

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `residents_${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    a.click();

    URL.revokeObjectURL(url);
  },

  /* -------------------------------------------------- */
  /* IMPORT */
  /* -------------------------------------------------- */

  importPreview: async (
    rows: Record<string, unknown>[]
  ) => {

    const response =
      await http.post(
        "/residents/import",
        { rows }
      );

    return extractData(response);
  },

  importPreviewWithSociety: async (
    rows: Record<string, unknown>[],
    societyId?: number
  ) => {

    const response =
      await http.post(
        "/residents/import",
        {
          rows,
          society_id:
            societyId,
        }
      );

    return extractData(response);
  },

  importConfirm: async (
    rows: Record<string, unknown>[]
  ) => {

    const response =
      await http.post(
        "/residents/import/confirm",
        { rows }
      );

    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* TIMELINE */
  /* -------------------------------------------------- */

  getTimeline: async (
    id: string
  ) => {

    const response =
      await http.get(
        `/residents/${id}/timeline`
      );

    return extractData(response);
  },

  /* -------------------------------------------------- */
  /* RESIDENTS DASHBOARD */
  /* -------------------------------------------------- */

  getDashboard: async (
    params?: Record<string, unknown>
  ) => {

    const response =
      await http.get(
        "/residents/dashboard",
        { params }
      );

    return (response.data as Record<string, unknown>) ?? {};
  },
};
