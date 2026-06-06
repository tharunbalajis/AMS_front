import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check, ChevronDown, ChevronRight, Edit2, KeyRound, Loader2,
  Plus, Shield, Trash2, UserPlus, Users, X
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { rolesApi, type RoleDefinition, type RoleUser } from "../../../app/api/client";

// ─── All available permission modules and actions ─────────────────────────────
const PERMISSION_MODULES = [
  { key: "dashboard",   label: "Dashboard" },
  { key: "societies",   label: "Societies" },
  { key: "blocks",      label: "Blocks" },
  { key: "units",       label: "Units" },
  { key: "residents",   label: "Residents" },
  { key: "visitors",    label: "Visitors" },
  { key: "complaints",  label: "Complaints" },
  { key: "maintenance", label: "Maintenance" },
  { key: "finance",     label: "Finance" },
  { key: "amenities",   label: "Amenities" },
  { key: "staff",       label: "Staff & Vendors" },
  { key: "assets",      label: "Assets" },
  { key: "communication", label: "Communication" },
  { key: "notices",     label: "Notices" },
  { key: "meetings",    label: "Meetings" },
  { key: "compliance",  label: "Compliance" },
  { key: "reports",     label: "Reports" },
  { key: "roles",       label: "Roles & Permissions" },
  { key: "users",       label: "Users" },
  { key: "settings",    label: "Settings" },
  { key: "audit-logs",  label: "Audit Logs" }
];

const PERMISSION_ACTIONS = [
  { key: "view",    label: "View" },
  { key: "create",  label: "Create" },
  { key: "update",  label: "Update" },
  { key: "delete",  label: "Delete" },
  { key: "approve", label: "Approve" },
  { key: "manage",  label: "Manage" },
  { key: "import",  label: "Import" },
  { key: "export",  label: "Export" }
];

