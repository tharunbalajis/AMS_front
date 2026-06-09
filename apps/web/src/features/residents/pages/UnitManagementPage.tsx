
import {
  Button,
  DataTable,
  SearchBox,
  Select,
} from "@ams/ui";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  Home,
  Loader2,
  Plus,
  X,
} from "lucide-react";

import {
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
import { useFilterReset } from "@/hooks/useFilterReset";
import { QK } from "@/lib/queryKeys";

/* -------------------------------------------------- */
/* ADD UNIT MODAL */
/* -------------------------------------------------- */

function AddUnitModal({
  societyId,
  onClose,
}: {
  societyId: number;
  onClose: () => void;
}) {

  const qc =
    useQueryClient();

  const [form, setForm] =
    useState({

      block_id: "",

      unit_number: "",

      floor_number: "1",

      unit_type: "2BHK",

      ownership_type:
        "OWNED",

      parking_slots: "1",
    });

  /* -------------------------------------------------- */
  /* BLOCKS */
/* -------------------------------------------------- */

  const {
    data: blocks = [],
  } = useQuery<Block[]>({

    queryKey: [
      "blocks",
      societyId,
    ],

    queryFn: async () => {

      return await residentsApi.getBlocks({
        society_id:
          societyId,
      });
    },

    enabled:
      !!societyId,

    staleTime: 0,

    gcTime: 0,
  });

  /* -------------------------------------------------- */
  /* CREATE */
/* -------------------------------------------------- */

  const mutation =
    useMutation({

      mutationFn: async () => {

        return residentsApi.createUnit({

          society_id:
            societyId,

          block_id:
            Number(
              form.block_id
            ),

          unit_number:
            form.unit_number.trim(),

          floor_number:
            Number(
              form.floor_number
            ),

          unit_type:
            form.unit_type,

          ownership_type:
            form.ownership_type,

          parking_slots:
            Number(
              form.parking_slots
            ),

          occupancy_status:
            "VACANT",

          is_active: true,
        });
      },

      onSuccess: async () => {

        toast.success(
          "Unit created"
        );

        await qc.invalidateQueries({
          queryKey: QK.units(societyId),
        });

        await qc.invalidateQueries({
          queryKey: QK.blocks(societyId),
        });

        onClose();
      },

      onError: (e: any) => {

        toast.error(
          e?.response?.data
            ?.message ||
            e?.message ||
            "Failed to create unit"
        );
      },
    });

  const isValid =
    form.block_id &&
    form.unit_number.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">

      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl">

        <div className="flex items-center justify-between border-b px-6 py-4">

          <h2 className="text-base font-semibold">
            Add New Unit
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 p-6">

          {/* BLOCK */}

          <label className="col-span-2 block">

            <span className="mb-1 block text-sm font-medium text-gray-700">
              Block *
            </span>

            <select
              value={form.block_id}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  block_id:
                    e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              <option value="">
                Select block
              </option>

              {blocks.map((b) => (

                <option
                  key={
                    b.block_id
                  }
                  value={
                    b.block_id
                  }
                >
                  {
                    b.block_name
                  }
                </option>
              ))}
            </select>
          </label>

          {/* UNIT */}

          <label className="block">

            <span className="mb-1 block text-sm font-medium text-gray-700">
              Unit Number *
            </span>

            <input
              value={
                form.unit_number
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  unit_number:
                    e.target.value,
                }))
              }
              placeholder="101"
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          {/* FLOOR */}

          <label className="block">

            <span className="mb-1 block text-sm font-medium text-gray-700">
              Floor
            </span>

            <input
              type="number"
              min="0"
              value={
                form.floor_number
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  floor_number:
                    e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>

          {/* TYPE */}

          <label className="block">

            <span className="mb-1 block text-sm font-medium text-gray-700">
              Unit Type
            </span>

            <select
              value={
                form.unit_type
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  unit_type:
                    e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {[
                "STUDIO",
                "1BHK",
                "2BHK",
                "3BHK",
                "4BHK",
                "PENTHOUSE",
                "COMMERCIAL",
              ].map((t) => (

                <option
                  key={t}
                  value={t}
                >
                  {t}
                </option>
              ))}
            </select>
          </label>

          {/* PARKING */}

          <label className="block">

            <span className="mb-1 block text-sm font-medium text-gray-700">
              Parking Slots
            </span>

            <input
              type="number"
              min="0"
              max="5"
              value={
                form.parking_slots
              }
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  parking_slots:
                    e.target.value,
                }))
              }
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="flex justify-end gap-3 border-t px-6 py-4">

          <button
            onClick={onClose}
            className="rounded-lg border px-4 py-2 text-sm"
          >
            Cancel
          </button>

          <button
            disabled={
              !isValid ||
              mutation.isPending
            }
            onClick={() =>
              mutation.mutate()
            }
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {mutation.isPending && (

              <Loader2
                size={14}
                className="animate-spin"
              />
            )}

            Add Unit
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------- */
/* MAIN PAGE */
/* -------------------------------------------------- */

