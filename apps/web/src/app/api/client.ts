import type { ApiListParams, AuditLog, Block, DashboardMetrics, LoginRequest, LoginResponse, ResourceRecord } from "@ams/api-types";

export type RoleDefinition = {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system: boolean;
  created_at: string;
};

export type RoleUser = {
  id: string;
  full_name: string;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string | null;
};
import { DEMO_SOCIETIES } from "@ams/constants";
import { clearTokens, http, normalizeList, normalizeTotal, setTokens } from "@ams/utils";

export const authApi = {
  async login(payload: LoginRequest) {
    const { data } = await http.post<LoginResponse>("/auth/login", payload);
    setTokens(data.access_token, data.refresh_token);
    return data;
  },
  async me() {
    const { data } = await http.get<{ data: LoginResponse["user"] }>("/auth/me");
    return data.data;
  },
  async logout() {
    try {
      await http.post("/auth/logout");
    } finally {
      clearTokens();
    }
  }
};

export type Society = {
  society_id: number;
  society_name: string;
  city?: string;
  state?: string;
  is_active?: boolean;
};

export const scopeApi = {
  async societies(): Promise<Society[]> {
    try {
      const { data } = await http.get<Society[]>("/societies");
      const list = Array.isArray(data) ? data : (data as { data?: Society[] }).data ?? [];
      if (list.length > 0) return list;
    } catch {
      // fall through to DEMO_SOCIETIES
    }
    return DEMO_SOCIETIES;
  },
  async blocks(societyId?: number) {
    if (!societyId) return [] as Block[];
    const { data } = await http.get("/blocks", { params: { society_id: societyId } });
    return normalizeList(data) as Block[];
  }
};

export const vehiclesApi = {
  async list(societyId?: number) {
    const { data } = await http.get<Record<string, unknown>[]>("/vehicles", {
      params: societyId ? { society_id: societyId } : {}
    });
    return Array.isArray(data) ? data : (data as { data?: Record<string, unknown>[] }).data ?? [];
  },
  async create(payload: Record<string, unknown>) {
    const { data } = await http.post<Record<string, unknown>>("/vehicles", payload);
    return data;
  }
};

export const petsApi = {
  async list(societyId?: number) {
    const { data } = await http.get<Record<string, unknown>[]>("/pets", {
      params: societyId ? { society_id: societyId } : {}
    });
    return Array.isArray(data) ? data : (data as { data?: Record<string, unknown>[] }).data ?? [];
  },
  async create(payload: Record<string, unknown>) {
    const { data } = await http.post<Record<string, unknown>>("/pets", payload);
    return data;
  }
};

export const residentsExtApi = {
  async moveOut(id: string, payload: { move_out_date?: string }) {
    const { data } = await http.put<Record<string, unknown>>(`/residents/${id}/move-out`, payload);
    return data;
  },
  async getQR(id: string) {
    const { data } = await http.get<Record<string, unknown>>(`/residents/${id}/qr`);
    return data;
  }
};

export type DashboardStats = {
  total_units: number;
  occupied_units: number;
  occupancy_pct: number;
  total_residents: number;
  open_complaints: number;
  pending_payments: number;
  visitors_today: number;
  active_staff: number;
};

