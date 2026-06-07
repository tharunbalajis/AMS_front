import { Button, DataTable } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpCircle } from "lucide-react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";


const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700 font-bold",
  HIGH: "bg-orange-100 text-orange-700 font-bold",
};

export function EscalationQueuePage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["complaints-escalation", queryParams],
    queryFn: () => complaintsApi.getAll({ ...queryParams, page: 1, page_size: 50 }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((c) => ["CRITICAL", "HIGH"].includes(String(c.priority ?? "").toUpperCase()));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Complaints / Escalation Queue</p>
        <h1 className="text-2xl font-bold text-gray-900">Escalation Queue</h1>
        <p className="mt-1 text-sm text-gray-500">Critical and high-priority complaints requiring immediate attention</p>
      </div>

      <DataTable
        title="Escalation Queue"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "ticket_number", header: "TICKET", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.ticket_number ?? `CMP-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "title", header: "TITLE", render: (row) => <span className="font-medium text-gray-900">{String(row.title ?? "-")}</span> },
          {
            key: "priority", header: "PRIORITY",
            render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs ${PRIORITY_COLORS[String(row.priority ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.priority ?? "-")}</span>
          },
          { key: "unit_number", header: "UNIT" },
          { key: "days_open", header: "DAYS OPEN", render: (row) => <span className="font-semibold text-red-600">{String(row.days_open ?? "—")} days</span> },
          { key: "assigned_to", header: "ASSIGNED", render: (row) => <span className="text-gray-600">{String(row.assigned_to ?? "Unassigned")}</span> },
          {
            key: "escalate", header: "ACTION",
            render: () => (
              <Button variant="secondary" className="h-8 px-3 text-xs text-red-600 border-red-200 hover:bg-red-50">
                <ArrowUpCircle size={13} className="mr-1" />Escalate
              </Button>
            )
          },
        ]}
      />
    </div>
  );
}
