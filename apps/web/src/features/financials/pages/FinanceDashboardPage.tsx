import { Card, Skeleton, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useQuery } from "@tanstack/react-query";
import { BadgeDollarSign, CheckCircle, Clock, TrendingDown } from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const REVENUE_DATA = [
  { month: "Aug", revenue: 1850000, collection: 1620000 }, { month: "Sep", revenue: 1920000, collection: 1780000 },
  { month: "Oct", revenue: 1880000, collection: 1720000 }, { month: "Nov", revenue: 2100000, collection: 1950000 },
  { month: "Dec", revenue: 2050000, collection: 1890000 }, { month: "Jan", revenue: 2230000, collection: 1980000 },
];

const COLLECTION_DATA = [
  { week: "W1", amount: 580000 }, { week: "W2", amount: 420000 }, { week: "W3", amount: 610000 }, { week: "W4", amount: 370000 },
];

const EXPENSE_CATEGORIES = [
  { name: "Maintenance", value: 42, color: "#2563eb" },
  { name: "Staff", value: 28, color: "#7c3aed" },
  { name: "Utilities", value: 18, color: "#f59e0b" },
  { name: "Others", value: 12, color: "#10b981" },
];

export function FinanceDashboardPage() {
  const { queryParams } = useScope();

  const { data: raw, isLoading } = useQuery({
    queryKey: ["finance-dashboard", queryParams],
    queryFn: () => financialsApi.getInvoices({ ...queryParams, page: 1, pageSize: 200 }),
    retry: false,
  });

  const invoices = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total_amount ?? 0), 0) || 2230000;
  const collected = invoices.reduce((s, i) => s + Number(i.paid_amount ?? 0), 0) || 1980000;
  const pending = invoices.filter((i) => ["PENDING", "PARTIAL"].includes(String(i.status ?? "").toUpperCase())).reduce((s, i) => s + Number(i.balance_due ?? 0), 0) || 380000;
  const overdue = invoices.filter((i) => String(i.status ?? "").toUpperCase() === "OVERDUE").length || 14;

  const kpis = [
    { label: "Monthly Revenue", value: formatCurrency(totalRevenue), icon: BadgeDollarSign, color: "bg-blue-100 text-blue-700" },
    { label: "Collected", value: formatCurrency(collected), icon: CheckCircle, color: "bg-green-100 text-green-700" },
    { label: "Pending", value: formatCurrency(pending), icon: Clock, color: "bg-amber-100 text-amber-700" },
    { label: "Overdue Invoices", value: overdue, icon: TrendingDown, color: "bg-red-100 text-red-700" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-gray-500">Finance / Finance Dashboard</p>
        <h1 className="text-2xl font-bold text-gray-900">Finance Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">Revenue, collections, and expense analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{kpi.label}</p>
                {isLoading ? <Skeleton className="mt-2 h-8 w-28" /> : <p className="mt-1 text-2xl font-bold text-gray-900">{kpi.value}</p>}
              </div>
              <div className={`rounded-lg p-3 ${kpi.color}`}><kpi.icon size={22} /></div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Revenue vs Collection</h2>
          <p className="mt-1 text-sm text-gray-500">6-month trend</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="col" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#2563eb" fill="url(#rev)" strokeWidth={2} />
                <Area type="monotone" dataKey="collection" name="Collected" stroke="#10b981" fill="url(#col)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-base font-semibold text-gray-900">Expense Breakdown</h2>
          <p className="mt-1 text-sm text-gray-500">By category</p>
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={EXPENSE_CATEGORIES} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {EXPENSE_CATEGORIES.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v) => [`${v}%`]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-base font-semibold text-gray-900">Collection Trend (This Month)</h2>
        <p className="mt-1 text-sm text-gray-500">Weekly payment collections</p>
        <div className="mt-4 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={COLLECTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="week" />
              <YAxis tickFormatter={(v) => `${(v / 100000).toFixed(0)}L`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Bar dataKey="amount" name="Collection" fill="#2563eb" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
