import { normalizeList } from "@ams/utils";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Building,
  Loader2,
  Plus,
  X,
  ChevronDown,
} from "lucide-react";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { residentsApi } from "@/api/residents.api";
import { useScope } from "@/app/scope/ScopeProvider";

function AddBlockModal({
  societyId,
  onClose,
}: {
  societyId: number;
  onClose: () => void;
}) {
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

      qc.invalidateQueries({
        queryKey: ["blocks"],
      });

      onClose();
    },

    onError: (e: any) => {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Failed to create block"
      );
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">
            Add New Block
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Block Name
            </label>

            <input
              value={blockName}
              onChange={(e) =>
                setBlockName(e.target.value)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Floors
            </label>

            <input
              type="number"
              value={floors}
              onChange={(e) =>
                setFloors(e.target.value)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>

            <textarea
              rows={2}
              value={desc}
              onChange={(e) =>
                setDesc(e.target.value)
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={
              !blockName.trim() || mut.isPending
            }
            onClick={() => mut.mutate()}
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm text-white"
          >
            {mut.isPending ? (
              <Loader2
                size={14}
                className="animate-spin"
              />
            ) : (
              "Add Block"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function BlockWingPage() {
  const { queryParams, society } = useScope();

  const qpAny: any = queryParams;

  const [addOpen, setAddOpen] =
    useState(false);

  const [expandedBlock, setExpandedBlock] =
    useState<string | null>(null);

  const safeParams = {
    society_id:
      qpAny?.society_id || undefined,

    block_id:
      qpAny?.block_id || undefined,

    search:
      qpAny?.search || undefined,
  };

  useEffect(() => {
    setExpandedBlock(null);
  }, [safeParams.society_id]);

  const {
    data: raw,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: [
      "blocks",
      safeParams.society_id,
      safeParams.block_id,
      safeParams.search,
    ],

    queryFn: async () => {
      const res =
        await residentsApi.getBlocks(
          safeParams
        );

      return res;
    },

    retry: 1,
  });

  const blocks = raw
    ? normalizeList<Record<string, any>>(
        (raw as any)?.data ?? raw
      ) ?? []
    : [];

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
        <p className="font-medium text-red-700">
          Failed to load blocks
        </p>

        <p className="mt-1 text-sm text-red-500">
          {(error as Error)?.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">
            Residents / Block & Wing
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Block / Wing Management
          </h1>
        </div>

        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          <Plus size={15} />
          Add Block
        </button>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500">
          Loading...
        </div>
      ) : (
        <>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(340px,1fr))]">
            {blocks.map((block, idx) => {
              const total = Number(
                block.total_units ?? 0
              );

              const occupied = Number(
                block.occupied_units ?? 0
              );

              const pct =
                total > 0
                  ? Math.round(
                      (occupied / total) * 100
                    )
                  : 0;

              const key = String(
                block.block_id ??
                  block.id ??
                  idx
              );

              const isOpen =
                expandedBlock === key;

              return (
                <div
                  key={key}
                  className="rounded-2xl border bg-white p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <Building size={20} />
                      </div>

                      <div>
                        <div className="font-medium text-gray-900">
                          {block.block_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {
                            block.total_floors
                          }{" "}
                          Floors · {total} Units
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        setExpandedBlock(
                          isOpen
                            ? null
                            : key
                        )
                      }
                      className="rounded p-2 hover:bg-gray-100"
                    >
                      <ChevronDown
                        size={18}
                        className={`transition-transform ${
                          isOpen
                            ? "rotate-180"
                            : ""
                        }`}
                      />
                    </button>
                  </div>

                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span>
                        Occupancy
                      </span>

                      <span>
                        {pct}%
                      </span>
                    </div>

                    <div className="h-2 rounded-full bg-gray-100">
                      <div
                        className="h-2 rounded-full bg-blue-500"
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {occupied} / {total} occupied
                    </div>
                  </div>

                  {isOpen && (
                    <div className="mt-4 border-t pt-4">
                      <BlockUnitsList
                        blockId={key}
                        queryParams={
                          queryParams
                        }
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {addOpen && (
        <AddBlockModal
          societyId={Number(
            society?.society_id ??
              queryParams?.society_id ??
              1
          )}
          onClose={() =>
            setAddOpen(false)
          }
        />
      )}
    </div>
  );
}

function BlockUnitsList({
  blockId,
  queryParams,
}: {
  blockId: string;
  queryParams: any;
}) {
  const safeParams = {
    society_id:
      queryParams?.society_id ||
      undefined,
  };

  const {
    data,
    isLoading,
  } = useQuery({
    queryKey: [
      "units",
      safeParams.society_id,
      blockId,
    ],

    queryFn: async () => {
      const res =
        await residentsApi.getUnits({
          society_id:
            safeParams.society_id,

          block_id: blockId,

          page: 1,
          page_size: 500,
        });

      return res;
    },

    enabled: !!blockId,
  });

  const units =
    (data as any)?.data ??
    (data as any)?.items ??
    [];

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500">
        Loading units...
      </div>
    );
  }

  if (!units.length) {
    return (
      <div className="py-6 text-center text-sm text-gray-500">
        No units found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {units.map((u: any) => {
        const owner =
          u.owner_name || "—";

        const tenant =
          u.tenant_name || "—";

        const status =
          tenant !== "—"
            ? "RENTED"
            : owner !== "—"
            ? "OWNER OCCUPIED"
            : "VACANT";

        return (
          <div
            key={u.unit_id}
            className="rounded-lg border p-3"
          >
            <div className="grid grid-cols-6 gap-3 text-sm">
              <div>
                <div className="text-xs text-gray-500">
                  Unit
                </div>

                <div className="font-medium">
                  {u.unit_number}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Floor
                </div>

                <div>
                  {u.floor_number}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Owner
                </div>

                <div>
                  {owner}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Tenant
                </div>

                <div>
                  {tenant}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Status
                </div>

                <div>
                  {status}
                </div>
              </div>

              <div>
                <div className="text-xs text-gray-500">
                  Parking
                </div>

                <div>
                  {u.parking_slots ?? 0}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}