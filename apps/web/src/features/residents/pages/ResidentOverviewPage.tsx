import { Card, Skeleton } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowDownToLine, ArrowUpFromLine, Home, TrendingUp, Users } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const mapResidentType = (v: unknown) => {
  const s = String(v ?? "").toUpperCase();
  return s === "FAMILY" ? "OWNER" : s;
};

const QUICK_ACTIONS = [
  { label: "Add New Resident", to: "/residents" },
  { label: "Generate QR Passes", to: "/residents/qr-pass" },
  { label: "Bulk Import", to: "/residents/import" },
  { label: "Export Directory", to: "/residents" },
  { label: "View Lease Agreements", to: "/residents/leases" },
  { label: "Manage Vehicles", to: "/residents/vehicles" },
];

export function ResidentOverviewPage() {
  const { queryParams } = useScope();
  const navigate = useNavigate();

  const { data: resRaw, isLoading: resLoading } = useQuery({
    queryKey: ["residents-overview", queryParams],
    queryFn: () => residentsApi.getAll({ ...queryParams, limit: 200 }),
    retry: false,
  });
  const { data: unitRaw } = useQuery({
    queryKey: ["units-overview", queryParams],
    queryFn: () => residentsApi.getUnits({ ...queryParams, limit: 200 }),
    retry: false,
  });

  const residents = normalizeList<Record<string, unknown>>(resRaw?.data ?? resRaw);
  const units = normalizeList<Record<string, unknown>>(unitRaw?.data ?? unitRaw);

  const totalResidents = residents.length;
  const owners = residents.filter((r) => mapResidentType(r.resident_type) === "OWNER").length;
  const tenants = residents.filter((r) => mapResidentType(r.resident_type) === "TENANT").length;
  const occupied = units.filter((u) => ["OWNER_OCCUPIED", "RENTED", "OCCUPIED"].includes(String(u.occupancy_status ?? "").toUpperCase())).length;
  const vacant = units.length - occupied;

  const moveData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const month = d.toLocaleString("default", { month: "short" });
      return {
        month,
        in: residents.filter((r) => String(r.move_in_date ?? "").startsWith(key)).length,
        out: residents.filter((r) => String(r.move_out_date ?? "").startsWith(key)).length,
      };
    });
  }, [residents]);

  const pieData = [
    { name: "Owner", value: owners, color: "#2563eb" },
    { name: "Tenant", value: tenants, color: "#7c3aed" },
  ];

  const stats = [
    { label: "Total Residents", value: totalResidents, icon: Users, color: "bg-blue-100 text-blue-700" },
    { label: "Occupied Units", value: occupied, icon: Home, color: "bg-green-100 text-green-700" },
    { label: "Tenants", value: tenants, icon: TrendingUp, color: "bg-purple-100 text-purple-700" },
    { label: "Vacant Units", value: vacant, icon: ArrowUpFromLine, color: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Residents / Overview</p>
        <h1 className="text-2xl font-bold text-gray-900">Resident Overview</h1>
        <p className="mt-1 text-sm text-gray-500">Occupancy and resident statistics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                {resLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${s.color}`}><s.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Move In vs Move Out</h2>
          <p className="mt-1 text-sm text-gray-500">Monthly resident transitions</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={moveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="in" name="Move In" fill="#2563eb" radius={[4, 4, 0, 0]} />
                <Bar dataKey="out" name="Move Out" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Owner vs Tenant</h2>
          <p className="mt-1 text-sm text-gray-500">Resident type distribution</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90} paddingAngle={4}>
                  {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900">Quick Actions</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => (
            <button key={action.label} type="button" onClick={() => navigate(action.to)} className="flex items-center gap-3 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition">
              <ArrowDownToLine size={16} className="text-blue-500" />
              {action.label}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
