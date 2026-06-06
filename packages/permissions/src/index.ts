const PERMISSION_MODULES = [
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

export type PermissionAction = "view" | "create" | "update" | "delete" | "approve" | "manage" | "import" | "export";
export type Permission = `${(typeof PERMISSION_MODULES)[number]}.${PermissionAction}` | "*";

export type RoleDefinition = {
  id: string;
  name: string;
  description: string;
  isSystem?: boolean;
  permissions: Permission[];
};

export const ADMIN_ROLE: RoleDefinition = {
  id: "admin",
  name: "ADMIN",
  description: "Default client showcase role with CRUD, import/export, approval, and management access.",
  isSystem: false,
  permissions: PERMISSION_MODULES.flatMap((module) => [
    `${module}.view`,
    `${module}.create`,
    `${module}.update`,
    `${module}.delete`,
    `${module}.approve`,
    `${module}.manage`,
    `${module}.import`,
    `${module}.export`
  ]) as Permission[]
};

export const SUPER_ADMIN_ROLE: RoleDefinition = {
  id: "super-admin",
  name: "SUPER_ADMIN",
  description: "Unrestricted platform owner role.",
  isSystem: true,
  permissions: ["*"]
};

export function hasPermission(permissions: readonly string[] | undefined, permission: Permission): boolean {
  if (!permissions?.length) return false;
  return permissions.includes("*") || permissions.includes(permission);
}

export function resolveRolePermissions(role?: string, explicitPermissions?: string[]): Permission[] {
  if (explicitPermissions?.length) return explicitPermissions as Permission[];
  if (role === SUPER_ADMIN_ROLE.name) return SUPER_ADMIN_ROLE.permissions;
  if (role === ADMIN_ROLE.name) return ADMIN_ROLE.permissions;
  return [];
}
