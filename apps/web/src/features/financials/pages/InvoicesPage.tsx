import { Badge, Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Download, Plus } from "lucide-react";
import { useState } from "react";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, invoice_number: "INV-2024-001", unit_number: "A-101", resident_name: "Aarav Sharma", period: "January 2024", total_amount: 8500, balance_due: 0, due_date: "2024-01-31", status: "PAID" },
  { id: 2, invoice_number: "INV-2024-002", unit_number: "B-202", resident_name: "Priya Patel", period: "January 2024", total_amount: 7800, balance_due: 7800, due_date: "2024-01-31", status: "OVERDUE" },
  { id: 3, invoice_number: "INV-2024-003", unit_number: "C-305", resident_name: "Rahul Kumar", period: "January 2024", total_amount: 9200, balance_due: 9200, due_date: "2024-02-15", status: "PENDING" },
  { id: 4, invoice_number: "INV-2024-004", unit_number: "D-401", resident_name: "Vijay Mehta", period: "January 2024", total_amount: 12000, balance_due: 0, due_date: "2024-01-31", status: "PAID" },
  { id: 5, invoice_number: "INV-2024-005", unit_number: "A-204", resident_name: "Sneha Gupta", period: "January 2024", total_amount: 6500, balance_due: 3000, due_date: "2024-01-31", status: "PARTIAL" },
  { id: 6, invoice_number: "INV-2024-006", unit_number: "B-108", resident_name: "Nisha Reddy", period: "January 2024", total_amount: 8000, balance_due: 0, due_date: "2024-01-31", status: "PAID" },
];

export function InvoicesPage() {
  const { queryParams } = useScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  const { data: raw, isLoading } = useQuery({
    queryKey: ["invoices", queryParams, status],
    queryFn: () => financialsApi.getInvoices({ ...queryParams, status: status || undefined, page: 1, pageSize: 100 }),
    retry: false,
  });

  const fetched = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  let rows = fetched.length ? fetched : MOCK;
  if (search) rows = rows.filter((r) => String(r.invoice_number ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.resident_name ?? "").toLowerCase().includes(search.toLowerCase()));
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);

  const outstanding = rows.reduce((s, r) => s + Number(r.balance_due ?? 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Finance / Invoices</p>
          <h1 className="text-2xl font-bold text-gray-900">Invoices</h1>
          <div className="mt-1 flex items-center gap-2">
            <p className="text-sm text-gray-500">{rows.length} invoices</p>
            {outstanding > 0 && <Badge className="bg-red-100 text-red-700">{formatCurrency(outstanding)} outstanding</Badge>}
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button variant="secondary"><Download size={15} className="mr-1" />Export</Button>
          <Button><Plus size={15} className="mr-1" />Create Invoice</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search invoice #, resident..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select className="w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="OVERDUE">Overdue</option>
          <option value="PARTIAL">Partial</option>
        </Select>
      </div>

      <DataTable
        title="Invoice Register"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "invoice_number", header: "INVOICE #", render: (row) => <span className="font-mono text-xs font-medium text-blue-700">{String(row.invoice_number ?? "-")}</span> },
          { key: "unit_number", header: "UNIT" },
          { key: "resident_name", header: "RESIDENT" },
          { key: "period", header: "PERIOD" },
          { key: "total_amount", header: "AMOUNT", render: (row) => <span className="font-medium">{formatCurrency(Number(row.total_amount ?? 0))}</span> },
          { key: "balance_due", header: "BALANCE", render: (row) => <span className={Number(row.balance_due ?? 0) > 0 ? "font-semibold text-red-600" : "text-gray-400"}>{formatCurrency(Number(row.balance_due ?? 0))}</span> },
          { key: "due_date", header: "DUE DATE" },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
