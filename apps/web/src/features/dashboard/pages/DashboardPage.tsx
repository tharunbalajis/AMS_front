import { Card, Skeleton } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowRight,
  Building,
  Building2,
  ClipboardList,
  FileText,
  Home,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { dashboardApi } from "../../../app/api/client";
import { useScope } from "../../../app/scope/ScopeProvider";
import { QK } from "@/lib/queryKeys";

export function DashboardPage() {
  const { queryParams, society } = useScope();

  const overview = useQuery({
    queryKey: ["dashboard-overview", queryParams],
    queryFn: () => dashboardApi.overview(queryParams),
  });

  const statsQuery = useQuery({
    queryKey: QK.dashboardStats(society?.society_id ?? 0),
    queryFn: () => dashboardApi.stats(society?.society_id),
    enabled: !!society?.society_id,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });

  const data  = overview.data;
  const stats = statsQuery.data;

  const residents   = useMemo(() => normalizeList(data?.residents ?? []), [data]);
  const units       = useMemo(() => normalizeList(data?.units ?? []),     [data]);
  const complaints  = useMemo(() => normalizeList(data?.complaints ?? []), [data]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalResidents  = stats?.total_residents   ?? residents.length;
  const totalUnits      = stats?.total_units        ?? units.length;
  const activeResidents = residents.filter(r => r.is_active === true || r.is_active === "true").length;
  const owners          = residents.filter(r => String(r.resident_type ?? "").toUpperCase() === "OWNER").length;
  const tenants         = residents.filter(r => String(r.resident_type ?? "").toUpperCase() === "TENANT").length;
  const occupied        = stats?.occupied_units     ?? units.filter(u => String(u.occupancy_status ?? "").toUpperCase() !== "VACANT").length;
  const openComplaints  = stats?.open_complaints    ?? complaints.filter(c => !["RESOLVED", "CLOSED"].includes(String(c.status ?? "").toUpperCase())).length;
  const occupancyPct    = totalUnits ? ((occupied / totalUnits) * 100).toFixed(1) : "0.0";
  const visitorsToday   = stats?.visitors_today     ?? (data?.visitors ?? []).length;
  const activeStaff     = stats?.active_staff       ?? (data?.staff ?? []).length;

  // New fields from the enhanced stats endpoint
  const totalOwners     = (stats as any)?.total_owners          ?? owners;
  const totalTenants    = (stats as any)?.total_tenants         ?? tenants;
  const vacantUnits     = (stats as any)?.vacant_units          ?? (totalUnits - occupied);
  const totalOccupants  = (stats as any)?.total_occupants       ?? 0;
  const avgOccupancy    = (stats as any)?.avg_occupancy_per_unit ?? 0;

  // ── Chart 1: Residents by block ───────────────────────────────────────────
  const residentsByBlock = useMemo(() => {
    const map = new Map<string, number>();
    residents.forEach(r => {
      const key = String(r.block_name ?? "Unknown");
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [residents]);

  // ── Chart 2: Owner vs Tenant split ───────────────────────────────────────
  const ownerTenantData = useMemo(() => [
    { name: "Owners",  value: owners  || (residents.length - tenants), color: "#2563eb" },
    { name: "Tenants", value: tenants,                                  color: "#7c3aed" },
  ], [owners, tenants, residents.length]);

  // ── Chart 3: Unit occupancy by block ─────────────────────────────────────
  const occupancyByBlock = useMemo(() => {
    const map = new Map<string, { occupied: number; vacant: number }>();
    units.forEach(u => {
      const key = String(u.block_name ?? "Unknown");
      const cur = map.get(key) ?? { occupied: 0, vacant: 0 };
      if (String(u.occupancy_status ?? "").toUpperCase() !== "VACANT") cur.occupied += 1;
      else cur.vacant += 1;
      map.set(key, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, occupied: v.occupied, vacant: v.vacant }))
      .slice(0, 8);
  }, [units]);

  // ── Chart 4: Move-ins by month (last 6 months) ────────────────────────────
  const moveInsByMonth = useMemo(() => {
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      return { key, label };
    });
    const counts = new Map(months.map(m => [m.key, 0]));
    residents.forEach(r => {
      if (!r.move_in_date) return;
      const key = String(r.move_in_date).slice(0, 7);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return months.map(m => ({ month: m.label, moveIns: counts.get(m.key) ?? 0 }));
  }, [residents]);

  // ── Recent residents ─────────────────────────────────────────────────────
  const recentResidents = useMemo(() =>
    [...residents]
      .sort((a, b) => new Date(String(b.created_at ?? 0)).getTime() - new Date(String(a.created_at ?? 0)).getTime())
      .slice(0, 5),
    [residents]
  );

  const isLoading = overview.isLoading || statsQuery.isLoading;

  // ── KPI card definitions ──────────────────────────────────────────────────
  const kpiCards = [
    { label: "TOTAL RESIDENTS",    value: totalResidents,              icon: Users,       accent: "border-l-blue-500",   bg: "bg-blue-50",    text: "text-blue-700"   },
    { label: "ACTIVE RESIDENTS",   value: activeResidents,             icon: Users,       accent: "border-l-green-500",  bg: "bg-green-50",   text: "text-green-700"  },
    { label: "TOTAL UNITS",        value: totalUnits,                  icon: Home,        accent: "border-l-purple-500", bg: "bg-purple-50",  text: "text-purple-700" },
    { label: "OCCUPIED UNITS",     value: occupied,                    icon: Building,    accent: "border-l-teal-500",   bg: "bg-teal-50",    text: "text-teal-700",  sub: `${occupancyPct}% occupancy` },
    { label: "VACANT UNITS",       value: vacantUnits,                 icon: Home,        accent: "border-l-gray-400",   bg: "bg-gray-50",    text: "text-gray-700"   },
    { label: "OWNERS",             value: totalOwners,                 icon: Shield,      accent: "border-l-indigo-500", bg: "bg-indigo-50",  text: "text-indigo-700" },
    { label: "TENANTS",            value: totalTenants,                icon: Users,       accent: "border-l-violet-500", bg: "bg-violet-50",  text: "text-violet-700" },
    { label: "TOTAL OCCUPANTS",    value: totalOccupants,              icon: Users,       accent: "border-l-cyan-500",   bg: "bg-cyan-50",    text: "text-cyan-700"   },
    { label: "AVG OCCUPANCY/UNIT", value: `${Number(avgOccupancy).toFixed(1)}`, icon: TrendingUp, accent: "border-l-amber-500", bg: "bg-amber-50", text: "text-amber-700" },
    { label: "OPEN COMPLAINTS",    value: openComplaints,              icon: AlertCircle, accent: "border-l-red-500",    bg: "bg-red-50",     text: "text-red-700"    },
    { label: "OCCUPANCY RATE",     value: `${occupancyPct}%`,          icon: TrendingUp,  accent: "border-l-emerald-500",bg: "bg-emerald-50", text: "text-emerald-700"},
    { label: "VISITORS TODAY",     value: visitorsToday,               icon: Shield,      accent: "border-l-pink-500",   bg: "bg-pink-50",    text: "text-pink-700"   },
  ];

  const quickActions = [
    { label: "Add Resident", to: "/residents",              icon: Users      },
    { label: "View Units",   to: "/units",                  icon: Home       },
    { label: "Complaints",   to: "/complaints",             icon: ClipboardList },
    { label: "Notices",      to: "/notices",                icon: FileText   },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">AMS / Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">
            {society?.society_name ?? "All Societies"} — real-time resident &amp; occupancy overview
          </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map(kpi => (
          <Card key={kpi.label} className={`border-l-4 p-4 ${kpi.accent} ${kpi.bg}`}>
            <div className="flex items-start justify-between">
              <p className={`text-xs font-semibold uppercase tracking-wide opacity-70 ${kpi.text}`}>{kpi.label}</p>
              <kpi.icon size={16} className={`opacity-60 ${kpi.text}`} />
            </div>
            {isLoading ? (
              <Skeleton className="mt-3 h-8 w-20" />
            ) : (
              <div className="mt-3">
                <p className={`text-2xl font-bold ${kpi.text}`}>{String(kpi.value)}</p>
                {kpi.sub && <p className={`mt-0.5 text-xs font-medium opacity-70 ${kpi.text}`}>{kpi.sub}</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Residents by Block</h2>
          <p className="mt-1 text-sm text-gray-500">Total registered residents per block</p>
          <div className="mt-4 h-64">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={residentsByBlock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" name="Residents" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Owner vs Tenant</h2>
          <p className="mt-1 text-sm text-gray-500">Resident type distribution</p>
          <div className="mt-4 h-64">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={ownerTenantData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                    {ownerTenantData.map(entry => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Unit Occupancy by Block</h2>
          <p className="mt-1 text-sm text-gray-500">Occupied vs vacant per block</p>
          <div className="mt-4 h-56">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={occupancyByBlock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="occupied" name="Occupied" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="vacant"   name="Vacant"   fill="#e5e7eb" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Move-ins (Last 6 Months)</h2>
          <p className="mt-1 text-sm text-gray-500">New residents by move-in month</p>
          <div className="mt-4 h-56">
            {isLoading ? <Skeleton className="h-full w-full" /> : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={moveInsByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="moveIns" name="Move-ins" stroke="#2563eb" strokeWidth={2} dot={{ fill: "#2563eb", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        {/* Recent Residents */}
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Residents</h2>
            <Link to="/residents" className="flex items-center gap-1 text-sm text-blue-600 hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)
              : recentResidents.length === 0
                ? <p className="py-6 text-center text-sm text-gray-400">No residents data available</p>
                : recentResidents.map((r: any) => {
                    const initials = String(r.full_name ?? "?").slice(0, 2).toUpperCase();
                    const typeColor = String(r.resident_type ?? "").toUpperCase() === "OWNER" ? "bg-blue-100 text-blue-700" : "bg-violet-100 text-violet-700";
                    return (
                      <div key={String(r.id)} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-bold text-white">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-gray-900">{String(r.full_name ?? "—")}</p>
                          <p className="text-xs text-gray-500">
                            {[r.block_name, r.unit_number].filter(Boolean).join(" · ") || "No unit"} ·{" "}
                            {r.move_in_date ? new Date(String(r.move_in_date)).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </p>
                        </div>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColor}`}>
                          {String(r.resident_type ?? "—")}
                        </span>
                      </div>
                    );
                  })
            }
          </div>
        </Card>

        {/* Quick Actions + Stats snapshot */}
        <div className="space-y-4">
          <Card className="p-5">
            <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {quickActions.map(a => (
                <Link
                  key={a.label}
                  to={a.to}
                  className="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors"
                >
                  <a.icon size={15} />
                  {a.label}
                </Link>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-base font-semibold text-gray-900">Society Snapshot</h2>
            <div className="mt-3 space-y-2">
              {[
                { label: "Visitors Today", value: visitorsToday,  icon: Shield          },
                { label: "Active Staff",   value: activeStaff,    icon: Users           },
                { label: "Blocks",         value: (stats as any)?.blocks_count ?? (stats as any)?.blocks ?? "—", icon: Building2 },
                { label: "Societies",      value: (stats as any)?.societies_count ?? (stats as any)?.societies ?? "—", icon: Building2 },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <item.icon size={14} className="text-gray-400" />
                    {item.label}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">
                    {isLoading ? "…" : String(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
