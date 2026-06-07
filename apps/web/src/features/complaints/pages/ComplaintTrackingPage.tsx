import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";


const PRIORITY_COLORS: Record<string, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  HIGH: "bg-orange-100 text-orange-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  LOW: "bg-gray-100 text-gray-600",
};

export function ComplaintTrackingPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["complaints-tracking", queryParams, status, priority],
    queryFn: () => complaintsApi.getAll({ ...queryParams, status: status || undefined, priority: priority || undefined, page: 1, page_size: 100 }),
    retry: false,
  });

  let rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  if (search) rows = rows.filter((r) => String(r.title ?? "").toLowerCase().includes(search.toLowerCase()));
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);
  if (priority) rows = rows.filter((r) => String(r.priority ?? "") === priority);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Complaints / Complaint Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Complaint Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} complaints</p>
        </div>
        <Button variant="secondary"><Download size={15} className="mr-1" />Export</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search complaint title..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
        <Select className="w-44" value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="">All Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </Select>
      </div>

      <DataTable
        title="Complaints"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "ticket_number", header: "TICKET", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.ticket_number ?? `CMP-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "title", header: "TITLE", render: (row) => <span className="font-medium">{String(row.title ?? "-")}</span> },
          {
            key: "category_name", header: "CATEGORY",
            render: (row) => <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">{String(row.category_name ?? "-")}</span>
          },
          {
            key: "priority", header: "PRIORITY",
            render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${PRIORITY_COLORS[String(row.priority ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.priority ?? "-")}</span>
          },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
          { key: "unit_number", header: "UNIT" },
          { key: "assigned_to", header: "ASSIGNED", render: (row) => <span className="text-gray-600">{String(row.assigned_to ?? "Unassigned")}</span> },
          { key: "created_at", header: "CREATED" },
          { key: "sla_due", header: "SLA DUE" },
        ]}
      />
    </div>
  );
}