// ─── Permission Checkbox Matrix ────────────────────────────────────────────────
function PermissionMatrix({ permissions, onChange }: { permissions: string[]; onChange: (perms: string[]) => void }) {
  const pSet = new Set(permissions);

  function toggle(perm: string) {
    const next = new Set(pSet);
    if (next.has(perm)) next.delete(perm);
    else next.add(perm);
    onChange(Array.from(next));
  }

  function toggleModule(moduleKey: string) {
    const modulePerms = PERMISSION_ACTIONS.map(a => `${moduleKey}.${a.key}`);
    const allChecked = modulePerms.every(p => pSet.has(p));
    const next = new Set(pSet);
    if (allChecked) modulePerms.forEach(p => next.delete(p));
    else modulePerms.forEach(p => next.add(p));
    onChange(Array.from(next));
  }

  function toggleAction(actionKey: string) {
    const actionPerms = PERMISSION_MODULES.map(m => `${m.key}.${actionKey}`);
    const allChecked = actionPerms.every(p => pSet.has(p));
    const next = new Set(pSet);
    if (allChecked) actionPerms.forEach(p => next.delete(p));
    else actionPerms.forEach(p => next.add(p));
    onChange(Array.from(next));
  }

  function selectAll() {
    const all: string[] = [];
    PERMISSION_MODULES.forEach(m => PERMISSION_ACTIONS.forEach(a => all.push(`${m.key}.${a.key}`)));
    onChange(all);
  }

  function clearAll() { onChange([]); }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={selectAll} className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700">Select All</button>
        <button type="button" onClick={clearAll} className="rounded-md border border-gray-200 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50">Clear All</button>
        <span className="ml-auto text-xs text-gray-400">{permissions.length} of {PERMISSION_MODULES.length * PERMISSION_ACTIONS.length} permissions</span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              <th className="w-40 border-b border-r border-gray-200 px-3 py-2 text-left font-semibold text-gray-700">Module</th>
              {PERMISSION_ACTIONS.map(action => (
                <th key={action.key} className="border-b border-gray-200 px-2 py-2 font-semibold text-gray-700">
                  <div className="flex flex-col items-center gap-1">
                    <button type="button" onClick={() => toggleAction(action.key)} className="text-gray-500 hover:text-blue-600 text-[10px] font-medium uppercase tracking-wide">{action.label}</button>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERMISSION_MODULES.map((module, idx) => {
              const modulePerms = PERMISSION_ACTIONS.map(a => `${module.key}.${a.key}`);
              const checkedCount = modulePerms.filter(p => pSet.has(p)).length;
              const allChecked = checkedCount === PERMISSION_ACTIONS.length;
              const someChecked = checkedCount > 0 && !allChecked;

              return (
                <tr key={module.key} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                  <td className="border-b border-r border-gray-100 px-3 py-2">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={el => { if (el) el.indeterminate = someChecked; }}
                        onChange={() => toggleModule(module.key)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span className="font-medium text-gray-700">{module.label}</span>
                    </label>
                  </td>
                  {PERMISSION_ACTIONS.map(action => {
                    const perm = `${module.key}.${action.key}`;
                    return (
                      <td key={action.key} className="border-b border-gray-100 px-2 py-2 text-center">
                        <input
                          type="checkbox"
                          checked={pSet.has(perm)}
                          onChange={() => toggle(perm)}
                          className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 cursor-pointer"
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Role Modal (Create / Edit) ────────────────────────────────────────────────
function RoleModal({ role, onClose, onSaved }: { role?: RoleDefinition; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions ?? []);
  const isEdit = Boolean(role);

  const mutation = useMutation({
    mutationFn: async () => {
      if (isEdit && role) return rolesApi.update(role.id, { name, description, permissions });
      return rolesApi.create({ name, description, permissions });
    },
    onSuccess: () => {
      toast.success(isEdit ? "Role updated" : "Role created");
      onSaved();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save role")
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-8">
      <div className="w-full max-w-4xl rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
              <Shield size={18} />
            </div>
            <div>
              <h2 className="text-lg font-semibold">{isEdit ? "Edit Role" : "Create New Role"}</h2>
              <p className="text-xs text-gray-500">Configure role name and assign feature permissions</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="space-y-5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Role Name <span className="text-red-500">*</span></span>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Property Manager"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-gray-700">Description</span>
              <input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Brief description of this role"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </label>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gray-800">Feature Permissions</h3>
            <PermissionMatrix permissions={permissions} onChange={setPermissions} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            type="button"
            disabled={!name.trim() || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            {isEdit ? "Update Role" : "Create Role"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({ role, onClose, onSaved }: { role: RoleDefinition; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", mobile: "" });
  const [showPass, setShowPass] = useState(false);

  const mutation = useMutation({
    mutationFn: () => rolesApi.createUser(role.id, { ...form }),
    onSuccess: () => {
      toast.success(`User created and assigned to "${role.name}"`);
      onSaved();
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create user")
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-600 text-white">
              <UserPlus size={18} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Add User to Role</h2>
              <p className="text-xs text-gray-500">Role: <span className="font-medium text-blue-600">{role.name}</span></p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="space-y-4 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Full Name <span className="text-red-500">*</span></span>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              placeholder="e.g. Ravi Kumar"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></span>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="user@example.com"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Mobile</span>
            <input
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))}
              placeholder="10-digit mobile number"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Password <span className="text-red-500">*</span></span>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 6 characters"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 pr-10 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 text-xs">{showPass ? "Hide" : "Show"}</button>
            </div>
            <p className="mt-1 text-xs text-gray-400">Give this password to the user — they will use it to login.</p>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-200 px-6 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
          <button
            type="button"
            disabled={!form.full_name.trim() || !form.email.trim() || !form.password || mutation.isPending}
            onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60"
          >
            {mutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <UserPlus size={15} />}
            Create User
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Role Users Drawer ─────────────────────────────────────────────────────────
function RoleUsersDrawer({ role, onClose }: { role: RoleDefinition; onClose: () => void }) {
  const [showAddUser, setShowAddUser] = useState(false);
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["role-users", role.id],
    queryFn: () => rolesApi.listUsers(role.id)
  });

  const users = query.data ?? [];

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-900">Users – {role.name}</h2>
            <p className="text-xs text-gray-500">{users.length} user(s) assigned</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {query.isLoading ? (
            <div className="flex items-center justify-center py-10 text-gray-400"><Loader2 size={20} className="animate-spin" /></div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
              <Users size={32} />
              <p className="text-sm">No users assigned to this role yet</p>
            </div>
          ) : users.map(user => (
            <div key={user.id} className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{user.full_name}</p>
                <p className="truncate text-xs text-gray-500">{user.email}</p>
              </div>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                {user.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-200 p-4">
          <button
            type="button"
            onClick={() => setShowAddUser(true)}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            <UserPlus size={16} /> Add User to This Role
          </button>
        </div>
      </div>

      {showAddUser && (
        <AddUserModal
          role={role}
          onClose={() => setShowAddUser(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ["role-users", role.id] })}
        />
      )}
    </>
  );
}

// ─── Role Card ─────────────────────────────────────────────────────────────────
function RoleCard({
  role,
  onEdit,
  onDelete,
  onViewUsers
}: {
  role: RoleDefinition;
  onEdit: () => void;
  onDelete: () => void;
  onViewUsers: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const moduleCount = new Set(role.permissions.map(p => p.split(".")[0])).size;
  const permCount = role.permissions.length;

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <div className="flex items-start gap-4 p-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <KeyRound size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900">{role.name}</h3>
            {role.is_system && <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">System</span>}
          </div>
          {role.description && <p className="mt-0.5 text-xs text-gray-500">{role.description}</p>}
          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
            <span>{moduleCount} modules</span>
            <span>·</span>
            <span>{permCount} permissions</span>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onViewUsers}
            title="View Users"
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            <Users size={13} /> Users
          </button>
          {!role.is_system && (
            <>
              <button type="button" onClick={onEdit} title="Edit Role" className="rounded-lg p-1.5 text-gray-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 size={15} /></button>
              <button type="button" onClick={onDelete} title="Delete Role" className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={15} /></button>
            </>
          )}
          <button type="button" onClick={() => setExpanded(e => !e)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50">
            {expanded ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 px-5 pb-4 pt-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Assigned Permissions</p>
          <div className="flex flex-wrap gap-1.5">
            {role.permissions.length === 0 ? (
              <span className="text-xs text-gray-400">No permissions assigned</span>
            ) : role.permissions.includes("*") ? (
              <span className="rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">Full Access (*)</span>
            ) : (
              role.permissions.map(p => (
                <span key={p} className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">{p}</span>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main RolesPage ────────────────────────────────────────────────────────────
export function RolesPage() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editRole, setEditRole] = useState<RoleDefinition | undefined>();
  const [usersRole, setUsersRole] = useState<RoleDefinition | undefined>();

  const query = useQuery({
    queryKey: ["roles"],
    queryFn: rolesApi.list
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => rolesApi.remove(id),
    onSuccess: () => { toast.success("Role deleted"); qc.invalidateQueries({ queryKey: ["roles"] }); },
    onError: (err: Error) => toast.error(err.message || "Failed to delete role")
  });

  const roles = query.data ?? [];

  function handleDelete(role: RoleDefinition) {
    if (!window.confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(role.id);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Roles & Permissions</h1>
          <p className="mt-1 text-sm text-gray-500">Create unlimited roles with granular feature access. Assign users to roles after creation.</p>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <Plus size={16} /> Create Role
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total Roles" value={roles.length} color="blue" />
        <StatCard label="System Roles" value={roles.filter(r => r.is_system).length} color="purple" />
        <StatCard label="Custom Roles" value={roles.filter(r => !r.is_system).length} color="green" />
        <StatCard label="Avg Permissions" value={roles.length ? Math.round(roles.reduce((s, r) => s + r.permissions.length, 0) / roles.length) : 0} color="amber" />
      </div>

      {/* Role list */}
      {query.isLoading ? (
        <div className="flex items-center justify-center py-16 text-gray-400"><Loader2 size={24} className="animate-spin" /></div>
      ) : roles.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <KeyRound size={36} className="text-gray-300" />
          <p className="font-medium text-gray-500">No roles created yet</p>
          <p className="text-sm text-gray-400">Click "Create Role" to define your first custom role.</p>
          <button type="button" onClick={() => setCreateOpen(true)} className="mt-2 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700">
            <Plus size={15} /> Create First Role
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {roles.map(role => (
            <RoleCard
              key={role.id}
              role={role}
              onEdit={() => setEditRole(role)}
              onDelete={() => handleDelete(role)}
              onViewUsers={() => setUsersRole(role)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {(createOpen || editRole) && (
        <RoleModal
          role={editRole}
          onClose={() => { setCreateOpen(false); setEditRole(undefined); }}
          onSaved={() => qc.invalidateQueries({ queryKey: ["roles"] })}
        />
      )}
      {usersRole && (
        <RoleUsersDrawer role={usersRole} onClose={() => setUsersRole(undefined)} />
      )}
    </div>
  );
}

function StatCard({ label, value, color }: { label: string; value: number; color: "blue" | "purple" | "green" | "amber" }) {
  const colors = {
    blue:   "bg-blue-50 border-blue-100 text-blue-700",
    purple: "bg-purple-50 border-purple-100 text-purple-700",
    green:  "bg-green-50 border-green-100 text-green-700",
    amber:  "bg-amber-50 border-amber-100 text-amber-700"
  };
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
