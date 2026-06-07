import { Card, DataTable, Skeleton, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";


const CATEGORY_DATA = [
  { name: "Plumbing", count: 18 }, { name: "Electrical", count: 14 }, { name: "Security", count: 9 },
  { name: "Housekeeping", count: 12 }, { name: "Amenities", count: 6 }, { name: "Others", count: 3 },
];

const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
};

export function ComplaintDashboardPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["complaints-dashboard", queryParams],
    queryFn: () => complaintsApi.getAll({ ...queryParams, page: 1, page_size: 200 }),
    retry: false,
  });

  const complaints = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const totalOpen = complaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(String(c.status ?? "").toUpperCase())).length;
  const critical = complaints.filter((c) => String(c.priority ?? "").toUpperCase() === "CRITICAL").length;
  const slaBreached = complaints.filter((c) => c.sla_breach === true).length;
  const resolvedToday = complaints.filter((c) => String(c.status ?? "").toUpperCase() === "RESOLVED").length;

  const openComplaints = complaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(String(c.status ?? "").toUpperCase()));
  const rows = openComplaints.slice(0, 6);

  const statusCounts = {
    Open: complaints.filter((c) => String(c.status ?? "").toUpperCase() === "OPEN").length,
    Assigned: complaints.filter((c) => String(c.status ?? "").toUpperCase() === "ASSIGNED").length,
    In_Progress: complaints.filter((c) => String(c.status ?? "").toUpperCase() === "IN_PROGRESS").length,
    Resolved: complaints.filter((c) => String(c.status ?? "").toUpperCase() === "RESOLVED").length,
  };
  const pieData = [
    { name: "Open", value: statusCounts.Open, color: "#3b82f6" },
    { name: "Assigned", value: statusCounts.Assigned, color: "#8b5cf6" },
    { name: "In Progress", value: statusCounts.In_Progress, color: "#f59e0b" },
    { name: "Resolved", value: statusCounts.Resolved, color: "#10b981" },
  ];

  const kpis = [
    { label: "Total Open", value: totalOpen, icon: AlertCircle, color: "bg-blue-100 text-blue-700" },
    { label: "Critical", value: critical, icon: AlertTriangle, color: "bg-red-100 text-red-700" },
    { label: "SLA Breached", value: slaBreached, icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Resolved Today", value: resolvedToday, icon: CheckCircle, color: "bg-green-100 text-green-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">Complaints Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Overview of complaint lifecycle and resolution performance</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-12" /> : <p className="mt-1 text-3xl font-bold text-gray-900">{kpi.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${kpi.color}`}><kpi.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Status Distribution</h2>
          <p className="mt-1 text-sm text-gray-500">Complaint status breakdown</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={3}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">By Category</h2>
          <p className="mt-1 text-sm text-gray-500">Complaints by department</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CATEGORY_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis type="number" allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={90} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <DataTable
        title="Recent Complaints"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "ticket_number", header: "TICKET", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.ticket_number ?? `CMP-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "title", header: "TITLE", render: (row) => <span className="font-medium">{String(row.title ?? "-")}</span> },
          { key: "category_name", header: "CATEGORY" },
          { key: "priority", header: "PRIORITY", render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[String(row.priority ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.priority ?? "-")}</span> },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
          { key: "unit_number", header: "UNIT" },
          { key: "assigned_to", header: "ASSIGNED", render: (row) => <span className="text-gray-600">{String(row.assigned_to ?? "Unassigned")}</span> },
        ]}
      />
    </div>
  );
}
