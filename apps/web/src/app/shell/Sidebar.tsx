import { hasPermission, type Permission } from "@ams/permissions";
import {
  Armchair,
  BadgeDollarSign,
  BellRing,
  Boxes,
  Building2,
  ChevronDown,
  ClipboardCheck,
  FileCheck2,
  Home,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Megaphone,
  MessageSquare,
  Settings,
  Shield,
  Siren,
  Users
} from "lucide-react";
import type { ReactElement } from "react";
import { useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthProvider";
import { useScope } from "../scope/ScopeProvider";

type NavItem = {
  label: string;
  to: string;
  permission: string;
  icon?: ReactElement;
};

type NavGroup = {
  label: string;
  icon: ReactElement;
  permission: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Society Management",
    icon: <Building2 size={18} />,
    permission: "societies",
    items: [
      { label: "Societies", to: "/societies", permission: "societies" },
      { label: "Blocks", to: "/blocks", permission: "blocks" },
      { label: "Units", to: "/units", permission: "units" }
    ]
  },
  {
    label: "Residents",
    icon: <Users size={18} />,
    permission: "residents",
    items: [
      { label: "Overview", to: "/residents/overview", permission: "residents" },
      { label: "Resident Directory", to: "/residents", permission: "residents" },
      { label: "Unit Management", to: "/units", permission: "units" },
      { label: "Block / Wing", to: "/blocks", permission: "blocks" },
      { label: "Lease Agreements", to: "/residents/leases", permission: "residents" },
      { label: "Vehicle Management", to: "/residents/vehicles", permission: "residents" },
      { label: "Pet Management", to: "/residents/pets", permission: "residents" },
      { label: "Move-In / Move-Out", to: "/residents/move", permission: "residents" },
      { label: "Resident QR Pass", to: "/residents/qr-pass", permission: "residents" },
      { label: "Bulk Import", to: "/residents/import", permission: "residents" }
    ]
  },
  {
    label: "Visitor & Security",
    icon: <Siren size={18} />,
    permission: "visitors",
    items: [
      { label: "Security Dashboard", to: "/visitors/security", permission: "visitors" },
      { label: "Visitor Check-In", to: "/visitors/checkin", permission: "visitors" },
      { label: "Visitor Logs", to: "/visitors/logs", permission: "visitors" },
      { label: "Guard Panel", to: "/visitors/guard", permission: "visitors" },
      { label: "QR Entry", to: "/visitors/qr", permission: "visitors" },
      { label: "Delivery Tracking", to: "/visitors/deliveries", permission: "visitors" },
      { label: "Staff Attendance", to: "/visitors/attendance", permission: "visitors" },
      { label: "SOS / Emergency", to: "/visitors/sos", permission: "visitors" },
      { label: "Guest Passes", to: "/visitors/passes", permission: "visitors" }
    ]
  },
  {
    label: "Complaints",
    icon: <MessageSquare size={18} />,
    permission: "complaints",
    items: [
      { label: "Dashboard", to: "/complaints/dashboard", permission: "complaints" },
      { label: "Raise Complaint", to: "/complaints/new", permission: "complaints" },
      { label: "Complaint Tracking", to: "/complaints", permission: "complaints" },
      { label: "SLA Monitoring", to: "/complaints/sla", permission: "complaints" },
      { label: "Escalation Queue", to: "/complaints/escalation", permission: "complaints" },
      { label: "Maintenance Requests", to: "/complaints/maintenance", permission: "complaints" },
      { label: "Analytics", to: "/complaints/analytics", permission: "complaints" }
    ]
  },
  {
    label: "Finance",
    icon: <BadgeDollarSign size={18} />,
    permission: "finance",
    items: [
      { label: "Finance Dashboard", to: "/financials", permission: "finance" },
      { label: "Invoices", to: "/financials/invoices", permission: "finance" },
      { label: "Payments", to: "/financials/payments", permission: "finance" },
      { label: "Expense Tracking", to: "/financials/expenses", permission: "finance" },
      { label: "GST Reports", to: "/financials/gst", permission: "finance" },
      { label: "Penalty Management", to: "/financials/penalties", permission: "finance" },
      { label: "Financial Reports", to: "/financials/reports", permission: "finance" }
    ]
  }
];

