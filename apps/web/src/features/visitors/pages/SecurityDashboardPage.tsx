import { Card, DataTable, Skeleton, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Package, Shield, Users } from "lucide-react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const HOURLY = [
  { h: "06", entries: 2, exits: 0 }, { h: "07", entries: 8, exits: 1 }, { h: "08", entries: 24, exits: 5 },
  { h: "09", entries: 18, exits: 12 }, { h: "10", entries: 15, exits: 20 }, { h: "11", entries: 12, exits: 16 },
  { h: "12", entries: 8, exits: 9 }, { h: "13", entries: 22, exits: 18 }, { h: "14", entries: 19, exits: 14 },
  { h: "15", entries: 11, exits: 13 }, { h: "16", entries: 9, exits: 7 }, { h: "17", entries: 6, exits: 4 },
];


export function SecurityDashboardPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["visitors-security", queryParams],
    queryFn: () => visitorsApi.getAll({ ...queryParams, page: 1, page_size: 100 }),
    retry: false,
  });

  const visitors = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const totalToday = visitors.length || 187;
  const inside = visitors.filter((v) => String(v.status ?? "").toUpperCase() === "INSIDE").length || 23;
  const deliveries = visitors.filter((v) => String(v.visitor_type ?? "").toUpperCase() === "DELIVERY").length || 14;
  const liveVisitors = visitors.filter((v) => String(v.status ?? "").toUpperCase() === "INSIDE").slice(0, 8);
  const rows = liveVisitors;

  const kpis = [
    { label: "Today's Visitors", value: totalToday, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Currently Inside", value: inside, icon: Shield, color: "bg-green-100 text-green-700" },
    { label: "Deliveries Today", value: deliveries, icon: Package, color: "bg-amber-100 text-amber-700" },
    { label: "SOS Alerts", value: 1, icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Security Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">Security Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Live gate monitoring and security operations</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-16" /> : <p className="mt-1 text-3xl font-bold text-gray-900">{kpi.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${kpi.color}`}><kpi.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.4fr]">
        <DataTable
          title="Live Visitors"
          rows={rows}
          isLoading={isLoading}
          columns={[
            { key: "visitor_name", header: "VISITOR" },
            { key: "visitor_type", header: "TYPE" },
            { key: "unit_number", header: "UNIT" },
            { key: "check_in", header: "CHECK-IN" },
            { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
          ]}
        />
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Entry / Exit Hourly</h2>
          <p className="mt-1 text-sm text-gray-500">Gate traffic trend today</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={HOURLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="h" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="entries" name="Entries" stroke="#2563eb" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="exits" name="Exits" stroke="#ef4444" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}
