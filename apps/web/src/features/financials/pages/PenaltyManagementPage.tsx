import { Button, DataTable, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";


export function PenaltyManagementPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["penalties", queryParams],
    queryFn: () => financialsApi.getInvoices({ society_id: queryParams.society_id, status: "OVERDUE", page: 1, pageSize: 100 }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((i) => String(i.status ?? "").toUpperCase() === "OVERDUE");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Finance / Penalty Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Penalty Management</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} penalty records</p>
        </div>
        <Button variant="danger"><AlertTriangle size={15} className="mr-1" />Apply Penalty</Button>
      </div>

      <DataTable
        title="Penalties"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "applied_date", header: "APPLIED DATE" },
          { key: "unit_number", header: "UNIT" },
          { key: "reason", header: "REASON", render: (row) => <span className="text-gray-700">{String(row.reason ?? "Late payment penalty")}</span> },
          { key: "amount", header: "AMOUNT", render: (row) => <span className="font-semibold text-red-600">{formatCurrency(Number(row.amount ?? row.balance_due ?? 0))}</span> },
          {
            key: "status", header: "STATUS",
            render: (row) => {
              const s = String(row.status ?? "PENDING").toUpperCase();
              return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${s === "PAID" ? "bg-green-100 text-green-700" : s === "WAIVED" ? "bg-gray-100 text-gray-600" : "bg-red-100 text-red-700"}`}>{s}</span>;
            }
          },
        ]}
      />
    </div>
  );
}
