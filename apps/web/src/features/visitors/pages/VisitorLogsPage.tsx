import { Button, DataTable, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Upload } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { useScope } from "@/app/scope/ScopeProvider";


const TYPE_COLORS: Record<string, string> = {
  WALK_IN:      "bg-blue-100 text-blue-700",
  PRE_APPROVED: "bg-purple-100 text-purple-700",
  RECURRING:    "bg-green-100 text-green-700",
  DELIVERY:     "bg-amber-100 text-amber-700",
  VENDOR:       "bg-gray-100 text-gray-700",
  STAFF:        "bg-teal-100 text-teal-700",
};

export function VisitorLogsPage() {
  const { queryParams } = useScope();
  const qc = useQueryClient();
  const [type, setType] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["visitors-logs", queryParams, type, status, dateFrom, dateTo],
    queryFn: () => visitorsApi.getAll({
      ...queryParams,
      visitor_type: type || undefined,
      status: status || undefined,
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
      page: 1,
      page_size: 100,
    }),
    retry: false,
  });

  let rows = normalizeList<Record<string, unknown>>(
    (raw as any)?.data?.data?.data ?? (raw as any)?.data?.data ?? raw?.data ?? raw
  );
  if (type) rows = rows.filter((r) => String(r.visitor_type ?? "") === type);
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);

  const handleExport = () => {
    if (!rows.length) { toast.error("No data to export"); return; }
    const headers = ["visitor_name", "visitor_type", "unit_number", "purpose", "check_in_at", "check_out_at", "status"];
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => `"${String(r[h] ?? "")}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visitors_export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
      let success = 0, failed = 0;
      for (const line of lines.slice(1)) {
        const values = line.split(",").map((v) => v.replace(/"/g, "").trim());
        const row: Record<string, string> = {};
        headers.forEach((h, i) => (row[h] = values[i] ?? ""));
        try {
          await visitorsApi.createVisitor({
            society_id: queryParams.society_id,
            visitor_name: row.visitor_name,
            visitor_type: row.visitor_type || "WALK_IN",
            visitor_mobile: row.visitor_mobile || undefined,
            purpose: row.purpose || undefined,
            vehicle_number: row.vehicle_number || undefined,
          });
          success++;
        } catch {
          failed++;
        }
      }
      toast.success(`Imported ${success} visitors${failed ? `, ${failed} failed` : ""}`);
      qc.invalidateQueries({ queryKey: ["visitors-logs"] });
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Visitor Logs</p>
          <h1 className="text-2xl font-bold text-gray-900">Visitor Logs</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} visitor entries</p>
        </div>
        <div className="flex gap-2">
          <label className="cursor-pointer">
            <input type="file" accept=".csv" className="hidden" onChange={handleImport} />
            <Button variant="secondary" asChild>
              <span><Upload size={15} className="mr-1" />Import</span>
            </Button>
          </label>
          <Button variant="secondary" onClick={handleExport}>
            <Download size={15} className="mr-1" />Export
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select className="w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All Types</option>
          <option value="WALK_IN">Walk-In</option>
          <option value="PRE_APPROVED">Pre-Approved</option>
          <option value="RECURRING">Recurring</option>
          <option value="DELIVERY">Delivery</option>
          <option value="VENDOR">Vendor</option>
          <option value="STAFF">Staff</option>
        </Select>
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="CHECKED_IN">Checked In</option>
          <option value="CHECKED_OUT">Checked Out</option>
          <option value="REJECTED">Rejected</option>
          <option value="EXPIRED">Expired</option>
        </Select>
        <input
          type="date"
          className="h-10 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-blue-400"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <input
          type="date"
          className="h-10 rounded-md border border-gray-200 px-3 text-sm outline-none focus:border-blue-400"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />
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
          { key: "purpose", header: "PURPOSE" },
          { key: "check_in_at", header: "CHECK-IN" },
          { key: "check_out_at", header: "CHECK-OUT", render: (row) => <span>{String(row.check_out_at ?? "—")}</span> },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
