import { Button, DataTable, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, applied_date: "2024-01-31", unit_number: "B-202", reason: "Late payment penalty", amount: 500, status: "PENDING" },
  { id: 2, applied_date: "2024-01-31", unit_number: "A-204", reason: "Late payment penalty", amount: 500, status: "PAID" },
  { id: 3, applied_date: "2024-01-15", unit_number: "C-305", reason: "Noise violation", amount: 1000, status: "PAID" },
  { id: 4, applied_date: "2024-01-20", unit_number: "D-108", reason: "Parking rule violation", amount: 750, status: "PENDING" },
  { id: 5, applied_date: "2024-01-10", unit_number: "B-301", reason: "Late payment penalty", amount: 500, status: "WAIVED" },
];

export function PenaltyManagementPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["penalties", queryParams],
    queryFn: () => financialsApi.getInvoices({ ...queryParams, status: "OVERDUE", page: 1, pageSize: 100 }),
    retry: false,
  });

  const overdue = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((i) => String(i.status ?? "").toUpperCase() === "OVERDUE");
  const rows = overdue.length ? overdue : MOCK;

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
