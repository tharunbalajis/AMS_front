import { DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";


const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
};

export function SLAMonitoringPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["complaints-sla", queryParams],
    queryFn: () => complaintsApi.getAll({ ...queryParams, page: 1, page_size: 100 }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(String(c.status ?? "").toUpperCase()));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / SLA Monitoring</p>
        <h1 className="text-2xl font-bold text-gray-900">SLA Monitoring</h1>
        <p className="mt-1 text-sm text-gray-500">Track open complaints against service level agreements</p>
      </div>

      <DataTable
        title="Open Complaints – SLA Status"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "ticket_number", header: "TICKET", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.ticket_number ?? `CMP-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "title", header: "TITLE", render: (row) => <span className="font-medium">{String(row.title ?? "-")}</span> },
          {
            key: "priority", header: "PRIORITY",
            render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[String(row.priority ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.priority ?? "-")}</span>
          },
          { key: "sla_hours", header: "SLA HRS", render: (row) => <span className="font-mono">{String(row.sla_hours ?? "—")}h</span> },
          { key: "unit_number", header: "UNIT" },
          {
            key: "status", header: "STATUS",
            render: (row) => (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${String(row.status ?? "").toUpperCase() === "BREACHED" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>
                {String(row.status ?? "").toUpperCase() === "BREACHED" ? "BREACHED" : "ON TRACK"}
              </span>
            )
          },
        ]}
      />
    </div>
  );
}
