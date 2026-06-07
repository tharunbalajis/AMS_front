import { Button, DataTable, SearchBox } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { financialsApi } from "@/api/financials.api";
import { useScope } from "@/app/scope/ScopeProvider";

const CATEGORY_COLORS: Record<string, string> = {
  Maintenance: "bg-blue-100 text-blue-700",
  Utilities: "bg-purple-100 text-purple-700",
  Staff: "bg-green-100 text-green-700",
  Housekeeping: "bg-amber-100 text-amber-700",
  Others: "bg-gray-100 text-gray-600",
};

function AddExpenseModal({ open, onClose, societyId }: { open: boolean; onClose: () => void; societyId?: number }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ category_id: "", expense_date: today, description: "", amount: "", gst_amount: "" });

  const { data: catsRaw } = useQuery({
    queryKey: ["expense-categories-for-modal", societyId],
    queryFn: () => financialsApi.getExpenseCategories({ society_id: societyId }),
    enabled: open && Boolean(societyId),
  });
  const categories = normalizeList<Record<string, unknown>>(catsRaw?.data ?? catsRaw);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => financialsApi.createExpense(data),
    onSuccess: () => {
      toast.success("Expense added");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      setForm({ category_id: "", expense_date: today, description: "", amount: "", gst_amount: "" });
      onClose();
    },
    onError: () => toast.error("Failed to add expense"),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      category_id: form.category_id,
      expense_date: form.expense_date,
      description: form.description,
      amount: Number(form.amount),
      ...(form.gst_amount ? { gst_amount: Number(form.gst_amount) } : {}),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add Expense</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Category</label>
            <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" required value={form.category_id} onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={String(c.id)} value={String(c.id)}>{String(c.category_name ?? c.id)}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Expense Date</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="date" required value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Amount (₹)</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="number" min="0.01" step="0.01" placeholder="0.00" required value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">Description</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="Expense description" required minLength={3} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">GST Amount (₹, optional)</label>
            <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="number" min="0" step="0.01" placeholder="0.00" value={form.gst_amount} onChange={(e) => setForm((f) => ({ ...f, gst_amount: e.target.value }))} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Saving…" : "Add Expense"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function ExpenseTrackingPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["expenses", queryParams],
    queryFn: () => financialsApi.getExpenses({ society_id: queryParams.society_id, pageSize: 100 }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter((r) => !search || String(r.description ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.vendor ?? "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <AddExpenseModal open={modalOpen} onClose={() => setModalOpen(false)} societyId={society?.society_id} />

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Finance / Expense Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Expense Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} expense records</p>
        </div>
        <Button onClick={() => setModalOpen(true)}><Plus size={15} className="mr-1" />Add Expense</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search description, vendor…" value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Expenses"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "expense_date", header: "DATE" },
          {
            key: "category", header: "CATEGORY",
            render: (row) => <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${CATEGORY_COLORS[String(row.category ?? "")] ?? "bg-gray-100 text-gray-600"}`}>{String(row.category ?? "-")}</span>,
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
            },
          },
        ]}
      />
    </div>
  );
}