export const dashboardApi = {
  async stats(societyId?: number): Promise<DashboardStats> {
    const { data } = await http.get<DashboardStats>("/dashboard/stats", {
      params: societyId ? { society_id: societyId } : {}
    });
    return data;
  },
  async metrics(params: ApiListParams) {
    const { data } = await http.get<{ data: DashboardMetrics }>("/dashboard/metrics", { params: { period: params.period ?? "month" } });
    return data.data;
  },
  async overview(params: ApiListParams) {
    const societyId = params.society_id ?? 1;
    const [units, residents, visitors, complaints, invoices, staff, assets, amenities] = await Promise.allSettled([
      http.get("/units", { params: { society_id: societyId, page: 1,page_size: 100 } }),
      http.get("/residents", { params: { society_id: societyId, page: 1,page_size: 100 } }),
      http.get("/visitors", { params: { society_id: societyId, page: 1, page_size: 50 } }),
      http.get("/complaints", { params: { society_id: societyId, page: 1, page_size: 50 } }),
      http.get("/invoices", { params: { society_id: societyId, page: 1, pageSize: 50 } }),
      http.get("/staff", { params: { society_id: societyId, page: 1,page_size: 100 } }),
      http.get("/assets", { params: { society_id: societyId, page: 1,page_size: 100 } }),
      http.get("/amenities", { params: { society_id: societyId, page: 1,page_size: 100 } })
    ]);

    const unwrap = (result: PromiseSettledResult<{ data: unknown }>) => result.status === "fulfilled" ? result.value.data : [];
    return {
      units: normalizeList<ResourceRecord>(unwrap(units)),
      residents: normalizeList<ResourceRecord>(unwrap(residents)),
      visitors: normalizeList<ResourceRecord>(unwrap(visitors)),
      complaints: normalizeList<ResourceRecord>(unwrap(complaints)),
      invoices: normalizeList<ResourceRecord>(unwrap(invoices)),
      staff: normalizeList<ResourceRecord>(unwrap(staff)),
      assets: normalizeList<ResourceRecord>(unwrap(assets)),
      amenities: normalizeList<ResourceRecord>(unwrap(amenities)),
      totals: {
        visitors: normalizeTotal(unwrap(visitors)),
        complaints: normalizeTotal(unwrap(complaints)),
        invoices: normalizeTotal(unwrap(invoices))
      }
    };
  }
};

export const usersApi = {
  async list(params: ApiListParams) {
    const { data } = await http.get<ResourceRecord[]>("/users", { params });
    return data;
  },
  async auditLogs(params: ApiListParams) {
    const { data } = await http.get<AuditLog[]>("/audit-logs", { params });
    return data;
  }
};

export const rolesApi = {
  async list(): Promise<RoleDefinition[]> {
    const { data } = await http.get<{ data: RoleDefinition[] }>("/roles");
    return data.data ?? [];
  },
  async create(payload: { name: string; description?: string; permissions: string[] }): Promise<RoleDefinition> {
    const { data } = await http.post<{ data: RoleDefinition }>("/roles", payload);
    return data.data;
  },
  async update(id: string, payload: { name?: string; description?: string; permissions?: string[] }): Promise<RoleDefinition> {
    const { data } = await http.put<{ data: RoleDefinition }>(`/roles/${id}`, payload);
    return data.data;
  },
  async remove(id: string): Promise<void> {
    await http.delete(`/roles/${id}`);
  },
  async listUsers(roleId: string): Promise<RoleUser[]> {
    const { data } = await http.get<{ data: { users: RoleUser[] } }>(`/roles/${roleId}/users`);
    return data.data?.users ?? [];
  },
  async createUser(roleId: string, payload: { full_name: string; email: string; password: string; mobile?: string; society_id?: number }): Promise<RoleUser> {
    const { data } = await http.post<{ data: RoleUser }>(`/roles/${roleId}/users`, payload);
    return data.data;
  }
};

export const searchApi = {
  async search(q: string, societyId?: number) {
    const { data } = await http.get<{
      residents: Record<string, unknown>[];
      units: Record<string, unknown>[];
      complaints: Record<string, unknown>[];
    }>("/search", { params: { q, ...(societyId ? { society_id: societyId } : {}) } });
    return data;
  }
};

export const unitsApi = {
  heatmap: (societyId?: number) =>
    http.get<{ society_id: number; blocks: Record<string, unknown>[] }>("/units/heatmap", {
      params: societyId ? { society_id: societyId } : {}
    }),
};

export function resourceApi(endpoint: string) {
  return {
    async list(params: ApiListParams) {
      const { data } = await http.get<unknown>(endpoint, { params });
      return normalizeList<ResourceRecord>(data);
    },
    async create(payload: ResourceRecord) {
      const { data } = await http.post<ResourceRecord>(endpoint, payload);
      return data;
    },
    async update(id: string | number, payload: ResourceRecord) {
      const { data } = await http.put<ResourceRecord>(`${endpoint}/${id}`, payload);
      return data;
    },
    async remove(id: string | number) {
      await http.delete(`${endpoint}/${id}`);
    }
  };
}
