import { normalizeList } from "@ams/utils";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building, Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddBlockModal({ societyId, onClose }: { societyId: number; onClose: () => void }) {
  const qc = useQueryClient();
  const [blockName, setBlockName] = useState("");
  const [floors, setFloors] = useState("5");
  const [desc, setDesc] = useState("");

  const mut = useMutation({
    mutationFn: () =>
      residentsApi.createBlock({
        society_id: societyId,
        block_name: blockName.trim(),
        total_floors: Number(floors) || 1,
        description: desc.trim() || null,
      }),
    onSuccess: () => {
      toast.success("Block created successfully");
      qc.invalidateQueries({ queryKey: ["blocks"] });
      onClose();
    },
    onError: (e: unknown) => {
      const msg =
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (e as Error)?.message ??
        "Failed to create block";
      toast.error(msg);
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Add New Block / Wing</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Block / Wing Name <span className="text-red-500">*</span>
            </label>
            <input
              autoFocus
              value={blockName}
              onChange={(e) => setBlockName(e.target.value)}
              placeholder="e.g. Block A, Tower 1, Wing B"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Total Floors <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={floors}
              onChange={(e) => setFloors(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              rows={2}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Optional description"
              className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!blockName.trim() || mut.isPending}
            onClick={() => mut.mutate()}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {mut.isPending && <Loader2 size={14} className="animate-spin" />}
            {mut.isPending ? "Creating…" : "Add Block"}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockWingPage() {
  const { queryParams, society } = useScope();
  const [addOpen, setAddOpen] = useState(false);

  const { data: raw, isLoading, isError, error } = useQuery({
    queryKey: ["blocks", queryParams],
    queryFn: () => residentsApi.getBlocks(queryParams),
    retry: 1,
    staleTime: 30_000,
  });

  const blocks = normalizeList<Record<string, unknown>>(raw?.data ?? raw);

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-700">Failed to load blocks</p>
        <p className="mt-1 text-sm text-red-500">{(error as Error)?.message ?? "Network error"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Residents / Block &amp; Wing</p>
          <h1 className="text-2xl font-bold text-gray-900">Block / Wing Management</h1>
          <p className="mt-1 text-sm text-gray-500">
            {isLoading
              ? "Loading…"
              : `${blocks.length} block${blocks.length !== 1 ? "s" : ""} in ${society?.society_name ?? "this society"}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Plus size={15} />
          Add Block
        </button>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-44 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      )}

      {!isLoading && blocks.length === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-gray-200 p-14 text-center">
          <Building size={44} className="mx-auto mb-3 text-gray-300" />
          <p className="text-base font-semibold text-gray-600">No blocks found</p>
          <p className="mt-1 text-sm text-gray-400">Click "Add Block" to create the first block for this society.</p>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus size={14} /> Add Block
          </button>
        </div>
      )}

      {!isLoading && blocks.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {blocks.map((block, idx) => {
            const total = Number(block.total_units ?? 0);
            const occupied = Number(block.occupied_units ?? block.occupied ?? 0);
            const pct = total > 0 ? Math.round((occupied / total) * 100) : 0;
            const key = String(block.block_id ?? block.id ?? idx);
            return (
              <div
                key={key}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                    <Building size={20} />
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      block.is_active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {block.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <h3 className="mt-3 truncate text-lg font-bold text-gray-900">
                  {String(block.block_name ?? "Unnamed Block")}
                </h3>
                <p className="text-sm text-gray-500">
                  {Number(block.total_floors ?? 0)} Floors · {total} Units
                </p>
                {block.description && (
                  <p className="mt-1 line-clamp-1 text-xs text-gray-400">{String(block.description)}</p>
                )}
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-xs text-gray-500">Occupancy</span>
                    <span className="text-xs font-bold text-gray-900">{pct}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        pct > 80 ? "bg-green-500" : pct > 50 ? "bg-blue-500" : "bg-orange-400"
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">{occupied} / {total} occupied</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {addOpen && (
        <AddBlockModal
          societyId={Number(society?.society_id ?? queryParams.society_id ?? 1)}
          onClose={() => setAddOpen(false)}
        />
      )}
    </div>
  );
}
