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
} from "lucide-react";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { toast } from "sonner";

import {
  residentsApi,
  Block,
  Unit,
} from "@/api/residents.api";

import { useScope } from "@/app/scope/ScopeProvider";

/* ====================================================== */
/* ADD BLOCK MODAL */
/* ====================================================== */

function AddBlockModal({
  societyId,
  onClose,
}: {
  societyId: number;
  onClose: () => void;
}) {

  const qc =
    useQueryClient();

  const [
    blockName,
    setBlockName,
  ] = useState("");

  const [
    floors,
    setFloors,
  ] = useState("5");

  const [
    desc,
    setDesc,
  ] = useState("");

  const mut =
    useMutation({

      mutationFn: () =>
        residentsApi.createBlock({

          society_id:
            societyId,

          block_name:
            blockName.trim(),

          total_floors:
            Number(floors) || 1,

          description:
            desc.trim() || null,
        }),

      onSuccess: async () => {

        toast.success(
          "Block created successfully"
        );

        await qc.invalidateQueries({
          queryKey: ["blocks"],
        });

        onClose();
      },

      onError: (e: any) => {

        toast.error(

          e?.response?.data
            ?.message ||

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
                setBlockName(
                  e.target.value
                )
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
                setFloors(
                  e.target.value
                )
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
                setDesc(
                  e.target.value
                )
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
              !blockName.trim() ||
              mut.isPending
            }
            onClick={() =>
              mut.mutate()
            }
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

/* ====================================================== */
/* MAIN PAGE */
/* ====================================================== */

export function BlockWingPage() {

  const {
    queryParams,
    society,
  } = useScope();

  const qc =
    useQueryClient();

  const [
    addOpen,
    setAddOpen,
  ] = useState(false);

  const [
    expandedBlock,
    setExpandedBlock,
  ] = useState<number | null>(
    null
  );

  /* ====================================================== */
  /* SOCIETY ID */
  /* ====================================================== */

  const societyId =
    useMemo(() => {

      return Number(

        queryParams?.society_id ??

        society?.society_id ??

        0

      ) || undefined;

    }, [

      queryParams?.society_id,

      society?.society_id,
    ]);

  /* ====================================================== */
  /* RESET EXPANDED BLOCK */
  /* ====================================================== */

  useEffect(() => {

    setExpandedBlock(
      null
    );

    qc.removeQueries({
      queryKey: [
        "block-units",
      ],
    });

  }, [
    societyId,
    qc,
  ]);

  /* ====================================================== */
  /* BLOCKS QUERY */
  /* ====================================================== */

  const {
    data: blocks = [],
    isLoading,
    isError,
    error,
  } = useQuery<Block[]>({

    queryKey: [
      "blocks",
      societyId,
    ],

    enabled:
      !!societyId,

    queryFn: async () => {

      const response =
        await residentsApi.getBlocks({

          society_id:
            societyId,
        });

      return Array.isArray(
        response
      )
        ? response
        : [];
    },

    staleTime: 0,

    gcTime: 0,

    retry: 1,
  });

  return (
    <div className="space-y-6">

      {/* HEADER */}

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
          onClick={() =>
            setAddOpen(true)
          }
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white"
        >
          <Plus size={15} />
          Add Block
        </button>
      </div>

      {/* LOADING */}

      {isLoading ? (

        <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">

          {[1, 2, 3].map(
            (i) => (

              <div
                key={i}
                className="animate-pulse rounded-2xl border bg-white p-4"
              >

                <div className="mb-3 h-6 w-32 rounded bg-gray-200" />

                <div className="mb-2 h-3 w-full rounded bg-gray-100" />

                <div className="h-3 w-3/4 rounded bg-gray-100" />
              </div>
            )
          )}
        </div>

      ) : isError ? (

        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">

          <p className="font-medium text-red-700">
            Failed to load blocks
          </p>

          <p className="mt-1 text-sm text-red-500">
            {(error as Error)?.message}
          </p>
        </div>

      ) : blocks.length === 0 ? (

        <div className="rounded-xl border border-gray-100 p-8 text-center">

          <p className="font-medium text-gray-700">
            No blocks found
          </p>
        </div>

      ) : (

        <>
          <div className="grid gap-4 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">

            {blocks.map((b) => {

              const total =
                Number(
                  b.total_units ?? 0
                );

              const occupied =
                Number(
                  b.occupied_units ?? 0
                );

              const pct =
                total > 0
                  ? Math.round(
                      (occupied / total) * 100
                    )
                  : 0;

              const barClass =
                pct > 80
                  ? "bg-green-500"
                  : pct > 50
                  ? "bg-blue-500"
                  : "bg-orange-500";

              const isOpen =
                expandedBlock ===
                b.block_id;

              return (

                <div
                  key={b.block_id}
                  className="rounded-2xl border bg-white p-4"
                >

                  <div className="flex items-start justify-between">

                    <div className="flex items-center gap-3">

                      <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600">
                        <Building size={20} />
                      </div>

                      <div>

                        <div className="font-medium text-gray-900">
                          {b.block_name}
                        </div>

                        <div className="text-xs text-gray-500">
                          {b.total_floors} Floors · {total} Units
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {

                        setExpandedBlock(
                          current =>
                            current === b.block_id
                              ? null
                              : b.block_id
                        );
                      }}
                      className="rounded p-2 hover:bg-gray-100"
                    >
                      ▼
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
                        className={`h-2 rounded-full ${barClass}`}
                        style={{
                          width: `${pct}%`,
                        }}
                      />
                    </div>

                    <div className="mt-1 text-xs text-gray-500">
                      {occupied} / {total} occupied
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {expandedBlock !==
            null && (

            <div className="mt-6">

              <BlockUnitsPanel
                blockId={
                  expandedBlock
                }
                societyId={
                  societyId
                }
                onClose={() =>
                  setExpandedBlock(
                    null
                  )
                }
              />
            </div>
          )}
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

/* ====================================================== */
/* BLOCK UNITS PANEL */
/* ====================================================== */

function BlockUnitsPanel({
  blockId,
  societyId,
  onClose,
}: {
  blockId: number;
  societyId?: number;
  onClose: () => void;
}) {

  const {
    data: units = [],
    isLoading,
    isError,
    error,
  } = useQuery<Unit[]>({

    queryKey: [
      "block-units",
      societyId,
      blockId,
    ],

    enabled:
      !!blockId &&
      !!societyId,

    queryFn: async () => {

      if (
        !societyId ||
        !blockId
      ) {

        return [];
      }

      const response =
        await residentsApi.getUnits({

          society_id:
            Number(
              societyId
            ),

          block_id:
            Number(
              blockId
            ),

          page: 1,

          page_size: 500,
        });

      return Array.isArray(
        response
      )
        ? response
        : [];
    },

    staleTime: 0,

    gcTime: 0,

    retry: 1,
  });

  if (isLoading) {

    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-gray-500">
        Loading units...
      </div>
    );
  }

  if (isError) {

    return (
      <div className="rounded-lg border bg-white p-6 text-sm text-red-500">

        Failed to load units

        <div className="mt-1 text-xs">
          {(error as Error)?.message}
        </div>
      </div>
    );
  }

  if (!units.length) {

    return (
      <div className="rounded-lg border bg-white py-6 text-center text-sm text-gray-500">
        No units found
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white p-4">

      <div className="flex items-center justify-between">

        <h3 className="text-base font-semibold">
          Units
        </h3>

        <button
          type="button"
          onClick={onClose}
          className="text-sm text-gray-500"
        >
          Close
        </button>
      </div>

      <div className="mt-4 overflow-x-auto">

        <table className="w-full text-sm">

          <thead>

            <tr className="text-left text-xs text-gray-500">

              <th className="px-2 py-2">
                Unit No
              </th>

              <th className="px-2 py-2">
                Floor
              </th>

              <th className="px-2 py-2">
                Type
              </th>

              <th className="px-2 py-2">
                Owner
              </th>

              <th className="px-2 py-2">
                Tenant
              </th>

              <th className="px-2 py-2">
                Status
              </th>

              <th className="px-2 py-2">
                Parking
              </th>
            </tr>
          </thead>

          <tbody>

            {units.map((u) => (

              <tr
                key={u.unit_id}
                className="border-t"
              >

                <td className="px-2 py-3">
                  {u.unit_number}
                </td>

                <td className="px-2 py-3">
                  {u.floor_number ?? "—"}
                </td>

                <td className="px-2 py-3">
                  {u.unit_type ?? "—"}
                </td>

                <td className="px-2 py-3">
                  {u.owner_name ?? "—"}
                </td>

                <td className="px-2 py-3">
                  {u.tenant_name ?? "—"}
                </td>

                <td className="px-2 py-3">

                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                      u.occupancy_status === "RENTED"
                        ? "bg-blue-100 text-blue-800"
                        : u.occupancy_status === "OWNER_OCCUPIED"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {u.occupancy_status}
                  </span>
                </td>

                <td className="px-2 py-3">
                  {u.parking_slots ?? 0}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}