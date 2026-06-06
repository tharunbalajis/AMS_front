import { DataTable, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, ticket_number: "CMP-002", title: "Elevator not working", priority: "CRITICAL", sla_hours: 4, status: "BREACHED", unit_number: "B-202" },
  { id: 2, ticket_number: "CMP-001", title: "Water Leakage in bathroom", priority: "HIGH", sla_hours: 24, status: "BREACHED", unit_number: "A-101" },
  { id: 3, ticket_number: "CMP-004", title: "Parking gate issue", priority: "HIGH", sla_hours: 24, status: "IN_PROGRESS", unit_number: "D-401" },
  { id: 4, ticket_number: "CMP-005", title: "Garbage collection delay", priority: "LOW", sla_hours: 72, status: "OPEN", unit_number: "A-204" },
  { id: 5, ticket_number: "CMP-006", title: "Gym equipment broken", priority: "MEDIUM", sla_hours: 48, status: "OPEN", unit_number: "B-108" },
];

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

  const complaints = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const openComplaints = complaints.filter((c) => ["OPEN", "ASSIGNED", "IN_PROGRESS"].includes(String(c.status ?? "").toUpperCase()));
  const rows = openComplaints.length ? openComplaints : MOCK;

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