export function UnitManagementPage() {

  const {
    selectedSocietyId,
  } = useScope();

  /* -------------------------------------------------- */
  /* FILTERS */
/* -------------------------------------------------- */

  const [
    blockId,
    setBlockId,
  ] = useState("");

  const [
    unitType,
    setUnitType,
  ] = useState("");

  const [
    status,
    setStatus,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    addOpen,
    setAddOpen,
  ] = useState(false);

  /* -------------------------------------------------- */
  /* RESET */
/* -------------------------------------------------- */

  useFilterReset(selectedSocietyId, () => {
    setBlockId("");
    setUnitType("");
    setStatus("");
    setSearch("");
  });

  /* -------------------------------------------------- */
  /* BLOCKS */
/* -------------------------------------------------- */

  const {
    data: blocks = [],
  } = useQuery<Block[]>({

    queryKey: [
      "blocks",
      selectedSocietyId,
    ],

    queryFn: async () => {

      return residentsApi.getBlocks({
        society_id:
          selectedSocietyId,
      });
    },

    enabled:
      !!selectedSocietyId,

    staleTime: 0,

    gcTime: 0,
  });

  /* -------------------------------------------------- */
  /* UNITS */
/* -------------------------------------------------- */

  const {
    data,
    isLoading,
  } = useQuery({

    queryKey: [
      "units",
      selectedSocietyId,
      blockId,
      unitType,
      status,
      search,
    ],

    queryFn: async () => {

      const response =
        await residentsApi.getUnits({

          society_id:
            selectedSocietyId,

          block_id:
            blockId
              ? Number(
                  blockId
                )
              : undefined,

          unit_type:
            unitType ||
            undefined,

          occupancy_status:
            status ||
            undefined,

          search:
            search ||
            undefined,

          page: 1,

          page_size: 500,
        });

      console.log(
        "UNITS API RESPONSE",
        response
      );

      return response;
    },

    enabled:
      !!selectedSocietyId,

    staleTime: 0,

    gcTime: 0,

    retry: 1,
  });

  /* -------------------------------------------------- */
  /* ROWS */
/* -------------------------------------------------- */

  const rows: Unit[] =
    useMemo(() => {

      return Array.isArray(
        data?.data
      )
        ? data.data
        : [];

    }, [data]);

  return (
    <div className="space-y-6">

      {/* HEADER */}

      <div className="flex items-start justify-between gap-4">

        <div>

          <p className="text-sm text-gray-500">
            Residents / Unit Management
          </p>

          <h1 className="text-2xl font-bold text-gray-900">
            Unit Management
          </h1>

          <p className="mt-1 text-sm text-gray-500">

            {isLoading
              ? "Loading..."
              : `${rows.length} units`}
          </p>
        </div>

        <Button
          onClick={() =>
            setAddOpen(true)
          }
        >
          <Plus
            size={15}
            className="mr-1"
          />
          Add Unit
        </Button>
      </div>

      {/* FILTERS */}

      <div className="flex flex-wrap gap-3">

        <SearchBox
          className="min-w-[200px] flex-1"
          placeholder="Search unit..."
          value={search}
          onChange={(e) =>
            setSearch(
              e.target.value
            )
          }
        />

        {/* BLOCK */}

        <Select
          className="w-44"
          value={blockId}
          onChange={(e) =>
            setBlockId(
              e.target.value
            )
          }
        >
          <option value="">
            All Blocks
          </option>

          {blocks.map((b) => (

            <option
              key={
                b.block_id
              }
              value={
                b.block_id
              }
            >
              {
                b.block_name
              }
            </option>
          ))}
        </Select>

        {/* TYPE */}

        <Select
          className="w-44"
          value={unitType}
          onChange={(e) =>
            setUnitType(
              e.target.value
            )
          }
        >
          <option value="">
            All Types
          </option>

          {[
            "STUDIO",
            "1BHK",
            "2BHK",
            "3BHK",
            "4BHK",
            "PENTHOUSE",
          ].map((t) => (

            <option
              key={t}
              value={t}
            >
              {t}
            </option>
          ))}
        </Select>

        {/* STATUS */}

        <Select
          className="w-44"
          value={status}
          onChange={(e) =>
            setStatus(
              e.target.value
            )
          }
        >
          <option value="">
            All Status
          </option>

          <option value="OWNER_OCCUPIED">
            Owner Occupied
          </option>

          <option value="RENTED">
            Rented
          </option>

          <option value="VACANT">
            Vacant
          </option>
        </Select>
      </div>

      {/* EMPTY */}

      {!isLoading &&
      rows.length === 0 ? (

        <div className="rounded-xl border border-dashed border-gray-300 p-12 text-center">

          <Home
            size={40}
            className="mx-auto mb-3 text-gray-300"
          />

          <p className="font-medium text-gray-600">
            No units found
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Click Add Unit
            to create units.
          </p>
        </div>

      ) : (

        <DataTable
          title="Units"

          rows={rows.map(
            (r, i) => ({
              ...r,
              __rowKey:
                r.unit_id ||
                i,
            })
          )}

          isLoading={
            isLoading
          }

          columns={[

            {
              key:
                "unit_number",

              header:
                "UNIT NO",
            },

            {
              key:
                "block_name",

              header:
                "BLOCK",
            },

            {
              key:
                "floor_number",

              header:
                "FLOOR",

              render: (
                row: any
              ) => (
                <span>
                  {String(
                    row.floor_number ??
                      "-"
                  )}
                </span>
              ),
            },

            {
              key:
                "unit_type",

              header:
                "TYPE",
            },

            {
              key:
                "owner_name",

              header:
                "OWNER",

              render: (
                row: any
              ) => (
                <span>
                  {String(
                    row.owner_name ??
                      "—"
                  )}
                </span>
              ),
            },

            {
              key:
                "tenant_name",

              header:
                "TENANT",

              render: (
                row: any
              ) => (
                <span>
                  {String(
                    row.tenant_name ??
                      "—"
                  )}
                </span>
              ),
            },

            {
              key:
                "occupancy_status",

              header:
                "STATUS",

              render: (
                row: any
              ) => {

                const s =
                  String(
                    row.occupancy_status ??
                      "VACANT"
                  );

                const cls =
                  s ===
                  "RENTED"
                    ? "bg-blue-100 text-blue-800"
                    : s ===
                      "OWNER_OCCUPIED"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-700";

                return (
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
                  >
                    {s.replace(
                      "_",
                      " "
                    )}
                  </span>
                );
              },
            },

            {
              key:
                "parking_slots",

              header:
                "PARKING",
            },
          ]}
        />
      )}

      {/* MODAL */}

      {addOpen &&
        selectedSocietyId && (

        <AddUnitModal
          societyId={
            selectedSocietyId
          }
          onClose={() =>
            setAddOpen(false)
          }
        />
      )}
    </div>
  );
}
