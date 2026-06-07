import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { complaintsApi } from "@/api/complaints.api";
import { useScope } from "@/app/scope/ScopeProvider";


export function MaintenanceRequestsPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["maintenance-requests", queryParams, status],
    queryFn: () => complaintsApi.getAll({ ...queryParams, status: status || undefined, page: 1, page_size: 100 }),
    retry: false,
  });

  let rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((r) =>
    String(r.category_name ?? "").toLowerCase().includes("maintenance")
  );
  if (search) rows = rows.filter((r) => String(r.title ?? "").toLowerCase().includes(search.toLowerCase()));
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Complaints / Maintenance Requests</p>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance Requests</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} maintenance tickets</p>
        </div>
        <Button><Plus size={15} className="mr-1" />New Request</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="flex-1" placeholder="Search maintenance request..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="OPEN">Open</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
        </Select>
      </div>

      <DataTable
        title="Maintenance Requests"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "ticket_number", header: "TICKET", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.ticket_number ?? `MNT-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "title", header: "TITLE", render: (row) => <span className="font-medium">{String(row.title ?? "-")}</span> },
          { key: "category_name", header: "CATEGORY" },
          { key: "unit_number", header: "UNIT" },
          { key: "vendor_name", header: "VENDOR", render: (row) => <span className="text-gray-600">{String(row.vendor_name ?? "Not Assigned")}</span> },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
