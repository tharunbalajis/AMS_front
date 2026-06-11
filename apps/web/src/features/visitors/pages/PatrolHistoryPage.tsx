import { DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { patrolApi } from "@/api/patrol.api";
import { useScope } from "@/app/scope/ScopeProvider";

export function PatrolHistoryPage() {
  const { queryParams } = useScope();
  const navigate = useNavigate();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["patrol-history", queryParams],
    queryFn: () => patrolApi.getHistory({ society_id: queryParams.society_id }),
    retry: false,
  });
  const rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? (raw as any)?.data ?? raw
  );

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Visitor & Security / Security Patrol Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">Patrol History</h1>
        <p className="mt-1 text-sm text-gray-500">All completed and incomplete patrol sessions</p>
      </div>
      <DataTable
        title="Patrol Sessions"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "guard_id",       header: "GUARD ID" },
          { key: "patrol_status",  header: "STATUS",     render: (r) => <StatusBadge value={r.patrol_status} /> },
          { key: "scanned_points", header: "SCANNED" },
          { key: "total_points",   header: "TOTAL" },
          { key: "completion_pct", header: "COMPLETION %", render: (r) => `${r.completion_pct ?? 0}%` },
          { key: "started_at",     header: "STARTED" },
          { key: "completed_at",   header: "ENDED" },
          {
            key: "logs", header: "LOGS",
            render: (r) => (
              <button onClick={() => navigate(`/visitors/patrol/scan-logs/${r.id}`)}
                className="text-xs text-blue-600 hover:underline">
                View Logs
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
