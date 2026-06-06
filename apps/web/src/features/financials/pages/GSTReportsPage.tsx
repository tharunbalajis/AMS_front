import { Card, DataTable } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const GST_MONTHLY = [
  { month: "Aug", gst: 142000 }, { month: "Sep", gst: 158000 }, { month: "Oct", gst: 134000 },
  { month: "Nov", gst: 172000 }, { month: "Dec", gst: 165000 }, { month: "Jan", gst: 181000 },
];

const MOCK_SUMMARY: Record<string, unknown>[] = [
  { month: "January 2024", invoiced: 2230000, taxable_value: 1890000, gst_collected: 181000 },
  { month: "December 2023", invoiced: 2050000, taxable_value: 1738000, gst_collected: 165000 },
  { month: "November 2023", invoiced: 2100000, taxable_value: 1780000, gst_collected: 172000 },
  { month: "October 2023", invoiced: 1880000, taxable_value: 1594000, gst_collected: 134000 },
  { month: "September 2023", invoiced: 1920000, taxable_value: 1627000, gst_collected: 158000 },
  { month: "August 2023", invoiced: 1850000, taxable_value: 1567000, gst_collected: 142000 },
];

export function GSTReportsPage() {
  const { queryParams } = useScope();

  const { data: raw } = useQuery({
    queryKey: ["gst-reports", queryParams],
    queryFn: () => financialsApi.getExpenses({ ...queryParams }),
    retry: false,
  });
  const expenses = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const totalGst = expenses.reduce((s, e) => s + Number(e.gst_amount ?? 0), 0) || 952000;

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Finance / GST Reports</p>
        <h1 className="text-2xl font-bold text-gray-900">GST Reports</h1>
        <p className="mt-1 text-sm text-gray-500">Monthly GST collected on maintenance charges</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">GST Collected Monthly</h2>
          <p className="mt-1 text-sm text-gray-500">Tax collected from maintenance invoices</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={GST_MONTHLY}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="gst" name="GST Collected" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">GST Summary</h2>
          <p className="mt-1 text-sm text-gray-500">6-month aggregate</p>
          <div className="mt-6 space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase text-blue-600">Total GST Collected (6M)</p>
              <p className="mt-1 text-3xl font-bold text-blue-900">{formatCurrency(totalGst)}</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">CGST</p>
                <p className="mt-1 font-bold text-gray-900">{formatCurrency(totalGst / 2)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-xs text-gray-500">SGST</p>
                <p className="mt-1 font-bold text-gray-900">{formatCurrency(totalGst / 2)}</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <DataTable
        title="Monthly GST Summary"
        rows={MOCK_SUMMARY}
        columns={[
          { key: "month", header: "MONTH" },
          { key: "invoiced", header: "INVOICED", render: (row) => <span className="font-medium">{formatCurrency(Number(row.invoiced))}</span> },
          { key: "taxable_value", header: "TAXABLE VALUE", render: (row) => <span>{formatCurrency(Number(row.taxable_value))}</span> },
          { key: "gst_collected", header: "GST COLLECTED", render: (row) => <span className="font-semibold text-blue-700">{formatCurrency(Number(row.gst_collected))}</span> },
        ]}
      />
    </div>
  );
}
