import { Button, DataTable, SearchBox } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, expense_date: "2024-01-15", category: "Maintenance", description: "Generator service", vendor: "PowerGen Co", amount: 25000, status: "APPROVED" },
  { id: 2, expense_date: "2024-01-12", category: "Utilities", description: "Electricity bill – Common area", vendor: "BESCOM", amount: 48000, status: "PAID" },
  { id: 3, expense_date: "2024-01-10", category: "Staff", description: "Security staff salary", vendor: "HR Dept", amount: 120000, status: "PAID" },
  { id: 4, expense_date: "2024-01-08", category: "Maintenance", description: "Lift repair parts", vendor: "Otis Elevators", amount: 18500, status: "PENDING" },
  { id: 5, expense_date: "2024-01-05", category: "Utilities", description: "Water tanker supply", vendor: "City Water Corp", amount: 12000, status: "PAID" },
  { id: 6, expense_date: "2024-01-03", category: "Housekeeping", description: "Cleaning supplies", vendor: "Hygienic Goods", amount: 8500, status: "APPROVED" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Maintenance: "bg-blue-100 text-blue-700",
  Utilities: "bg-purple-100 text-purple-700",
  Staff: "bg-green-100 text-green-700",
  Housekeeping: "bg-amber-100 text-amber-700",
  Others: "bg-gray-100 text-gray-600",
};

export function ExpenseTrackingPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["expenses", queryParams],
    queryFn: () => financialsApi.getExpenses({ ...queryParams, limit: 100 }),
    retry: false,
  });

  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const rows = (fetched.length ? fetched : MOCK).filter((r) => !search || String(r.description ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.vendor ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Finance / Expense Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} expense records</p>
        </div>
        <Button><Plus size={15} className="mr-1" />Add Expense</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search description, vendor..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Expenses"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "expense_date", header: "DATE" },
          {
            key: "category", header: "CATEGORY",
            render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[String(row.category ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.category ?? "-")}</span>
          },
          { key: "description", header: "DESCRIPTION", render: (row) => <span className="font-medium">{String(row.description ?? "-")}</span> },
          { key: "vendor", header: "VENDOR" },
          { key: "amount", header: "AMOUNT", render: (row) => <span className="font-semibold">{formatCurrency(Number(row.amount ?? 0))}</span> },
          {
            key: "status", header: "STATUS",
            render: (row) => {
              const s = String(row.status ?? "");
              const cls = s === "PAID" ? "bg-green-100 text-green-700" : s === "APPROVED" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700";
              return <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{s}</span>;
            }
          },
        ]}
      />
    </div>
  );
}
