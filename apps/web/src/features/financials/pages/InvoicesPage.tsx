import { Badge, Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { formatCurrency, normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { financialsApi } from "@/api/financials.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

type LineItem = {
  maintenance_head_id: string;
  description: string;
  quantity: string;
  rate: string;
  gst_rate: string;
};

function AddInvoiceModal({ open, onClose, societyId }: { open: boolean; onClose: () => void; societyId?: number }) {
  const queryClient = useQueryClient();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ unit_id: "", resident_id: "", billing_period: "", invoice_date: today, due_date: "", penalty_amount: "" });
  const [lineItems, setLineItems] = useState<LineItem[]>([{ maintenance_head_id: "", description: "", quantity: "1", rate: "", gst_rate: "18" }]);

  const { data: residentsRaw } = useQuery({
    queryKey: ["residents-for-invoice", societyId],
    queryFn: () => residentsApi.getAll({ society_id: societyId, page: 1, page_size: 200 }),
    enabled: open && Boolean(societyId),
  });
  const residents = normalizeList<Record<string, unknown>>(residentsRaw?.data ?? residentsRaw);

  const { data: headsRaw } = useQuery({
    queryKey: ["maintenance-heads-for-invoice", societyId],
    queryFn: () => financialsApi.getMaintenanceHeads({ society_id: societyId }),
    enabled: open && Boolean(societyId),
  });
  const heads = normalizeList<Record<string, unknown>>(headsRaw?.data ?? headsRaw);

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => financialsApi.createInvoice(data),
    onSuccess: () => {
      toast.success("Invoice created");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      setForm({ unit_id: "", resident_id: "", billing_period: "", invoice_date: today, due_date: "", penalty_amount: "" });
      setLineItems([{ maintenance_head_id: "", description: "", quantity: "1", rate: "", gst_rate: "18" }]);
      onClose();
    },
    onError: () => toast.error("Failed to create invoice"),
  });

  function handleResidentChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const resident = residents.find((r) => String(r.id) === e.target.value);
    setForm((f) => ({ ...f, resident_id: e.target.value, unit_id: resident ? String(resident.unit_id ?? f.unit_id) : f.unit_id }));
  }

  function addLineItem() {
    setLineItems((prev) => [...prev, { maintenance_head_id: "", description: "", quantity: "1", rate: "", gst_rate: "18" }]);
  }

  function removeLineItem(i: number) {
    setLineItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string) {
    setLineItems((prev) => prev.map((li, idx) => (idx === i ? { ...li, [field]: value } : li)));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    mutation.mutate({
      unit_id: Number(form.unit_id),
      resident_id: form.resident_id,
      billing_period: form.billing_period.toUpperCase(),
      invoice_date: form.invoice_date,
      due_date: form.due_date,
      ...(form.penalty_amount ? { penalty_amount: Number(form.penalty_amount) } : {}),
      line_items: lineItems.map((li) => ({
        maintenance_head_id: li.maintenance_head_id,
        description: li.description,
        quantity: Number(li.quantity),
        rate: Number(li.rate),
        gst_rate: Number(li.gst_rate),
      })),
    });
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Create Invoice</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Resident</label>
              <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" required value={form.resident_id} onChange={handleResidentChange}>
                <option value="">Select resident</option>
                {residents.map((r) => (
                  <option key={String(r.id)} value={String(r.id)}>{String(r.full_name ?? r.name ?? r.id)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Unit ID</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="number" placeholder="Auto-filled from resident" required value={form.unit_id} onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Billing Period</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" placeholder="JAN-2024" required value={form.billing_period} onChange={(e) => setForm((f) => ({ ...f, billing_period: e.target.value.toUpperCase() }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Invoice Date</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="date" required value={form.invoice_date} onChange={(e) => setForm((f) => ({ ...f, invoice_date: e.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-700">Due Date</label>
              <input className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none" type="date" required value={form.due_date} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} />
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">Line Items</span>
              <button type="button" onClick={addLineItem} className="text-xs font-medium text-blue-600 hover:underline">+ Add Item</button>
            </div>
            <div className="mb-1 grid grid-cols-[1.2fr_1fr_64px_80px_56px_20px] gap-2">
              <p className="text-xs text-gray-500">Maintenance Head</p>
              <p className="text-xs text-gray-500">Description</p>
              <p className="text-xs text-gray-500">Qty</p>
              <p className="text-xs text-gray-500">Rate (₹)</p>
              <p className="text-xs text-gray-500">GST%</p>
              <span />
            </div>
            {lineItems.map((li, i) => (
              <div key={i} className="mb-2 grid grid-cols-[1.2fr_1fr_64px_80px_56px_20px] items-center gap-2">
                <select className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" required value={li.maintenance_head_id} onChange={(e) => updateLineItem(i, "maintenance_head_id", e.target.value)}>
                  <option value="">Select head</option>
                  {heads.map((h) => (
                    <option key={String(h.id)} value={String(h.id)}>{String(h.head_name ?? h.id)}</option>
                  ))}
                </select>
                <input className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" placeholder="Description" required minLength={3} value={li.description} onChange={(e) => updateLineItem(i, "description", e.target.value)} />
                <input className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" type="number" min="0.001" step="0.001" required value={li.quantity} onChange={(e) => updateLineItem(i, "quantity", e.target.value)} />
                <input className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" type="number" min="0.01" step="0.01" required value={li.rate} onChange={(e) => updateLineItem(i, "rate", e.target.value)} />
                <input className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-400 focus:outline-none" type="number" min="0" max="100" value={li.gst_rate} onChange={(e) => updateLineItem(i, "gst_rate", e.target.value)} />
                {lineItems.length > 1 ? (
                  <button type="button" onClick={() => removeLineItem(i)} className="text-red-400 hover:text-red-600"><Trash2 size={14} /></button>
                ) : <span />}
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>{mutation.isPending ? "Creating…" : "Create Invoice"}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function InvoicesPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["invoices", queryParams, status],
    queryFn: () => financialsApi.getInvoices({ society_id: queryParams.society_id, status: status || undefined, page: 1, pageSize: 100 }),
    retry: false,
  });

  let rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);
  if (search) rows = rows.filter((r) => String(r.invoice_number ?? "").toLowerCase().includes(search.toLowerCase()) || String(r.resident_name ?? "").toLowerCase().includes(search.toLowerCase()));
  if (status) rows = rows.filter((r) => String(r.status ?? "") === status);

  const outstanding = rows.reduce((s, r) => s + Number(r.balance_due ?? 0), 0);

  return (
    <div className="space-y-6">
      <AddInvoiceModal open={modalOpen} onClose={() => setModalOpen(false)} societyId={society?.society_id} />

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
          <Button onClick={() => setModalOpen(true)}><Plus size={15} className="mr-1" />Create Invoice</Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[240px] flex-1" placeholder="Search invoice #, resident…" value={search} onChange={(e) => setSearch(e.target.value)} />
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
