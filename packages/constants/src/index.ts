const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;

export const API_BASE_URL = env?.VITE_API_BASE_URL ?? "http://localhost:4444/v1";

export const DEFAULT_PAGE_SIZE = 25;

export const DEMO_SOCIETIES = [
  { society_id: 1, society_name: "Green Valley Apartments", is_active: true },
  { society_id: 2, society_name: "Lakeview Heights", is_active: true },
  { society_id: 3, society_name: "Metro Residency", is_active: true }
];

export const ROUTE_PATHS = {
  dashboard: "/",
  login: "/login",
  settings: "/settings",
  auditLogs: "/audit-logs"
} as const;

export const ENTERPRISE_MODULES = [
  "dashboard",
  "societies",
  "blocks",
  "units",
  "residents",
  "visitors",
  "complaints",
  "maintenance",
  "finance",
  "amenities",
  "staff",
  "assets",
  "communication",
  "notices",
  "meetings",
  "compliance",
  "reports",
  "roles",
  "users",
  "settings",
  "audit-logs"
] as const;
