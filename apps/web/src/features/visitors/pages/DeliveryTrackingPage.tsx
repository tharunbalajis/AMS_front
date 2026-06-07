import { Button, DataTable, SearchBox, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckSquare, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { visitorsApi } from "@/api/visitors.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddDeliveryModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    unit_id: "", delivery_type: "COURIER", delivery_from: "",
    tracking_number: "", delivered_by_name: "", delivered_by_mobile: "",
  });

  const unitsQuery = useQuery({
    queryKey: ["units-delivery", societyId],
    queryFn: () => residentsApi.getUnits({ society_id: societyId, page: 1, page_size: 300 }),
  });
  const units = normalizeList<Record<string, unknown>>(unitsQuery.data?.data ?? unitsQuery.data);

  const mut = useMutation({
    mutationFn: () => visitorsApi.addDelivery({
      society_id:          societyId,
      unit_id:             Number(form.unit_id),
      delivery_type:       form.delivery_type,
      delivery_from:       form.delivery_from.trim() || null,
      tracking_number:     form.tracking_number.trim() || null,
      delivered_by_name:   form.delivered_by_name.trim() || null,
      delivered_by_mobile: form.delivered_by_mobile.trim() || null,
    }),
    onSuccess: () => {
      toast.success("Delivery logged");
      qc.invalidateQueries({ queryKey: ["deliveries"] });
      onClose();
    },
    onError: (e: unknown) => toast.error((e as Error)?.message ?? "Failed to log delivery"),
  });

  const cls = "w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="font-semibold text-gray-900">Log Delivery</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Unit *</span>
            <select value={form.unit_id}
              onChange={(e) => setForm((f) => ({ ...f, unit_id: e.target.value }))}
              className={cls}>
              <option value="">Select unit</option>
              {units.map((u) => (
                <option key={String(u.unit_id ?? u.id)} value={String(u.unit_id ?? u.id)}>
                  {String(u.unit_number ?? "-")}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Type *</span>
            <select value={form.delivery_type}
              onChange={(e) => setForm((f) => ({ ...f, delivery_type: e.target.value }))}
              className={cls}>
              <option value="COURIER">Courier</option>
              <option value="FOOD">Food</option>
              <option value="GROCERY">Grocery</option>
              <option value="MEDICINE">Medicine</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">From (Company)</span>
            <input value={form.delivery_from}
              onChange={(e) => setForm((f) => ({ ...f, delivery_from: e.target.value }))}
              placeholder="e.g. Amazon, Swiggy" className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Tracking #</span>
            <input value={form.tracking_number}
              onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))}
              placeholder="Optional" className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Delivery Agent</span>
            <input value={form.delivered_by_name}
              onChange={(e) => setForm((f) => ({ ...f, delivered_by_name: e.target.value }))}
              placeholder="Agent name" className={cls} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Agent Mobile</span>
            <input value={form.delivered_by_mobile}
              onChange={(e) => setForm((f) => ({ ...f, delivered_by_mobile: e.target.value }))}
              placeholder="Mobile" className={cls} />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button type="button" onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <button type="button" disabled={!form.unit_id || mut.isPending} onClick={() => mut.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50">
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            Log Delivery
          </button>
        </div>
      </div>
    </div>
  );
}

function CollectButton({ id }: { id: string }) {
  const qc = useQueryClient();
  const mut = useMutation({
    mutationFn: () => visitorsApi.collectDelivery(id),
    onSuccess: () => {
      toast.success("Marked as collected");
      qc.invalidateQueries({ queryKey: ["deliveries"] });
    },
    onError: () => toast.error("Failed to update"),
  });
  return (
    <button type="button" disabled={mut.isPending}
      onClick={() => mut.mutate()}
      className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50">
      {mut.isPending ? <Loader2 size={12} className="animate-spin" /> : <CheckSquare size={12} />}
      Collect
    </button>
  );
}

export function DeliveryTrackingPage() {
  const { queryParams, society } = useScope();
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["deliveries", queryParams],
    queryFn: () => visitorsApi.getDeliveries({ society_id: queryParams.society_id }),
    retry: false,
  });
  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw).filter(
    (r) => !search
      || String(r.delivered_by_name ?? "").toLowerCase().includes(search.toLowerCase())
      || String(r.delivery_from ?? "").toLowerCase().includes(search.toLowerCase())
      || String(r.unit_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Visitor & Security / Delivery Tracking</p>
          <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
          <p className="mt-1 text-sm text-gray-500">{rows.length} deliveries</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1" />Log Delivery</Button>
      </div>

      <SearchBox className="max-w-md" placeholder="Search agent, company, unit..."
        value={search} onChange={(e) => setSearch(e.target.value)} />

      <DataTable
        title="Deliveries"
        rows={rows}
        isLoading={isLoading}
        columns={[
          { key: "delivery_type",     header: "TYPE" },
          { key: "delivered_by_name", header: "AGENT" },
          { key: "delivery_from",     header: "FROM" },
          { key: "unit_number",       header: "UNIT" },
          { key: "resident_name",     header: "RESIDENT" },
          { key: "tracking_number",   header: "TRACKING #" },
          { key: "received_at",       header: "RECEIVED" },
          {
            key: "status", header: "STATUS",
            render: (row) => <StatusBadge value={row.status === "DELIVERED" ? "RESOLVED" : "PENDING"} />,
          },
          {
            key: "actions", header: "",
            render: (row) =>
              String(row.status ?? "").toUpperCase() !== "DELIVERED"
                ? <CollectButton id={String(row.id)} />
                : <span className="text-xs text-gray-400">Collected</span>,
          },
        ]}
      />

      {addOpen && (
        <AddDeliveryModal
          societyId={Number(society?.society_id ?? queryParams.society_id ?? 1)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
