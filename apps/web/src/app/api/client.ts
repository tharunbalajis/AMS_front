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

export const scopeApi = {
  async societies() {
    return DEMO_SOCIETIES;
  },
  async blocks(societyId?: number) {
    if (!societyId) return [] as Block[];
    const { data } = await http.get<Block[]>("/blocks", { params: { society_id: societyId } });
    return data;
  }
};

export const dashboardApi = {
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
