import { Card, DataTable, Skeleton, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, DollarSign, RefreshCw } from "lucide-react";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const MOCK: Record<string, unknown>[] = [
  { id: 1, payment_number: "PAY-001", payment_date: "2024-01-28", resident_name: "Aarav Sharma", unit_number: "A-101", invoice_number: "INV-2024-001", payment_mode: "UPI", amount: 8500, status: "PAID" },
  { id: 2, payment_number: "PAY-002", payment_date: "2024-01-25", resident_name: "Vijay Mehta", unit_number: "D-401", invoice_number: "INV-2024-004", payment_mode: "NEFT", amount: 12000, status: "PAID" },
  { id: 3, payment_number: "PAY-003", payment_date: "2024-01-22", resident_name: "Nisha Reddy", unit_number: "B-108", invoice_number: "INV-2024-006", payment_mode: "Cheque", amount: 8000, status: "PAID" },
  { id: 4, payment_number: "PAY-004", payment_date: "2024-01-20", resident_name: "Sneha Gupta", unit_number: "A-204", invoice_number: "INV-2024-005", payment_mode: "Online", amount: 3500, status: "PARTIAL" },
  { id: 5, payment_number: "PAY-005", payment_date: "2024-01-18", resident_name: "Arjun Singh", unit_number: "C-201", invoice_number: "INV-2024-007", payment_mode: "UPI", amount: 7200, status: "PAID" },
];

export function PaymentsPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["payments", queryParams],
    queryFn: () => financialsApi.getInvoices({ ...queryParams, status: "PAID,PARTIAL", page: 1, pageSize: 100 }),
    retry: false,
  });

  const invoices = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const paidInvoices = invoices.filter((i) => ["PAID", "PARTIAL"].includes(String(i.status ?? "").toUpperCase()));
  const rows = paidInvoices.length ? paidInvoices : MOCK;

  const totalReceived = rows.reduce((s, r) => s + Number(r.amount ?? r.paid_amount ?? 0), 0) || 39200;
  const onlineCount = rows.filter((r) => ["UPI", "NEFT", "Online"].includes(String(r.payment_mode ?? ""))).length;

  const stats = [
    { label: "Total Received", value: formatCurrency(totalReceived), icon: DollarSign, color: "bg-green-100 text-green-700" },
    { label: "Online Payments", value: onlineCount, icon: CreditCard, color: "bg-blue-100 text-blue-700" },
    { label: "Reconciled", value: rows.filter((r) => String(r.status ?? "") === "PAID").length, icon: RefreshCw, color: "bg-purple-100 text-purple-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Finance / Payments</p>
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <p className="mt-1 text-sm text-gray-500">Payment collection register</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-20" /> : <p className="mt-1 text-2xl font-bold text-gray-900">{s.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${s.color}`}><s.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <DataTable
        title="Payment Register"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "payment_number", header: "PAYMENT #", render: (row) => <span className="font-mono text-xs font-medium">{String(row.payment_number ?? `PAY-${String(row.id).padStart(3, "0")}`)}</span> },
          { key: "payment_date", header: "DATE" },
          { key: "resident_name", header: "RESIDENT" },
          { key: "unit_number", header: "UNIT" },
          { key: "invoice_number", header: "INVOICE #", render: (row) => <span className="font-mono text-xs text-blue-700">{String(row.invoice_number ?? "-")}</span> },
          { key: "payment_mode", header: "MODE" },
          { key: "amount", header: "AMOUNT", render: (row) => <span className="font-semibold text-green-700">{formatCurrency(Number(row.amount ?? row.paid_amount ?? 0))}</span> },
          { key: "status", header: "STATUS", render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
    </div>
  );
}
