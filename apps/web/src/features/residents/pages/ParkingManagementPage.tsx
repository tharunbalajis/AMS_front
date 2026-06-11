import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Car, Loader2, Plus, RefreshCw, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { parkingApi, type ParkingSlot } from "@/api/parking.api";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: "bg-green-100 text-green-800",
  OCCUPIED:  "bg-blue-100 text-blue-800",
  RESERVED:  "bg-amber-100 text-amber-800",
  BLOCKED:   "bg-red-100 text-red-800",
};

const SLOT_TYPES = ["CAR", "BIKE", "TWO_WHEELER", "TRUCK", "OTHER"];

/* ────────────────────────────────────────────────────────── */
/* ADD SLOT MODAL */
/* ────────────────────────────────────────────────────────── */

function AddSlotModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ slot_code: "", slot_type: "CAR", block_id: "" });

  const blocksQ = useQuery({
    queryKey: ["blocks", societyId],
    queryFn: () => residentsApi.getBlocks({ society_id: societyId }),
    enabled: !!societyId,
  });
  const blocks = Array.isArray(blocksQ.data) ? blocksQ.data : [];

  const mut = useMutation({
    mutationFn: () =>
      parkingApi.createSlot({
        society_id: societyId,
        slot_code:  form.slot_code.trim().toUpperCase(),
        slot_type:  form.slot_type,
        block_id:   form.block_id ? Number(form.block_id) : null,
      }),
    onSuccess: () => {
      toast.success("Parking slot created");
      qc.invalidateQueries({ queryKey: ["parking-slots"] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Failed to create slot"),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold">Add Parking Slot</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100"><X size={18} /></button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slot Code *</label>
            <input
              value={form.slot_code}
              onChange={e => setForm(f => ({ ...f, slot_code: e.target.value }))}
              placeholder="e.g. P-01, B2-CAR-03"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">Max 20 characters</p>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Slot Type *</label>
            <select value={form.slot_type} onChange={e => setForm(f => ({ ...f, slot_type: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {SLOT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Block (optional)</label>
            <select value={form.block_id} onChange={e => setForm(f => ({ ...f, block_id: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="">Not block-specific</option>
              {blocks.map((b: any) => <option key={b.block_id} value={String(b.block_id)}>{b.block_name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-lg border px-4 py-2 text-sm">Cancel</button>
          <button
            disabled={!form.slot_code.trim() || mut.isPending}
            onClick={() => mut.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            Add Slot
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* MAIN PAGE */
/* ────────────────────────────────────────────────────────── */

export function ParkingManagementPage() {
  const { society, queryParams } = useScope();
  const qc = useQueryClient();
  const societyId = Number(society?.society_id ?? queryParams?.society_id ?? 0);

  const [addOpen,  setAddOpen]  = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [blockFilter,  setBlockFilter]  = useState("");

  const slotsQ = useQuery({
    queryKey: ["parking-slots", societyId, statusFilter, blockFilter],
    queryFn:  () => parkingApi.getSlots({
      society_id:     societyId || undefined,
      parking_status: statusFilter || undefined,
      block_id:       blockFilter ? Number(blockFilter) : undefined,
      page_size:      500,
    }),
    enabled: !!societyId,
  });

  const blocksQ = useQuery({
    queryKey: ["blocks", societyId],
    queryFn:  () => residentsApi.getBlocks({ society_id: societyId }),
    enabled:  !!societyId,
  });
  const blocks = Array.isArray(blocksQ.data) ? blocksQ.data : [];

  const deleteMut = useMutation({
    mutationFn: (id: string) => parkingApi.deleteSlot(id),
    onSuccess:  () => { toast.success("Slot deleted"); qc.invalidateQueries({ queryKey: ["parking-slots"] }); },
    onError:    (e: any) => toast.error(e?.response?.data?.message ?? "Delete failed"),
  });

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      parkingApi.updateSlot(id, { parking_status: status }),
    onSuccess: () => { toast.success("Status updated"); qc.invalidateQueries({ queryKey: ["parking-slots"] }); },
    onError:   (e: any) => toast.error(e?.response?.data?.message ?? "Update failed"),
  });

  const slots: ParkingSlot[] = slotsQ.data?.data ?? [];

  const stats = {
    total:     slots.length,
    available: slots.filter(s => s.parking_status === "AVAILABLE").length,
    occupied:  slots.filter(s => s.parking_status === "OCCUPIED").length,
    blocked:   slots.filter(s => s.parking_status === "BLOCKED").length,
  };

  const byBlock = blocks
    .map((b: any) => ({
      block:     b,
      slots:     slots.filter(s => s.block_id === b.block_id),
      available: slots.filter(s => s.block_id === b.block_id && s.parking_status === "AVAILABLE").length,
    }))
    .filter(g => g.slots.length > 0);

  const unassigned = slots.filter(s => !s.block_id);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Parking Management</p>
          <h1 className="text-2xl font-bold text-gray-900">Parking Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {slotsQ.isLoading ? "Loading…" : `${stats.total} total slots — ${stats.available} available`}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => qc.invalidateQueries({ queryKey: ["parking-slots"] })}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Refresh
          </button>
          <button
            onClick={() => setAddOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white"
          >
            <Plus size={15} /> Add Slot
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Total Slots",   value: stats.total,       color: "text-gray-900" },
          { label: "Available",     value: stats.available,   color: "text-green-700" },
          { label: "Occupied",      value: stats.occupied,    color: "text-blue-700" },
          { label: "Blocked",   value: stats.blocked, color: "text-red-700" },
        ].map(c => (
          <div key={c.label} className="rounded-xl border bg-white p-4">
            <p className="text-xs text-gray-500">{c.label}</p>
            <p className={`mt-1 text-2xl font-bold ${c.color}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      {!societyId ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6 text-center text-sm text-amber-700">
          Please select a society to view parking slots.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-3">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="OCCUPIED">Occupied</option>
              <option value="RESERVED">Reserved</option>
              <option value="BLOCKED">Blocked</option>
            </select>
            <select
              value={blockFilter}
              onChange={e => setBlockFilter(e.target.value)}
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">All Blocks</option>
              {blocks.map((b: any) => (
                <option key={b.block_id} value={String(b.block_id)}>{b.block_name}</option>
              ))}
            </select>
          </div>

          {slotsQ.isLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">
              <Car size={40} className="mx-auto mb-3 text-gray-300" />
              <p className="font-medium text-gray-600">No parking slots found</p>
              <p className="mt-1 text-sm text-gray-400">Click "Add Slot" to create parking slots.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Grouped by block */}
              {byBlock.map(({ block, slots: bs }) => (
                <div key={block.block_id} className="rounded-xl border bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Block {block.block_name}</h3>
                    <span className="text-xs text-gray-500">{bs.length} slots · {bs.filter(s => s.parking_status === "AVAILABLE").length} available</span>
                  </div>
                  <SlotGrid slots={bs} onDelete={id => deleteMut.mutate(id)} onStatusChange={(id, s) => statusMut.mutate({ id, status: s })} />
                </div>
              ))}

              {/* Unassigned slots */}
              {unassigned.length > 0 && (
                <div className="rounded-xl border bg-white p-4">
                  <h3 className="mb-3 font-semibold text-gray-800">General / No Block</h3>
                  <SlotGrid slots={unassigned} onDelete={id => deleteMut.mutate(id)} onStatusChange={(id, s) => statusMut.mutate({ id, status: s })} />
                </div>
              )}
            </div>
          )}
        </>
      )}

      {addOpen && societyId && <AddSlotModal societyId={societyId} onClose={() => setAddOpen(false)} />}
    </div>
  );
}

/* ────────────────────────────────────────────────────────── */
/* SLOT GRID */
/* ────────────────────────────────────────────────────────── */

function SlotGrid({
  slots,
  onDelete,
  onStatusChange,
}: {
  slots: ParkingSlot[];
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {slots.map(slot => (
        <div
          key={slot.id}
          className="group relative rounded-lg border bg-gray-50 p-3 hover:shadow-sm transition-shadow"
        >
          <div className="mb-1 flex items-center justify-between">
            <span className="font-mono text-sm font-bold text-gray-900">{slot.slot_code}</span>
            <button
              onClick={() => onDelete(slot.id)}
              className="hidden group-hover:flex rounded p-0.5 text-gray-400 hover:text-red-600"
            >
              <Trash2 size={12} />
            </button>
          </div>
          <div className="mb-2 text-xs text-gray-500">{slot.slot_type}</div>
          <select
            value={slot.parking_status}
            onChange={e => onStatusChange(slot.id, e.target.value)}
            className={`w-full rounded-md border-0 px-1.5 py-1 text-xs font-medium ${STATUS_COLORS[slot.parking_status] ?? "bg-gray-100 text-gray-700"}`}
          >
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="OCCUPIED">OCCUPIED</option>
            <option value="RESERVED">RESERVED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      ))}
    </div>
  );
}