const singleLinks: NavItem[] = [
  { label: "Amenity Booking", to: "/amenities", permission: "amenities", icon: <Armchair size={18} /> },
  { label: "Staff & Vendors", to: "/staff", permission: "staff", icon: <ClipboardCheck size={18} /> },
  { label: "Assets & Inventory", to: "/assets", permission: "assets", icon: <Boxes size={18} /> },
  { label: "Communication", to: "/notices", permission: "notices", icon: <Megaphone size={18} /> },
  { label: "Meetings", to: "/meetings", permission: "meetings", icon: <FileCheck2 size={18} /> },
  { label: "Compliance", to: "/compliance", permission: "compliance", icon: <Shield size={18} /> },
  { label: "Roles & Permissions", to: "/roles", permission: "roles", icon: <KeyRound size={18} /> },
  { label: "Users", to: "/users", permission: "users", icon: <Users size={18} /> },
  { label: "Settings", to: "/settings", permission: "settings", icon: <Settings size={18} /> },
  { label: "Audit Logs", to: "/audit-logs", permission: "audit-logs", icon: <BellRing size={18} /> }
];

export function Sidebar({ collapsed, onLogout }: { collapsed: boolean; onLogout?: () => void }) {
  const { permissions, user } = useAuth();
  const { society } = useScope();
  const location = useLocation();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    "Society Management": false,
    Residents: true,
    "Visitor & Security": true,
    Complaints: true,
    Finance: true
  });

  const visibleGroups = useMemo(
    () => groups.filter((group) => canView(permissions, group.permission)),
    [permissions]
  );
  const visibleLinks = useMemo(
    () => singleLinks.filter((link) => canView(permissions, link.permission)),
    [permissions]
  );

  return (
    <aside className={`${collapsed ? "w-16" : "w-60"} hidden shrink-0 border-r border-gray-200 bg-white transition-all duration-200 lg:flex lg:flex-col`}>
      <div className="flex h-14 items-center gap-3 border-b border-gray-200 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Building2 size={18} />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-gray-900">AMS</p>
            <p className="truncate text-xs text-gray-500">Super Admin</p>
          </div>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 py-3">
        <SidebarLink to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" collapsed={collapsed} />
        {visibleGroups.map((group) => {
          const active = group.items.some((item) => location.pathname === item.to || location.pathname.startsWith(`${item.to}/`));
          const open = openGroups[group.label] || active;
          return (
            <div key={group.label}>
              <button
                type="button"
                className={`flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold transition ${active ? "text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
                onClick={() => setOpenGroups((value) => ({ ...value, [group.label]: !open }))}
                title={collapsed ? group.label : undefined}
              >
                <span className="shrink-0">{group.icon}</span>
                {!collapsed ? <span className="min-w-0 flex-1 truncate text-left">{group.label}</span> : null}
                {!collapsed ? <ChevronDown size={15} className={`transition ${open ? "rotate-180" : ""}`} /> : null}
              </button>
              {!collapsed && open ? (
                <div className="mt-1 space-y-1">
                  {group.items.filter((item) => canView(permissions, item.permission)).map((item) => (
                    <SidebarLink key={`${group.label}-${item.label}`} to={item.to} label={item.label} collapsed={collapsed} inset />
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
        {visibleLinks.map((link) => (
          <SidebarLink key={link.to} to={link.to} icon={link.icon} label={link.label} collapsed={collapsed} />
        ))}
      </nav>

      <div className="space-y-2 border-t border-gray-200 p-3">
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600" title="Current society">
          <Home size={14} className="shrink-0 text-blue-600" />
          {!collapsed ? <span className="truncate">{society?.society_name ?? "All societies"}</span> : null}
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {(user?.full_name ?? user?.email ?? "A").slice(0, 1).toUpperCase()}
          </div>
          {!collapsed ? (
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-gray-900">{user?.full_name ?? user?.email ?? "Admin"}</p>
              <p className="text-xs text-blue-600 capitalize">{(user?.role ?? "admin").replace(/_/g, " ").toLowerCase().replace(/\b\w/g, c => c.toUpperCase())}</p>
            </div>
          ) : null}
          {!collapsed && onLogout ? (
            <button type="button" onClick={onLogout} title="Logout" className="ml-auto shrink-0 rounded-md p-1 text-gray-400 hover:bg-blue-100 hover:text-red-500">
              <LogOut size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon, label, collapsed, inset }: { to: string; icon?: ReactElement; label: string; collapsed: boolean; inset?: boolean }) {
  return (
    <NavLink
      to={to}
      end={to === "/dashboard"}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-md py-2 pr-3 text-sm font-medium transition ${
          inset ? "pl-9" : "pl-3"
        } ${
          isActive
            ? "border-l-[3px] border-blue-600 bg-blue-50 text-blue-600"
            : "border-l-[3px] border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`
      }
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      {!collapsed ? <span className="truncate">{label}</span> : null}
    </NavLink>
  );
}

function canView(permissions: readonly string[], permission: string) {
  return hasPermission(permissions, `${permission}.view` as Permission) || hasPermission(permissions, `${permission}.manage` as Permission);
}
