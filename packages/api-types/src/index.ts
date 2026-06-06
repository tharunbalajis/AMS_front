export type Id = string | number;

export type ApiListParams = {
  society_id?: number;
  block_id?: number;
  unit_id?: number;
  search?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  order?: "asc" | "desc";
  [key: string]: string | number | boolean | undefined;
};

export type ApiUser = {
  id: string;
  full_name: string;
  email: string;
  mobile?: string | null;
  role: string;
  society_id?: number | null;
  is_active?: boolean;
  mfa_enabled?: boolean;
  permissions?: string[];
  last_login_at?: string | null;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: ApiUser;
};

export type Society = {
  society_id: number;
  society_name: string;
  is_active?: boolean;
};

export type Block = {
  block_id: number;
  society_id: number;
  block_name: string;
  total_floors?: number;
  description?: string | null;
  is_active?: boolean;
};

export type Unit = {
  unit_id?: number;
  id?: number;
  society_id: number;
  block_id: number;
  unit_number: string;
  unit_type?: string;
  occupancy_status?: "OCCUPIED" | "VACANT" | string;
};

export type Resident = {
  id: string;
  society_id: number;
  unit_id: number;
  full_name: string;
  mobile_primary: string;
  email?: string | null;
  resident_type: "OWNER" | "TENANT" | string;
  is_active: boolean;
  unit_number?: string;
  block_name?: string;
  society_name?: string;
};

export type TrendValue = {
  value: number;
  direction: "up" | "down" | "neutral";
  period: string;
};

export type DashboardMetrics = {
  residents?: { total?: number; active?: number; new?: number; trend?: TrendValue };
  units?: { total?: number; occupied?: number; vacant?: number; occupancy?: number; trend?: TrendValue };
  visitors?: { total?: number; active?: number; today?: number; trend?: TrendValue };
  complaints?: { total?: number; open?: number; inProgress?: number; resolved?: number; trend?: TrendValue };
  financials?: { monthlyCollection?: number; pendingPayments?: number; overdueAmount?: number; collectionRate?: number; trend?: TrendValue };
  staff?: { total?: number; active?: number; onLeave?: number; trend?: TrendValue };
  assets?: { total?: number; operational?: number; maintenance?: number; retired?: number; trend?: TrendValue };
  meetings?: { upcoming?: number; thisMonth?: number; completed?: number; trend?: TrendValue };
};

export type AuditLog = {
  id?: Id;
  action?: string;
  entity_type?: string;
  user_email?: string;
  created_at?: string;
  [key: string]: unknown;
};

export type ResourceRecord = Record<string, unknown> & {
  id?: Id;
  name?: string;
  title?: string;
  status?: string;
  created_at?: string;
};
