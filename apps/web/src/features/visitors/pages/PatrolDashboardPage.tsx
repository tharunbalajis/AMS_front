import { Card, DataTable, Skeleton, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Activity, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { patrolApi } from "@/api/patrol.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function PatrolDashboardPage() {
  const { queryParams } = useScope();
  const { data: raw, isLoading } = useQuery({
    queryKey: ["patrol-dashboard", queryParams],
    queryFn: () => patrolApi.getDashboard({ society_id: queryParams.society_id }),
    retry: false,
    refetchInterval: 30000,
  });
  const d = (raw as any)?.data?.data ?? (raw as any)?.data ?? {};
  const recent = normalizeList<Record<string, unknown>>(d.recent_patrols);
  const kpis = [
    { label: "QR Points Total",  value: d.total_qr_points ?? 0,         icon: Shield,        color: "bg-blue-100 text-blue-700" },
    { label: "Active Patrols",   value: d.active_patrols ?? 0,          icon: Activity,      color: "bg-green-100 text-green-700" },
    { label: "Completed Today",  value: d.completed_today ?? 0,         icon: CheckCircle,   color: "bg-emerald-100 text-emerald-700" },
    { label: "Fraud Flags Open", value: d.unreviewed_fraud_flags ?? 0,  icon: AlertTriangle, color: "bg-red-100 text-red-700" },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Security Patrol Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">Patrol Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Real-time floor patrol verification across all blocks</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                {isLoading ? <div className="mt-2 h-8 w-16 bg-gray-200 rounded animate-pulse" /> : <p className="mt-1 text-3xl font-bold text-gray-900">{kpi.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${kpi.color}`}><kpi.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>
      <DataTable
        title="Recent Patrols"
        rows={recent}
        isLoading={isLoading}
        columns={[
          { key: "guard_id",       header: "GUARD ID" },
          { key: "patrol_status",  header: "STATUS",     render: (r) => <StatusBadge value={r.patrol_status} /> },
          { key: "scanned_points", header: "SCANNED" },
          { key: "total_points",   header: "TOTAL" },
          { key: "completion_pct", header: "COMPLETION %", render: (r) => `${r.completion_pct ?? 0}%` },
          { key: "started_at",     header: "STARTED AT" },
        ]}
      />
    </div>
  );
}
