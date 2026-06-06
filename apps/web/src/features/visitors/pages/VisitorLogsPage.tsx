import { Button, DataTable, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { useState } from "react";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, visitor_name: "Raj Verma", visitor_type: "GUEST", unit_number: "A-101", host_name: "Aarav Sharma", check_in: "10:30 AM", check_out: "12:30 PM", mode: "QR", status: "EXITED" },
  { id: 2, visitor_name: "Amit Joshi", visitor_type: "DELIVERY", unit_number: "B-202", host_name: "Priya Patel", check_in: "11:15 AM", check_out: null, mode: "MANUAL", status: "INSIDE" },
  { id: 3, visitor_name: "Meera Singh", visitor_type: "SERVICE", unit_number: "C-305", host_name: "Rahul Kumar", check_in: "09:00 AM", check_out: "10:00 AM", mode: "PASS", status: "CHECKED_OUT" },
  { id: 4, visitor_name: "Kiran Shah", visitor_type: "GUEST", unit_number: "D-401", host_name: "Vijay Mehta", check_in: "02:00 PM", check_out: null, mode: "QR", status: "INSIDE" },
  { id: 5, visitor_name: "Deepak Roy", visitor_type: "VENDOR", unit_number: "A-204", host_name: "Sneha Gupta", check_in: "03:30 PM", check_out: "04:30 PM", mode: "MANUAL", status: "EXITED" },
  { id: 6, visitor_name: "Sunita Nair", visitor_type: "GUEST", unit_number: "B-108", host_name: "Nisha Reddy", check_in: "01:00 PM", check_out: "03:00 PM", mode: "QR", status: "EXITED" },
];

const TYPE_COLORS: Record<string, string> = {
  GUEST: "bg-blue-100 text-blue-700",
  DELIVERY: "bg-amber-100 text-amber-700",
  SERVICE: "bg-purple-100 text-purple-700",
  VENDOR: "bg-gray-100 text-gray-700",
};

export function VisitorLogsPage() {
  const { queryParams } = useScope();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["visitors-logs", queryParams, type, status],
    queryFn: () => visitorsApi.getAll({ ...queryParams, visitor_type: type || undefined, status: status || undefined, page: 1, page_size: 100 }),
    retry: false,
  });

  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  let rows = fetched.length ? fetched : MOCK;
  if (type) rows = rows.filter((r) => String(r.visitor_type ?? "") === type);
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Visitor Logs</p>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Logs</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} visitor entries</p>
        </div>
        <Button variant="secondary"><Download size={15} className="mr-1" />Export</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select className="w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="GUEST">Guest</option>
          <option value="DELIVERY">Delivery</option>
          <option value="SERVICE">Service</option>
          <option value="VENDOR">Vendor</option>
        </Select>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="INSIDE">Inside</option>
          <option value="EXITED">Exited</option>
          <option value="CHECKED_OUT">Checked Out</option>
        </Select>
        <input type="date" className="h-10 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-blue-400" />
      </div>

      <DataTable
        title="Visitor Log"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "visitor_name", header: "NAME" },
          {
            key: "visitor_type", header: "TYPE",
            render: (row) => (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TYPE_COLORS[String(row.visitor_type ?? "")] ?? "bg-gray-100 text-gray-700"}`}>
                {String(row.visitor_type ?? "-")}
              </span>
            )
          },
          { key: "unit_number", header: "UNIT" },
          { key: "host_name", header: "HOST" },
          { key: "check_in", header: "CHECK-IN" },
          { key: "check_out", header: "CHECK-OUT", render: (row) => <span>{String(row.check_out ?? "—")}</span> },
          { key: "mode", header: "MODE" },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
