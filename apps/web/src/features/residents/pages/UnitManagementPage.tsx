import { Button, DataTable, SearchBox, Select, StatusBadge } from "@ams/ui";
import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddUnitModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ block_id: "", unit_number: "", floor_number: "1", unit_type: "2BHK", ownership_type: "OWNED", parking_slots: "1" });

  const blocksQuery = useQuery({
    queryKey: ["blocks", societyId],
    queryFn: () => residentsApi.getBlocks({ society_id: societyId }),
  });
  const blocks = normalizeList<Record<string, unknown>>(blocksQuery.data?.data ?? blocksQuery.data);

  const mutation = useMutation({
    mutationFn: () => residentsApi.createUnit({
      society_id: societyId,
      block_id: Number(form.block_id),
      unit_number: form.unit_number.trim(),
      floor_number: Number(form.floor_number),
      unit_type: form.unit_type,
      ownership_type: form.ownership_type,
      parking_slots: Number(form.parking_slots),
      occupancy_status: "VACANT",
      is_active: true,
    }),
    onSuccess: () => { toast.success("Unit added"); qc.invalidateQueries({ queryKey: ["units"] }); onClose(); },
    onError: (e: unknown) => toast.error((e as Error).message ?? "Failed to add unit"),
  });

  const isValid = form.block_id && form.unit_number.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Add New Unit</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="grid grid-cols-2 gap-4 p-6">
          <label className="col-span-2 block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Block *</span>
            <select value={form.block_id} onChange={e => setForm(f => ({ ...f, block_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">Select block</option>
              {blocks.map(b => <option key={String(b.block_id)} value={String(b.block_id)}>{String(b.block_name)}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Unit Number *</span>
            <input value={form.unit_number} onChange={e => setForm(f => ({ ...f, unit_number: e.target.value }))} placeholder="e.g. 101, A-5"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Floor</span>
            <input type="number" min="0" value={form.floor_number} onChange={e => setForm(f => ({ ...f, floor_number: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Unit Type</span>
            <select value={form.unit_type} onChange={e => setForm(f => ({ ...f, unit_type: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {["STUDIO","1BHK","2BHK","3BHK","4BHK","PENTHOUSE","COMMERCIAL"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-gray-700">Parking Slots</span>
            <input type="number" min="0" max="5" value={form.parking_slots} onChange={e => setForm(f => ({ ...f, parking_slots: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button disabled={!isValid || mutation.isPending} onClick={() => mutation.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60">
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />} Add Unit
          </button>
        </div>
      </div>
    </div>
  );
}

export function UnitManagementPage() {
  const { queryParams, society } = useScope();
  const [blockId, setBlockId] = useState("");
  const [unitType, setUnitType] = useState("");
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const blocksQuery = useQuery({
    queryKey: ["blocks", queryParams.society_id],
    queryFn: () => residentsApi.getBlocks({ society_id: queryParams.society_id }),
    enabled: !!queryParams.society_id,
  });
  const blocks = normalizeList<Record<string, unknown>>(blocksQuery.data?.data ?? blocksQuery.data);

  const { data: raw, isLoading } = useQuery({
    queryKey: ["units", queryParams, blockId, unitType, status, search],
    queryFn: () => residentsApi.getUnits({
      ...queryParams,
      block_id: blockId || undefined,
      unit_type: unitType || undefined,
      occupancy_status: status || undefined,
      search: search || undefined,
    }),
    retry: false,
  });

  const rows = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Unit Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Unit Management</h1>
          <p className="mt-1 text-sm text-gray-500">{isLoading ? "Loading..." : `${rows.length} units`}</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={15} className="mr-1" />Add Unit</Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <SearchBox className="min-w-[200px] flex-1" placeholder="Search unit number..." value={search} onChange={e => setSearch(e.target.value)} />
        <Select className="w-44" value={blockId} onChange={e => setBlockId(e.target.value)}>
          <option value="">All Blocks</option>
          {blocks.map(b => <option key={String(b.block_id ?? b.id)} value={String(b.block_id ?? b.id)}>{String(b.block_name)}</option>)}
        </Select>
        <Select className="w-44" value={unitType} onChange={e => setUnitType(e.target.value)}>
          <option value="">All Types</option>
          {["STUDIO","1BHK","2BHK","3BHK","4BHK","PENTHOUSE"].map(t => <option key={t} value={t}>{t}</option>)}
        </Select>
        <Select className="w-44" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All Status</option>
          <option value="OWNER_OCCUPIED">Owner Occupied</option>
          <option value="RENTED">Rented</option>
          <option value="VACANT">Vacant</option>
        </Select>
      </div>

      {!isLoading && rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <Home size={40} className="mx-auto mb-3 text-gray-300" />
          <p className="font-medium text-gray-600">No units found</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Unit" to create units in this society.</p>
        </div>
      ) : (
        <DataTable
          title="Units"
          rows={rows.map((r, i) => ({ ...r, __rowKey: r.unit_id ?? r.id ?? i }))}
          isLoading={isLoading}
          columns={[
            { key: "unit_number", header: "UNIT NO" },
            { key: "block_name", header: "BLOCK" },
            { key: "floor_number", header: "FLOOR", render: row => <span>{String(row.floor_number ?? row.floor ?? "-")}</span> },
            { key: "unit_type", header: "TYPE" },
            { key: "occupancy_status", header: "STATUS", render: row => <StatusBadge value={String(row.occupancy_status ?? "VACANT") === "VACANT" ? "INACTIVE" : "ACTIVE"} /> },
            { key: "parking_slots", header: "PARKING", render: row => <span>{String(row.parking_slots ?? row.parking_count ?? "-")}</span> },
          ]}
        />
      )}

      {addOpen && <AddUnitModal societyId={society?.society_id ?? 1} onClose={() => setAddOpen(false)} />}
    </div>
  );
}
