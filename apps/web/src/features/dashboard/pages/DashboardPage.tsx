import { Card, Skeleton } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  BadgeDollarSign,
  Building,
  Building2,
  Clock,
  Download,
  FileBarChart,
  Home,
  Shield,
  Users,
} from "lucide-react";
import {
  Area,
  AreaChart,
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

const REVENUE_DATA = [
  { month: "Aug", revenue: 1850000, expenses: 620000 },
  { month: "Sep", revenue: 1920000, expenses: 680000 },
  { month: "Oct", revenue: 1880000, expenses: 590000 },
  { month: "Nov", revenue: 2100000, expenses: 720000 },
  { month: "Dec", revenue: 2050000, expenses: 640000 },
  { month: "Jan", revenue: 2230000, expenses: 710000 },
];

const COLLECTION_TREND = [
  { month: "Aug", collected: 1620000 },
  { month: "Sep", collected: 1780000 },
  { month: "Oct", collected: 1720000 },
  { month: "Nov", collected: 1950000 },
  { month: "Dec", collected: 1890000 },
  { month: "Jan", collected: 1980000 },
];

const TOP_DEFAULTERS = [
  { name: "Priya Patel", unit: "B-202", amount: 7800 },
  { name: "Rahul Kumar", unit: "C-305", amount: 9200 },
  { name: "Sneha Gupta", unit: "A-204", amount: 3500 },
  { name: "Deepa Raj", unit: "A-304", amount: 12000 },
  { name: "Ravi Pillai", unit: "D-108", amount: 6500 },
];

const OCCUPANCY_BY_SOCIETY = [
  { name: "Block A", pct: 94 },
  { name: "Block B", pct: 88 },
  { name: "Block C", pct: 92 },
  { name: "Block D", pct: 78 },
  { name: "Block E", pct: 85 },
];

export function DashboardPage() {
  const { queryParams, society } = useScope();
  const overview = useQuery({
    queryKey: ["dashboard-overview", queryParams],
    queryFn: () => dashboardApi.overview(queryParams),
  });
  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", society?.society_id],
    queryFn: () => dashboardApi.stats(society?.society_id),
  });
  const data = overview.data;
  const stats = statsQuery.data;

  const occupied = stats?.occupied_units ?? data?.units.filter((u) => String(u.occupancy_status ?? "").toUpperCase() === "OCCUPIED").length ?? 0;
  const totalUnits = stats?.total_units ?? data?.units.length ?? 0;
  const occupancyPct = stats?.occupancy_pct?.toFixed(1) ?? (totalUnits ? ((occupied / totalUnits) * 100).toFixed(1) : "0.0");
  const openComplaints = stats?.open_complaints ?? data?.complaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(String(c.status ?? "").toUpperCase())).length ?? 0;
  const pendingPaymentsCount = stats?.pending_payments ?? 0;
  const visitorsToday = stats?.visitors_today ?? data?.visitors.length ?? 0;
  const activeStaff = stats?.active_staff ?? data?.staff.length ?? 0;
  const totalResidents = stats?.total_residents ?? data?.residents.length ?? 0;

  const monthlyRevenue = data?.invoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0) ?? 0;

  const statusCounts = {
    Open: data?.complaints.filter((c) => String(c.status ?? "").toUpperCase() === "OPEN").length ?? 0,
    Assigned: data?.complaints.filter((c) => String(c.status ?? "").toUpperCase() === "ASSIGNED").length ?? 0,
    InProgress: data?.complaints.filter((c) => String(c.status ?? "").toUpperCase() === "IN_PROGRESS").length ?? 0,
    Resolved: data?.complaints.filter((c) => String(c.status ?? "").toUpperCase() === "RESOLVED").length ?? 0,
  };
  const complaintPie = [
    { name: "Open", value: statusCounts.Open || openComplaints, color: "#3b82f6" },
    { name: "Assigned", value: statusCounts.Assigned, color: "#8b5cf6" },
    { name: "In Progress", value: statusCounts.InProgress, color: "#f59e0b" },
    { name: "Resolved", value: statusCounts.Resolved, color: "#10b981" },
  ];

  const recentActivities = [
    ...(data?.residents.slice(0, 2).map((r) => ({ label: String(r.full_name ?? "Resident"), meta: `Move-in · ${String(r.unit_number ?? "")} ${String(r.block_name ?? "")}`, color: "bg-blue-500" })) ?? []),
    ...(data?.complaints.slice(0, 2).map((c) => ({ label: String(c.title ?? "Complaint"), meta: `${String(c.category_name ?? "")} · ${String(c.status ?? "")}`, color: "bg-amber-500" })) ?? []),
    ...(data?.visitors.slice(0, 2).map((v) => ({ label: String(v.visitor_name ?? "Visitor"), meta: `Entry · ${String(v.unit_id ?? "")}`, color: "bg-green-500" })) ?? []),
  ];
  const activities = recentActivities.length ? recentActivities : [
    { label: "No recent activity", meta: "Check back soon", color: "bg-gray-400" },
  ];

  const isLoading = overview.isLoading || statsQuery.isLoading;

  const kpiRow1 = [
    { label: "TOTAL UNITS", value: totalUnits, icon: Home, color: "bg-purple-50 text-purple-700 border-purple-100" },
    { label: "OCCUPIED UNITS", value: occupied, subtext: `${occupancyPct}% occupancy`, icon: Home, color: "bg-green-50 text-green-700 border-green-100" },
    { label: "RESIDENTS", value: totalResidents, icon: Users, color: "bg-teal-50 text-teal-700 border-teal-100" },
    { label: "VISITORS TODAY", value: visitorsToday, icon: Shield, color: "bg-sky-50 text-sky-700 border-sky-100" },
    { label: "ACTIVE STAFF", value: activeStaff, icon: Users, color: "bg-violet-50 text-violet-700 border-violet-100" },
  ];

  const kpiRow2 = [
    { label: "MONTHLY REVENUE", value: formatCurrency(monthlyRevenue), icon: BadgeDollarSign, color: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    { label: "PENDING PAYMENTS", value: pendingPaymentsCount, icon: Clock, color: "bg-amber-50 text-amber-700 border-amber-100" },
    { label: "OPEN COMPLAINTS", value: openComplaints, icon: AlertCircle, color: "bg-red-50 text-red-700 border-red-100" },
    { label: "SOCIETIES", value: "—", icon: Building2, color: "bg-blue-50 text-blue-700 border-blue-100" },
    { label: "BLOCKS", value: "—", icon: Building, color: "bg-indigo-50 text-indigo-700 border-indigo-100" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">AMS / Dashboard</p>
          <h1 className="text-2xl font-bold text-gray-900">Operations Dashboard</h1>
          <p className="mt-1 text-sm text-gray-500">Real-time overview across all modules and societies</p>
        </div>
        <div className="flex shrink-0 gap-2">
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Download size={14} />Export
          </button>
          <button type="button" className="inline-flex h-9 items-center gap-2 rounded-md bg-blue-600 px-3 text-sm font-medium text-white hover:bg-blue-700">
            <FileBarChart size={14} />Generate Report
          </button>
        </div>
      </div>

      {/* KPI Row 1 */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpiRow1.map((kpi) => (
          <Card key={kpi.label} className={`border p-4 ${kpi.color}`}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{kpi.label}</p>
              <kpi.icon size={16} className="opacity-60" />
            </div>
            {isLoading ? <Skeleton className="mt-3 h-8 w-20" /> : (
              <div className="mt-3">
                <p className="text-2xl font-bold">{String(kpi.value)}</p>
                {kpi.subtext && <p className="mt-0.5 text-xs font-medium opacity-70">{kpi.subtext} occupancy</p>}
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* KPI Row 2 */}
      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {kpiRow2.map((kpi) => (
          <Card key={kpi.label} className={`border p-4 ${kpi.color}`}>
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{kpi.label}</p>
              <kpi.icon size={16} className="opacity-60" />
            </div>
            {isLoading ? <Skeleton className="mt-3 h-8 w-20" /> : (
              <p className="mt-3 text-2xl font-bold">{String(kpi.value)}</p>
            )}
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Revenue vs Expenses</h2>
          <p className="mt-1 text-sm text-gray-500">6-month financial trend</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" fill="url(#revGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="expenses" name="Expenses" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Complaint Status</h2>
          <p className="mt-1 text-sm text-gray-500">Current distribution</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={complaintPie} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {complaintPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Payment Collection Trend</h2>
          <p className="mt-1 text-sm text-gray-500">Monthly collections</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={COLLECTION_TREND}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="collected" name="Collected" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Occupancy by Block</h2>
          <p className="mt-1 text-sm text-gray-500">Top 5 blocks</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={OCCUPANCY_BY_SOCIETY} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <YAxis type="category" dataKey="name" width={55} />
                <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} />
                <Bar dataKey="pct" name="Occupancy" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Recent Activities</h2>
          <div className="mt-4 space-y-3">
            {isLoading ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />) : activities.slice(0, 5).map((a, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${a.color}`}>
                  {String(a.label).slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{a.label}</p>
                  <p className="text-xs text-gray-500">{a.meta}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Top Defaulters</h2>
          <p className="mt-1 text-sm text-gray-500">Residents with highest outstanding dues</p>
          <div className="mt-4 space-y-3">
            {TOP_DEFAULTERS.map((d, i) => (
              <div key={d.unit} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2.5">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100 text-sm font-bold text-red-700">
                  {String(i + 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{d.name}</p>
                  <p className="text-xs text-gray-500">{d.unit}</p>
                </div>
                <span className="text-sm font-bold text-red-600">{formatCurrency(d.amount)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
